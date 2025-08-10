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
  const [debug, setDebug] = useState(true); // Enable debug by default to see what's happening
  const loopRef = useRef<number | null>(null);

  const readBoard = useCallback(() => {
    const mod: any = wasmRef.current;
    if (!mod) return;

    const w = typeof mod._snake_get_width === "function" ? mod._snake_get_width() : 20;
    const h = typeof mod._snake_get_height === "function" ? mod._snake_get_height() : 20;
    setWidth(w);
    setHeight(h);

    const cells: (string | number)[] = [];
    if (typeof mod._snake_get_cell === "function") {
      console.log("[SNAKE] Using _snake_get_cell method");
      for (let i = 0; i < w * h; i++) {
        const v: number = mod._snake_get_cell(i);
        // Convert character codes to actual characters
        const char = v > 0 ? String.fromCharCode(v) : '';
        cells.push(char);
        if (i < 10) console.log(`[SNAKE] Cell ${i}: code=${v}, char='${char}'`);
      }
    } else if (typeof mod._snake_get_board === "function" && (mod as any).HEAPU8) {
      console.log("[SNAKE] Using _snake_get_board method");
      const ptr = mod._snake_get_board();
      const heap = (mod as any).HEAPU8 as Uint8Array;
      for (let i = 0; i < w * h; i++) {
        const byte = heap[ptr + i];
        const char = byte > 0 ? String.fromCharCode(byte) : '';
        cells.push(char);
        if (i < 10) console.log(`[SNAKE] Cell ${i}: byte=${byte}, char='${char}'`);
      }
    }

    setBoard(cells);

    if (typeof mod._snake_get_score === "function") {
      setScore(mod._snake_get_score());
    }
    if (typeof mod._snake_is_game_over === "function") {
      setGameOver(!!mod._snake_is_game_over());
    }

    if (debug) {
      const unique = Array.from(new Set(cells)).slice(0, 10);
      console.log("[SNAKE] board sample unique values:", unique, "w*h=", w * h);
      console.log("[SNAKE] Snake cells:", cells.filter(c => c === 'S').length);
      console.log("[SNAKE] Food cells:", cells.filter(c => c === 'F').length);
      console.log("[SNAKE] Empty cells:", cells.filter(c => c === ' ' || c === '').length);
    }
  }, [wasmRef, debug]);

  const startGame = useCallback(() => {
    const mod: any = wasmRef.current;
    if (!mod) return;
    if (typeof mod._snake_start_game === "function") {
      mod._snake_start_game();
      setGameOver(false);
      setScore(0);
      readBoard();
      if (debug) {
        // eslint-disable-next-line no-console
        console.log("[SNAKE] startGame called; exports:", Object.keys(mod));
      }
    }
  }, [readBoard, wasmRef, debug]);

  const tickOnce = useCallback(() => {
    const mod: any = wasmRef.current;
    if (!mod) return;
    const ok = mod._snake_tick?.();
    if (ok) readBoard();
    if (debug) {
      // eslint-disable-next-line no-console
      console.log("[SNAKE] tickOnce ->", ok);
    }
  }, [readBoard, wasmRef, debug]);

  // load and start
  useEffect(() => {
    if (!isLoaded) return;
    // Ensure we actually start the game once module is ready
    const t = setTimeout(() => startGame(), 0);
    return () => clearTimeout(t);
  }, [isLoaded, startGame]);

  // keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod: any = wasmRef.current;
      if (!mod || gameOver) return;
      const dir = DIRS[e.key];
      if (dir !== undefined && typeof mod._snake_set_direction === "function") {
        e.preventDefault();
        mod._snake_set_direction(dir);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gameOver, wasmRef]);

  // game loop
  useEffect(() => {
    if (!isLoaded) return;
    const mod: any = wasmRef.current;
    if (!mod) return;

    const tick = () => {
      if (gameOver) return;
      const ok = mod._snake_tick?.();
      if (ok) readBoard();
      loopRef.current = window.setTimeout(tick, 120) as unknown as number;
    };

    tick();
    return () => {
      if (loopRef.current) window.clearTimeout(loopRef.current as number);
      loopRef.current = null;
    };
  }, [gameOver, isLoaded, readBoard, wasmRef]);

  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `repeat(${width}, 1fr)`,
    width: "min(92vw, 560px)",
  }), [width]);

  const classifyCell = (raw: string | number): string => {
    // Convert to string if it's a number (character code)
    let char = '';
    if (typeof raw === "number") {
      char = raw > 0 ? String.fromCharCode(raw) : '';
    } else {
      char = String(raw);
    }
    
    // Check for snake, food, and empty
    if (char === 'S') return "snake";
    if (char === 'F') return "food";
    if (char === ' ' || char === '' || char.trim() === '') return "empty";
    
    // Fallback for any unexpected values
    if (debug) console.warn(`[SNAKE] Unknown cell value: raw=${raw}, char='${char}'`);
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
          <div className="px-3 py-1 rounded-lg bg-emerald-600 shadow">Score: {score}</div>
          {gameOver && (
            <div className="px-3 py-1 rounded-lg bg-red-600 shadow">Game Over</div>
          )}
        </div>

        {/* Board */}
        <div className="grid gap-1 bg-gray-900 p-1.5 rounded-xl shadow-2xl mx-auto" style={gridStyle}>
          {board.map((v, i) => {
            const kind = classifyCell(v);
            return (
              <div
                key={i}
                className={
                  `aspect-square rounded-sm ` +
                  (kind === 'snake' ? 'bg-emerald-400' : kind === 'food' ? 'bg-amber-500' : 'bg-gray-700')
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
            {gameOver ? 'Play Again' : 'Restart'}
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-gray-700 text-white text-sm"
            onClick={tickOnce}
            title="Advance one tick"
          >
            Tick
          </button>
          <button
            className={`px-3 py-2 rounded-lg text-sm ${debug ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-800'}`}
            onClick={() => setDebug((d) => !d)}
            title="Toggle debug"
          >
            Debug: {debug ? 'On' : 'Off'}
          </button>
        </div>

        {debug && (
          <div className="text-xs text-gray-300 mt-1">
            w={width} h={height} nonZero={board.filter(x => (typeof x === 'number' ? x !== 0 : String(x).trim() !== '')).length}
          </div>
        )}

        <div className="text-gray-600 text-sm">Use Arrow Keys or WASD to move</div>
      </div>
    </GameContainer>
  );
}
