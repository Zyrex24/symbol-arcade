import { useCallback, useEffect, useRef, useState } from "react";
import GameContainer from "./GameContainer";
import "../styles/Games.css";
import { useWasmLoader } from "../hooks/useWasmLoader";
import type { WasmModule } from "../types/wasm.js";

const BIRD_X = 6;
const SIM_STEP_MS = 20;

export default function FlappyBirdGame({ onBack }: { onBack: () => void }) {
  const { wasmRef, isLoaded, error } = useWasmLoader("FlappyBird");
  const [width, setWidth] = useState(28);
  const [height, setHeight] = useState(20);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [gameError, setGameError] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const accRef = useRef<number>(0);
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawFrame = useCallback(() => {
    const mod: WasmModule | null = wasmRef.current;
    const canvas = canvasRef.current;
    const wrap = boardWrapRef.current;
    if (!mod || !canvas || !wrap) return;

    const w = mod._flappy_get_width?.() ?? 28;
    const h = mod._flappy_get_height?.() ?? 20;

    const wrapWidth = wrap.clientWidth || 1;
    const cssWidth = Math.max(1, wrapWidth);
    const cssHeight = Math.max(1, (cssWidth * h) / w);

    const dpr = window.devicePixelRatio || 1;
    const pxW = Math.floor(cssWidth * dpr);
    const pxH = Math.floor(cssHeight * dpr);
    if (canvas.width !== pxW || canvas.height !== pxH) {
      canvas.width = pxW;
      canvas.height = pxH;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const cellW = cssWidth / w;
    const cellH = cssHeight / h;

    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    ctx.fillStyle = "#047857";
    for (let i = 0; i < w * h; i++) {
      const code = mod._flappy_get_cell?.(i) ?? 0;
      const ch = code > 0 ? String.fromCharCode(code) : "";
      if (ch === "#") {
        const x = i % w;
        const y = Math.floor(i / w);
        ctx.fillRect(x * cellW, y * cellH, cellW, cellH);
      }
    }

    const birdY = mod._flappy_get_bird_y?.() ?? h / 2;
    const bx = (BIRD_X + 0.5) * cellW;
    const by = (birdY + 0.5) * cellH;
    const radius = Math.max(3, Math.min(cellW, cellH) * 0.38);

    ctx.beginPath();
    ctx.fillStyle = "#facc15";
    ctx.arc(bx, by, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "#111827";
    ctx.arc(bx + radius * 0.25, by - radius * 0.2, Math.max(1.5, radius * 0.12), 0, Math.PI * 2);
    ctx.fill();

    if (w !== width) setWidth(w);
    if (h !== height) setHeight(h);
  }, [height, wasmRef, width]);

  const syncStatus = useCallback(() => {
    try {
      const mod: WasmModule | null = wasmRef.current;
      if (!mod) return;
      setScore(mod._flappy_get_score?.() ?? 0);
      setHasStarted(!!(mod._flappy_has_started?.() ?? 0));
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
      setHasStarted(false);
      setScore(0);
      setGameError(null);
      syncStatus();
      drawFrame();
    } catch (err) {
      setGameError(String(err));
    }
  }, [drawFrame, syncStatus, wasmRef]);

  const triggerFlap = useCallback(() => {
    const mod: WasmModule | null = wasmRef.current;
    if (!mod) return;
    if (gameOver) {
      startGame();
      return;
    }
    mod._flappy_flap?.();
  }, [gameOver, startGame, wasmRef]);

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

    const loop = (ts: number) => {
      try {
        const mod: WasmModule | null = wasmRef.current;

        if (!lastTsRef.current) {
          lastTsRef.current = ts;
        }

        const delta = ts - lastTsRef.current;
        lastTsRef.current = ts;
        accRef.current += Math.min(delta, 100);

        while (accRef.current >= SIM_STEP_MS) {
          if (mod?._flappy_update) {
            mod._flappy_update();
          } else if (mod?._flappy_tick) {
            mod._flappy_tick();
          }
          accRef.current -= SIM_STEP_MS;
        }

        drawFrame();
        syncStatus();

        const over = !!(mod?._flappy_is_game_over?.() ?? 0);
        if (over) {
          const s = mod?._flappy_get_score?.() ?? 0;
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
      } catch (err) {
        setGameError(String(err));
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      lastTsRef.current = 0;
      accRef.current = 0;
    };
  }, [drawFrame, isLoaded, syncStatus, wasmRef]);

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
      <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-3 sm:gap-4 px-0 sm:px-2">
        {/* Removed difficulty selector: default to Normal */}

        {/* Score Display */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2 sm:gap-4 w-full">
          <div className="flex-1 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-2 sm:p-3 text-center">
            <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">
              Score
            </div>
            <div className="text-white text-2xl sm:text-3xl font-bold tabular-nums">
              {score}
            </div>
          </div>
          <div className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-2 sm:p-3 text-center">
            <div className="text-white/80 text-xs font-semibold uppercase tracking-wider">
              Best
            </div>
            <div className="text-white text-2xl sm:text-3xl font-bold tabular-nums">
              {bestScore}
            </div>
          </div>
        </div>

        {/* Game Board with Overlays */}
        <div ref={boardWrapRef} className="relative w-full max-w-[560px] mx-auto">
          {/* Start Game Overlay - Simple text indicator */}
          {!gameOver && !hasStarted && (
            <div className="absolute top-6 left-0 right-0 z-10 flex justify-center pointer-events-none">
              <div className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-full shadow-lg font-bold text-lg animate-pulse">
                👆 Tap to Start
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
                👆 Tap to Restart
              </div>
            </div>
          )}

          <canvas
            ref={canvasRef}
            onPointerDown={(e) => {
              e.preventDefault();
              triggerFlap();
            }}
            className="flappy-canvas shadow-xl rounded-2xl overflow-hidden border-2 sm:border-4 border-sky-900/50"
            aria-label={`flappy-board-${width}x${height}`}
          />
        </div>
      </div>
    </GameContainer>
  );
}
