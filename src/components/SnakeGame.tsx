import { useEffect, useRef, useState, useCallback } from "react";
import GameContainer from "./GameContainer";
import { useWasmLoader } from "../hooks/useWasmLoader";
import type { WasmModule } from "../types/wasm";
import "../styles/Games.css";

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
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [width, setWidth] = useState(20);
  const [moveIntervalMs, setMoveIntervalMs] = useState(150);
  // height is currently fixed by WASM and not used in layout classes
  const [board, setBoard] = useState<(string | number)[]>([]);
  const [gameError, setGameError] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const tickRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Minimal board reader - just display what C++ gives us
  const readBoard = useCallback(() => {
    try {
      const mod = wasmRef.current;
      if (!mod) return;

      const w = mod._snake_get_width?.() ?? 20;
      const h = mod._snake_get_height?.() ?? 20;
      setWidth(w);
      // height (h) is provided by WASM but not needed for grid styling

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
      const mod: WasmModule | null = wasmRef.current;
      if (!mod?._snake_start_game) return;
      mod._snake_set_difficulty?.(2);
      mod._snake_start_game();
      setGameOver(false);
      setStarted(true);
      setScore(0);
      setGameError(null);
      setMoveIntervalMs(mod._snake_get_move_interval_ms?.() ?? 150);
      readBoard();
    } catch (err) {
      console.error("Error in startGame:", err);
      setGameError(`Game start error: ${err}`);
    }
  }, [readBoard, wasmRef]);

  const applyDirection = useCallback(
    (dir: number) => {
      const mod = wasmRef.current;
      if (!mod) return;
      if (!started || gameOver) return;
      mod._snake_set_direction?.(dir);
    },
    [gameOver, started, wasmRef]
  );

  // Do not auto-start. Wait for user input (click or key press).

  // Simple input - just pass to C++, let C++ handle everything
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = DIRS[e.key];
      if (!wasmRef.current) return;

      // Start or restart on any movement key
      if (dir !== undefined) {
        e.preventDefault();
        applyDirection(dir);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [applyDirection, wasmRef]);

  // Stable fixed-step loop driven by JS to avoid mixed timing jitter.
  useEffect(() => {
    if (!isLoaded || !started || gameOver) return;

    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }

    tickRef.current = window.setInterval(() => {
      try {
        const mod = wasmRef.current;
        if (mod?._snake_update) mod._snake_update();
        else if (mod?._snake_tick) mod._snake_tick();
        readBoard();
      } catch (err) {
        console.error("Error in render loop:", err);
        setGameError(`Render error: ${err}`);
      }
    }, moveIntervalMs);

    return () => {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [isLoaded, gameOver, moveIntervalMs, readBoard, started, wasmRef]);

  // Focus mode turns snake into a dedicated play window and prevents page scroll.
  useEffect(() => {
    if (!focusMode) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const blockScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    document.addEventListener("touchmove", blockScroll, { passive: false });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      document.removeEventListener("touchmove", blockScroll);
    };
  }, [focusMode]);

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
    return "empty";
  };

  const boardView = (
    <div
      className={`relative snake-board ${width === 20 ? "snake-board-cols-20" : ""}`}
      onTouchStart={(e) => {
        e.preventDefault();
        if (e.touches[0]) {
          touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        }
      }}
      onTouchMove={(e) => {
        e.preventDefault();
      }}
      onTouchEnd={(e) => {
        const start = touchStartRef.current;
        const end = e.changedTouches[0];
        if (!start || !end) return;

        const dx = end.clientX - start.x;
        const dy = end.clientY - start.y;
        const threshold = 24;
        if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

        if (Math.abs(dx) > Math.abs(dy)) {
          applyDirection(dx > 0 ? 1 : 3);
        } else {
          applyDirection(dy > 0 ? 2 : 0);
        }
        touchStartRef.current = null;
      }}
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
          />
        );
      })}
    </div>
  );

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
          <button
            onClick={startGame}
            className="px-4 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow transition-colors"
          >
            {!started || gameOver ? "Start Game" : "Restart"}
          </button>
          <button
            onClick={() => setFocusMode(true)}
            className="px-4 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow transition-colors sm:hidden"
          >
            Open Play Window
          </button>
        </div>

        {/* Board */}
        {boardView}
        {gameOver && (
          <div className="w-full max-w-md text-center bg-red-600/90 text-white rounded-xl px-4 py-3 shadow">
            <div className="font-bold text-lg">You Lost</div>
            <div className="text-sm opacity-95">Final score: {score}. Press Restart to try again.</div>
          </div>
        )}
        <div className="text-white/80 text-sm">
          {!started ? (
            <span>Press Start Game to begin</span>
          ) : (
            <>
              <span className="hidden sm:inline">Use Arrow Keys or WASD</span>
              <span className="sm:hidden">Swipe on board to move</span>
            </>
          )}
        </div>
      </div>

      {focusMode && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 sm:hidden">
          <div className="w-full max-w-md flex items-center justify-between mb-3 text-white">
            <div className="px-3 py-1 rounded-lg bg-emerald-600 shadow">Score: {score}</div>
            <button
              onClick={() => setFocusMode(false)}
              className="px-3 py-1 rounded-lg bg-gray-700 text-white font-semibold"
            >
              Close
            </button>
          </div>

          <div className="w-full max-w-md">{boardView}</div>

          <div className="mt-3 flex gap-3">
            <button
              onClick={startGame}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold"
            >
              {!started || gameOver ? "Start" : "Restart"}
            </button>
            {gameOver && (
              <div className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold">
                You Lost - Score {score}
              </div>
            )}
          </div>
        </div>
      )}
    </GameContainer>
  );
}
