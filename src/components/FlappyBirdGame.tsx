import { useCallback, useEffect, useRef, useState } from "react";
import GameContainer from "./GameContainer";
import "../styles/Games.css";
import { useWasmLoader } from "../hooks/useWasmLoader";
import type { WasmModule } from "../types/wasm.js";

export default function FlappyBirdGame({ onBack }: { onBack: () => void }) {
  const { wasmRef, isLoaded, error } = useWasmLoader("FlappyBird");
  const [width, setWidth] = useState(28);
  const [board, setBoard] = useState<(string | number)[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [gameError, setGameError] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  const readBoard = useCallback(() => {
    try {
      const mod: WasmModule | null = wasmRef.current;
      if (!mod) return;
      const w = mod._flappy_get_width?.() ?? 28;
      const h = mod._flappy_get_height?.() ?? 20;
      setWidth(w);
      const cells: (string | number)[] = [];
      if (mod._flappy_get_cell) {
        for (let i = 0; i < w * h; i++) {
          const v = mod._flappy_get_cell(i);
          const char = v > 0 ? String.fromCharCode(v) : "";
          cells.push(char);
        }
      }
      setBoard(cells);
      setScore(mod._flappy_get_score?.() ?? 0);
      setGameOver(!!(mod._flappy_is_game_over?.() ?? 0));
    } catch (err) {
      setGameError(String(err));
    }
  }, [wasmRef]);

  const startGame = useCallback(() => {
    try {
      const mod: WasmModule | null = wasmRef.current;
      if (!mod?._flappy_start_game) return;
      mod._flappy_start_game();
      setGameOver(false);
      setScore(0);
      setGameError(null);
      readBoard();
    } catch (err) {
      setGameError(String(err));
    }
  }, [readBoard, wasmRef]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      const saved = localStorage.getItem("flappy_best");
      if (saved) setBestScore(parseInt(saved, 10) || 0);
    } catch (err) {
      console.error("Failed to load best score:", err);
    }
    const t = setTimeout(() => startGame(), 100);
    return () => clearTimeout(t);
  }, [isLoaded, startGame]);

  useEffect(() => {
    if (!isLoaded) return;

    const boardElement = document.querySelector(".flappy-board");
    if (!boardElement) return;

    const onPointer = (e: Event) => {
      e.preventDefault();
      const mod: WasmModule | null = wasmRef.current;
      if (!mod) return;
      if (gameOver) {
        // Restart on click when game over
        startGame();
        return;
      }
      if (mod._flappy_flap) mod._flappy_flap();
    };

    boardElement.addEventListener("mousedown", onPointer);
    boardElement.addEventListener("touchstart", onPointer, { passive: false });

    return () => {
      boardElement.removeEventListener("mousedown", onPointer);
      boardElement.removeEventListener("touchstart", onPointer);
    };
  }, [wasmRef, isLoaded, gameOver, startGame]);

  useEffect(() => {
    if (!isLoaded) return;
    let last = 0;
    const loop = (ts: number) => {
      try {
        const mod: WasmModule | null = wasmRef.current;
        // Update at slower rate - every 32ms for more controlled gameplay
        if (ts - last > 32) {
          if (mod?._flappy_update) mod._flappy_update();
          else if (mod?._flappy_tick) mod._flappy_tick();
          last = ts;
        }
        readBoard();
        // update leaderboard
        const s = mod?._flappy_get_score?.() ?? 0;
        const over = !!(mod?._flappy_is_game_over?.() ?? 0);
        if (over) {
          setGameOver(true);
          setScore(s);
          setBestScore((prev) => {
            const next = s > prev ? s : prev;
            try {
              if (next > prev)
                localStorage.setItem("flappy_best", String(next));
            } catch (err) {
              console.error("Game update error:", err);
            }
            return next;
          });
        }
        animationRef.current = requestAnimationFrame(loop);
      } catch (err) {
        setGameError(String(err));
      }
    };
    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    };
  }, [isLoaded, readBoard, wasmRef]);

  const classifyCell = (raw: string | number): string => {
    let char = "";
    if (typeof raw === "number") char = raw > 0 ? String.fromCharCode(raw) : "";
    else char = String(raw);
    if (char === "#") return "pipe";
    if (char === "B") return "bird";
    return "empty";
  };

  if (error) {
    return (
      <GameContainer title="Flappy Bird" onBack={onBack}>
        <div className="text-center text-red-600">
          <h3 className="text-xl font-semibold mb-1">Error loading game</h3>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </GameContainer>
    );
  }

  if (gameError) {
    return (
      <GameContainer title="Flappy Bird" onBack={onBack}>
        <div className="text-center text-red-600">
          <h3 className="text-xl font-semibold mb-1">Game Error</h3>
          <p className="text-sm opacity-80 mb-3">{gameError}</p>
          <button
            onClick={() => {
              setGameError(null);
              setGameOver(false);
              startGame();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </GameContainer>
    );
  }

  if (!isLoaded) {
    return (
      <GameContainer title="Flappy Bird" onBack={onBack}>
        <div className="text-center">
          <div className="w-9 h-9 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading game...</p>
        </div>
      </GameContainer>
    );
  }

  return (
    <GameContainer title="Flappy Bird" onBack={onBack}>
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-4 px-4">
        {/* Removed difficulty selector: default to Normal */}

        {/* Score Display */}
        <div className="flex items-center justify-center gap-4 w-full">
          <div className="flex-1 max-w-xs bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-3 text-center">
            <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">
              Score
            </div>
            <div className="text-white text-3xl font-bold tabular-nums">
              {score}
            </div>
          </div>
          <div className="flex-1 max-w-xs bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-3 text-center">
            <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">
              Best
            </div>
            <div className="text-white text-3xl font-bold tabular-nums">
              {bestScore}
            </div>
          </div>
        </div>

        {/* Game Board with Overlays */}
        <div className="relative w-full">
          {/* Start Game Overlay - Simple text indicator */}
          {!gameOver && score === 0 && (
            <div className="absolute top-6 left-0 right-0 z-10 flex justify-center pointer-events-none">
              <div className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-full shadow-lg font-bold text-lg animate-pulse">
                👆 Click to Start
              </div>
            </div>
          )}

          {/* Game Over Overlay - Simple restart indicator */}
          {gameOver && (
            <div className="absolute inset-0 z-10 rounded-2xl flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl mb-3">
                <div className="text-4xl font-bold">Game Over!</div>
                <div className="text-xl mt-2">Score: {score}</div>
              </div>
              <div className="bg-green-400 text-gray-900 px-6 py-3 rounded-full shadow-lg font-bold text-lg animate-pulse">
                👆 Click anywhere to Restart
              </div>
            </div>
          )}

          {/* The Actual Game Board */}
          <div
            className={`flappy-board ${
              width === 28 ? "flappy-board-cols-28" : ""
            } shadow-2xl rounded-2xl overflow-hidden border-4 border-sky-900/50`}
          >
            {board.map((v, i) => {
              const kind = classifyCell(v);
              let cellClass = "aspect-square transition-colors duration-75";

              if (kind === "pipe") {
                cellClass +=
                  " bg-gradient-to-b from-emerald-600 to-emerald-800";
              } else if (kind === "bird") {
                cellClass +=
                  " bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 rounded-full shadow-lg";
              } else {
                // Sky gradient
                const row = Math.floor(i / width);
                const opacity = 50 + row * 2;
                cellClass += ` bg-sky-${
                  opacity >= 800
                    ? "800"
                    : opacity >= 700
                    ? "700"
                    : opacity >= 600
                    ? "600"
                    : "500"
                }`;
              }

              return <div key={i} className={cellClass} />;
            })}
          </div>
        </div>
      </div>
    </GameContainer>
  );
}
