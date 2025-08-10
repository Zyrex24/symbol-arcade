import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import GameContainer from "./GameContainer";
import { useWasmLoader } from "../hooks/useWasmLoader";

// Directions expected by WASM: 0=Up, 1=Right, 2=Down, 3=Left
const DIRS: Record<string, number> = {
  ArrowUp: 0,
  ArrowRight: 1,
  ArrowDown: 2,
  ArrowLeft: 3,
  w: 0,
  d: 1,
  s: 2,
  a: 3,
  W: 0,
  D: 1,
  S: 2,
  A: 3,
};

export default function SnakeGame({ onBack }: { onBack: () => void }) {
  const { wasmRef, isLoaded, error } = useWasmLoader("Snake");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [width, setWidth] = useState(20);
  const [height, setHeight] = useState(20);
  const [board, setBoard] = useState<(string | number)[]>([]);
  const [debug, setDebug] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  // Minimal board reader - just display what C++ gives us
  const readBoard = useCallback(() => {
    try {
      const mod = wasmRef.current;
      if (!mod) return;

      const w = mod._snake_get_width?.() ?? 20;
      const h = mod._snake_get_height?.() ?? 20;
      setWidth(w);
      setHeight(h);

      const cells: (string | number)[] = [];
      if (mod._snake_get_cell) {
        for (let i = 0; i < w * h; i++) {
          const v = mod._snake_get_cell(i);
          const char = v > 0 ? String.fromCharCode(v) : "";
          cells.push(char);
        }
      }
      setBoard(cells);

      // Get game state
      const newScore = mod._snake_get_score?.() ?? 0;
      const newGameOver = !!(mod._snake_is_game_over?.() ?? 0);

      setScore(newScore);
      setGameOver(newGameOver);
    } catch (err) {
      console.error("Error in readBoard:", err);
      setGameError(`Board read error: ${err}`);
    }
  }, [wasmRef]);

  const startGame = useCallback(() => {
    try {
      const mod = wasmRef.current;
      if (!mod?._snake_start_game) return;

      mod._snake_start_game();
      setGameOver(false);
      setScore(0);
      setGameError(null);
      readBoard();
    } catch (err) {
      console.error("Error in startGame:", err);
      setGameError(`Game start error: ${err}`);
    }
  }, [readBoard, wasmRef]);

  // load and start
  useEffect(() => {
    if (!isLoaded) return;
    const t = setTimeout(() => startGame(), 100);
    return () => clearTimeout(t);
  }, [isLoaded, startGame]);

  // Simple input - just pass to C++, let C++ handle everything
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = DIRS[e.key];
      if (dir !== undefined) {
        e.preventDefault();
        const mod = wasmRef.current;
        if (mod?._snake_set_direction) {
          mod._snake_set_direction(dir);
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wasmRef]);

  // Pure display loop - C++ handles its own timing, we just display
  useEffect(() => {
    if (!isLoaded) return;

    const renderLoop = () => {
      try {
        const mod = wasmRef.current;
        if (mod?._snake_update) {
          mod._snake_update(); // Let C++ update itself
        }
        readBoard(); // Just read and display
        animationRef.current = requestAnimationFrame(renderLoop);
      } catch (err) {
        console.error("Error in render loop:", err);
        setGameError(`Render error: ${err}`);
      }
    };

    animationRef.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isLoaded, readBoard, wasmRef]);

  const gridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${width}, 1fr)`,
      width: "min(92vw, 560px)",
    }),
    [width]
  );

  const classifyCell = (raw: string | number): string => {
    // Convert to string if it's a number (character code)
    let char = "";
    if (typeof raw === "number") {
      char = raw > 0 ? String.fromCharCode(raw) : "";
    } else {
      char = String(raw);
    }

    // Check for snake, food, and empty
    if (char === "S") return "snake";
    if (char === "F") return "food";
    if (char === " " || char === "" || char.trim() === "") return "empty";

    // Fallback for any unexpected values
    if (debug)
      console.warn(`[SNAKE] Unknown cell value: raw=${raw}, char='${char}'`);
    return "empty";
  };

  if (error) {
    return (
      <GameContainer title="Snake" onBack={onBack}>
        <div className="text-center text-red-600">
          <h3 className="text-xl font-semibold mb-1">Error loading game</h3>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </GameContainer>
    );
  }

  if (gameError) {
    return (
      <GameContainer title="Snake" onBack={onBack}>
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
      <GameContainer title="Snake" onBack={onBack}>
        <div className="text-center">
          <div className="w-9 h-9 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading game...</p>
        </div>
      </GameContainer>
    );
  }

  return (
    <GameContainer title="Snake" onBack={onBack}>
      <div className="w-full flex flex-col items-center gap-3">
        {/* HUD */}
        <div className="flex items-center justify-center gap-3 text-white">
          <div className="px-3 py-1 rounded-lg bg-emerald-600 shadow">
            Score: {score}
          </div>
          {gameOver && (
            <div className="px-3 py-1 rounded-lg bg-red-600 shadow">
              Game Over
            </div>
          )}
        </div>

        {/* Board */}
        <div
          className="grid gap-1 bg-gray-900 p-1.5 rounded-xl shadow-2xl mx-auto"
          style={gridStyle}
        >
          {board.map((v, i) => {
            const kind = classifyCell(v);
            return (
              <div
                key={i}
                className={
                  `aspect-square rounded-sm ` +
                  (kind === "snake"
                    ? "bg-emerald-400"
                    : kind === "food"
                    ? "bg-amber-500"
                    : "bg-gray-700")
                }
                title={debug ? String(v) : undefined}
              />
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2">
          <button
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium shadow hover:shadow-lg hover:-translate-y-0.5 transition"
            onClick={startGame}
          >
            {gameOver ? "Play Again" : "Restart"}
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-gray-700 text-white text-sm"
            onClick={() => {
              const mod = wasmRef.current;
              if (mod && typeof mod._snake_tick === "function") {
                const stillAlive = mod._snake_tick();
                if (!stillAlive) setGameOver(true);
                readBoard();
              }
            }}
            title="Advance one tick"
          >
            Tick
          </button>
          <button
            className={`px-3 py-2 rounded-lg text-sm ${
              debug ? "bg-purple-600 text-white" : "bg-gray-300 text-gray-800"
            }`}
            onClick={() => setDebug((d) => !d)}
            title="Toggle debug"
          >
            Debug: {debug ? "On" : "Off"}
          </button>
        </div>

        {debug && (
          <div className="text-xs text-gray-300 mt-1">
            w={width} h={height} nonZero=
            {
              board.filter((x) =>
                typeof x === "number" ? x !== 0 : String(x).trim() !== ""
              ).length
            }
          </div>
        )}

        <div className="text-gray-600 text-sm">
          Use Arrow Keys or WASD to move
        </div>
      </div>
    </GameContainer>
  );
}
