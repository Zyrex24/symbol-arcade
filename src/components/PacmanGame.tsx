import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import GameContainer from "./GameContainer";
import { useWasmLoader } from "../hooks/useWasmLoader";

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

export default function PacmanGame({ onBack }: { onBack: () => void }) {
  const { wasmRef, isLoaded, error } = useWasmLoader("Pacman");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [width, setWidth] = useState(28);
  const [height, setHeight] = useState(31);
  const [board, setBoard] = useState<(string | number)[]>([]);
  const [debug, setDebug] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  const readBoard = useCallback(() => {
    try {
      const mod = wasmRef.current as any;
      if (!mod) return;
      const w = mod._pacman_get_width?.() ?? 19;
      const h = mod._pacman_get_height?.() ?? 21;
      setWidth(w);
      setHeight(h);
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
      const mod = wasmRef.current as any;
      if (!mod?._pacman_start_game) return;
      mod._pacman_start_game();
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
    const t = setTimeout(() => startGame(), 100);
    return () => clearTimeout(t);
  }, [isLoaded, startGame]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const dir = DIRS[e.key];
      if (dir !== undefined) {
        e.preventDefault();
        const mod = wasmRef.current as any;
        if (mod?._pacman_set_direction) mod._pacman_set_direction(dir);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wasmRef]);

  useEffect(() => {
    if (!isLoaded) return;
    let last = 0;
    const renderLoop = (ts: number) => {
      try {
        const mod = wasmRef.current as any;
        // Throttle updates ~10fps to keep things legible
        if (ts - last > 100) {
          if (mod?._pacman_update) mod._pacman_update();
          else if (mod?._pacman_tick) mod._pacman_tick();
          last = ts;
        }
        readBoard();
        animationRef.current = requestAnimationFrame(renderLoop);
      } catch (err) {
        console.error("[PACMAN] renderLoop error:", err);
        setGameError(String(err));
      }
    };
    animationRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
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
          <div className="px-3 py-1 rounded-lg bg-yellow-500 shadow">Score: {score}</div>
          {gameOver && (
            <div className="px-3 py-1 rounded-lg bg-red-600 shadow">Game Over</div>
          )}
        </div>

        <div className="grid gap-1 bg-gray-900 p-1.5 rounded-xl shadow-2xl mx-auto" style={gridStyle}>
          {board.map((v, i) => renderCell(classifyCell(v), i))}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium shadow hover:shadow-lg hover:-translate-y-0.5 transition"
            onClick={startGame}
          >
            {gameOver ? "Play Again" : "Restart"}
          </button>
          <button
            className={`px-3 py-2 rounded-lg text-sm ${debug ? "bg-purple-600 text-white" : "bg-gray-300 text-gray-800"}`}
            onClick={() => setDebug((d) => !d)}
            title="Toggle debug"
          >
            Debug: {debug ? "On" : "Off"}
          </button>
        </div>
        <div className="text-gray-600 text-sm">Use Arrow Keys or WASD to move</div>
      </div>
    </GameContainer>
  );
}


