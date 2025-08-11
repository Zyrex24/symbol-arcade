import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameContainer from "./GameContainer";
import { useWasmLoader } from "../hooks/useWasmLoader";

export default function FlappyBirdGame({ onBack }: { onBack: () => void }) {
  const { wasmRef, isLoaded, error } = useWasmLoader("FlappyBird");
  const [width, setWidth] = useState(28);
  const [height, setHeight] = useState(20);
  const [board, setBoard] = useState<(string | number)[]>([]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [gameError, setGameError] = useState<string | null>(null);
  const animationRef = useRef<number | null>(null);

  const readBoard = useCallback(() => {
    try {
      const mod = wasmRef.current as any;
      if (!mod) return;
      const w = mod._flappy_get_width?.() ?? 28;
      const h = mod._flappy_get_height?.() ?? 20;
      setWidth(w);
      setHeight(h);
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
      const mod = wasmRef.current as any;
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
    // initialize best score from storage
    try {
      const saved = localStorage.getItem("flappy_best");
      if (saved) setBestScore(parseInt(saved, 10) || 0);
    } catch {}
    const t = setTimeout(() => startGame(), 100);
    return () => clearTimeout(t);
  }, [isLoaded, startGame]);

  useEffect(() => {
    const onPointer = (e: Event) => {
      e.preventDefault();
      const mod = wasmRef.current as any;
      if (mod?._flappy_flap) mod._flappy_flap();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        const mod = wasmRef.current as any;
        if (mod?._flappy_flap) mod._flappy_flap();
      }
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("touchstart", onPointer, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("touchstart", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [wasmRef]);

  useEffect(() => {
    if (!isLoaded) return;
    let last = 0;
    const loop = (ts: number) => {
      try {
        const mod = wasmRef.current as any;
        if (ts - last > 50) {
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
              if (next > prev) localStorage.setItem("flappy_best", String(next));
            } catch {}
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
      <div className="w-full flex flex-col items-center gap-3">
        <div className="flex items-center justify-center gap-3 text-white">
          <div className="px-3 py-1 rounded-lg bg-amber-500 shadow">Score: {score}</div>
          <div className="px-3 py-1 rounded-lg bg-emerald-600 shadow">Best: {bestScore}</div>
          {gameOver && (
            <div className="px-3 py-1 rounded-lg bg-red-600 shadow">Game Over</div>
          )}
        </div>

        <div className="grid gap-1 bg-sky-900 p-1.5 rounded-xl shadow-2xl mx-auto" style={gridStyle}>
          {board.map((v, i) => {
            const kind = classifyCell(v);
            const cls =
              kind === "pipe"
                ? "bg-emerald-700"
                : kind === "bird"
                ? "bg-yellow-300"
                : "bg-sky-800";
            return <div key={i} className={`aspect-square rounded-sm ${cls}`} />;
          })}
        </div>

        <div className="text-gray-100 text-sm">Press Space/Up or tap/click to flap</div>
        <div className="flex items-center gap-2 mt-1">
          <button
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium shadow hover:shadow-lg hover:-translate-y-0.5 transition"
            onClick={startGame}
          >
            {gameOver ? "Play Again" : "Restart"}
          </button>
        </div>
      </div>
    </GameContainer>
  );
}


