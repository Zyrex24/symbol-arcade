import { useEffect, useRef, useState, useCallback } from "react";
import GameContainer from "./GameContainer";
import { useWasmLoader } from "../hooks/useWasmLoader";
import type { WasmModule } from "../types/wasm.js";
import "../styles/Games.css";

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

// Default level used internally in WASM; UI has no difficulty controls.
const DEFAULT_LEVEL = 2;

export default function PacmanGame({ onBack }: { onBack: () => void }) {
  const { wasmRef, isLoaded, error } = useWasmLoader("Pacman");
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [width, setWidth] = useState(28);
  const [board, setBoard] = useState<(string | number)[]>([]);
  const [gameError, setGameError] = useState<string | null>(null);
  const tickRef = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const readBoard = useCallback(() => {
    try {
      const mod: WasmModule | null = wasmRef.current;
      if (!mod) return;
      const w = mod._pacman_get_width?.() ?? 19;
      const h = mod._pacman_get_height?.() ?? 21;
      setWidth(w);
      const cells: (string | number)[] = [];
      if (mod._pacman_get_cell) {
        for (let i = 0; i < w * h; i++) {
          const v = mod._pacman_get_cell(i);
          const char = v > 0 ? String.fromCharCode(v) : "";
          cells.push(char);
        }
      }
      setBoard(cells);
      setScore(mod._pacman_get_score?.() ?? 0);
      setGameOver(!!(mod._pacman_is_game_over?.() ?? 0));
    } catch (err) {
      console.error("[PACMAN] readBoard error:", err);
      setGameError(String(err));
    }
  }, [wasmRef]);

  const startGame = useCallback(() => {
    try {
      const mod: WasmModule | null = wasmRef.current;
      if (!mod?._pacman_start_game) return;
      mod._pacman_start_game(DEFAULT_LEVEL);
      setGameOver(false);
      setStarted(true);
      setScore(0);
      setGameError(null);
      readBoard();
    } catch (err) {
      setGameError(String(err));
    }
  }, [readBoard, wasmRef]);

  // Do not auto-start; wait for user input

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = DIRS[e.key];
      if (dir !== undefined) {
        e.preventDefault();
        const mod: WasmModule | null = wasmRef.current;
        if (!started || gameOver) return;
        if (mod?._pacman_set_direction) mod._pacman_set_direction(dir);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wasmRef, started, gameOver, startGame]);

  useEffect(() => {
    if (!isLoaded || !started || gameOver) return;

    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }

    tickRef.current = window.setInterval(() => {
      try {
        const mod: WasmModule | null = wasmRef.current;
        if (mod?._pacman_update) mod._pacman_update();
        else if (mod?._pacman_tick) mod._pacman_tick();
        readBoard();
      } catch (err) {
        console.error("[PACMAN] renderLoop error:", err);
        setGameError(String(err));
      }
    }, 90);

    return () => {
      if (tickRef.current !== null) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [isLoaded, readBoard, wasmRef, started, gameOver]);

  const classifyCell = (raw: string | number): string => {
    let char = "";
    if (typeof raw === "number") char = raw > 0 ? String.fromCharCode(raw) : "";
    else char = String(raw);
    if (char === "#") return "wall";
    if (char === ".") return "pellet";
    if (char === "o") return "power";
    if (char === "P") return "pacman";
    if (char === "G") return "ghost";
    return "empty";
  };

  const renderCell = (kind: string, i: number) => {
    if (kind === "pellet") {
      return (
        <div key={i} className="relative aspect-square bg-gray-800 rounded-sm">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-amber-300 rounded-full shadow" />
          </div>
        </div>
      );
    }
    if (kind === "power") {
      return (
        <div key={i} className="relative aspect-square bg-gray-800 rounded-sm">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-amber-300 rounded-full shadow" />
          </div>
        </div>
      );
    }
    const cls =
      kind === "wall"
        ? "bg-blue-700"
        : kind === "pacman"
        ? "bg-yellow-300"
        : kind === "ghost"
        ? "bg-red-400"
        : "bg-gray-800";
    return <div key={i} className={`aspect-square rounded-sm ${cls}`} />;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) return; // ignore tiny moves
    const mod: WasmModule | null = wasmRef.current;
    if (!mod?._pacman_set_direction || !started || gameOver) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      mod._pacman_set_direction(dx > 0 ? 1 : 3);
    } else {
      mod._pacman_set_direction(dy > 0 ? 2 : 0);
    }
  };

  if (error) {
    return (
      <GameContainer title="Pacman" onBack={onBack}>
        <div className="text-center text-red-600">
          <h3 className="text-xl font-semibold mb-1">Error loading game</h3>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </GameContainer>
    );
  }

  if (gameError) {
    return (
      <GameContainer title="Pacman" onBack={onBack}>
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
      <GameContainer title="Pacman" onBack={onBack}>
        <div className="text-center">
          <div className="w-9 h-9 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading game...</p>
        </div>
      </GameContainer>
    );
  }

  return (
    <GameContainer title="Pacman" onBack={onBack}>
      <div className="w-full flex flex-col items-center gap-3">
        <div className="flex items-center justify-center gap-3 text-white">
          <div className="px-3 py-1 rounded-lg bg-yellow-500 shadow">
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
        </div>

        <div
          className={`relative pacman-board ${
            width === 28 ? "pacman-board-cols-28" : ""
          }`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {board.map((v, i) => renderCell(classifyCell(v), i))}
        </div>

        <div className="text-gray-600 text-sm text-center px-4">
          {!started
            ? "Press Start Game to begin"
            : "Use Arrow Keys/WASD on desktop or swipe on mobile."}
        </div>
      </div>
    </GameContainer>
  );
}
