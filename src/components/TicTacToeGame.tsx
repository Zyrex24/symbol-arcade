import { useState, useEffect, useCallback } from "react";
import { useWasmLoader } from "../hooks/useWasmLoader";
import GameContainer from "./GameContainer";
import type { WasmModule } from "../types/wasm.js";

const EMPTY_CELL = "";
type GameMode = "pvp" | "cpu";
type AIDifficulty = "easy" | "medium" | "hard" | "impossible";

const DIFFICULTY_MAP: Record<AIDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
  impossible: 3,
};

type SetupStep = "mode" | "difficulty" | "play";

export default function TicTacToeGame({ onBack }: { onBack: () => void }) {
  const { wasmRef, isLoaded, error } = useWasmLoader("TicTacToe");
  const [board, setBoard] = useState<string[]>(Array(9).fill(EMPTY_CELL));
  const [currentPlayer, setCurrentPlayer] = useState<string>("X");
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<string>("");
  const [gameMode, setGameMode] = useState<GameMode>("pvp");
  const [aiDifficulty, setAIDifficulty] = useState<AIDifficulty>("medium");
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [setupStep, setSetupStep] = useState<SetupStep>("mode");

  const syncFromWasm = useCallback(() => {
    const mod: WasmModule | null = wasmRef.current;
    if (!mod) return null;

    try {
      const boardData: string[] = [];

      if (mod._ttt_get_cell) {
        for (let i = 0; i < 9; i++) {
          const code = mod._ttt_get_cell(i);
          if (code === 32) boardData.push(EMPTY_CELL);
          else if (code > 0) boardData.push(String.fromCharCode(code));
          else boardData.push(EMPTY_CELL);
        }
      } else if (mod._ttt_get_board && mod.HEAPU8) {
        const ptr = mod._ttt_get_board();
        if (ptr === 0) return;
        const heap = mod.HEAPU8;
        for (let i = 0; i < 9; i++) {
          const cell = heap[ptr + i];
          boardData.push(cell === 32 ? EMPTY_CELL : String.fromCharCode(cell));
        }
      }

      let player = "X";
      if (mod._ttt_get_current_player) {
        const playerCode = mod._ttt_get_current_player();
        if (playerCode) player = String.fromCharCode(playerCode);
      }

      setBoard(boardData.length === 9 ? boardData : Array(9).fill(EMPTY_CELL));
      setCurrentPlayer(player);
      return { boardData, player };
    } catch (err) {
      console.error("Error updating board:", err);
      return null;
    }
  }, [wasmRef]);

  const startNewGame = useCallback(() => {
    if (wasmRef.current?._ttt_start_game) {
      wasmRef.current._ttt_start_game();
      syncFromWasm();
      setGameOver(false);
      setWinner("");
      setIsAiThinking(false);
    }
  }, [wasmRef, syncFromWasm]);

  useEffect(() => {
    if (isLoaded) {
      const t = setTimeout(() => startNewGame(), 100);
      return () => clearTimeout(t);
    }
  }, [isLoaded, startNewGame]);

  const applyMove = useCallback(
    (index: number): boolean => {
      const mod = wasmRef.current;
      if (!mod) return false;

      try {
        const success = mod._ttt_make_move?.(index);
        if (!success) return false;

        const winnerResult = mod._ttt_check_winner?.();
        syncFromWasm();

        if (
          winnerResult &&
          (winnerResult === "X".charCodeAt(0) ||
            winnerResult === "O".charCodeAt(0))
        ) {
          setGameOver(true);
          setWinner(String.fromCharCode(winnerResult));
          return true;
        }

        if (winnerResult && winnerResult === "D".charCodeAt(0)) {
          setGameOver(true);
          setWinner("Draw");
          return true;
        }

        mod._ttt_next_player?.();
        syncFromWasm();
        return true;
      } catch (err) {
        console.error("Error applying move:", err);
        return false;
      }
    },
    [syncFromWasm, wasmRef]
  );

  const handleCellClick = useCallback(
    (index: number) => {
      const isCpuTurn = gameMode === "cpu" && currentPlayer === "O";
      if (
        gameOver ||
        isCpuTurn ||
        isAiThinking ||
        board[index] !== EMPTY_CELL ||
        !wasmRef.current
      ) {
        return;
      }
      applyMove(index);
    },
    [applyMove, board, currentPlayer, gameMode, gameOver, isAiThinking, wasmRef]
  );

  useEffect(() => {
    if (
      !isLoaded ||
      setupStep !== "play" ||
      gameOver ||
      gameMode !== "cpu" ||
      currentPlayer !== "O"
    ) {
      return;
    }

    setIsAiThinking(true);
    const timer = setTimeout(() => {
      const move = wasmRef.current?._ttt_ai_move?.(DIFFICULTY_MAP[aiDifficulty]) ?? -1;
      if (move >= 0) {
        const winnerResult = wasmRef.current?._ttt_check_winner?.();
        syncFromWasm();

        if (
          winnerResult &&
          (winnerResult === "X".charCodeAt(0) ||
            winnerResult === "O".charCodeAt(0))
        ) {
          setGameOver(true);
          setWinner(String.fromCharCode(winnerResult));
        } else if (winnerResult && winnerResult === "D".charCodeAt(0)) {
          setGameOver(true);
          setWinner("Draw");
        } else {
          wasmRef.current?._ttt_next_player?.();
          syncFromWasm();
        }
      }
      setIsAiThinking(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [
    aiDifficulty,
    currentPlayer,
    gameMode,
    gameOver,
    isLoaded,
    setupStep,
    syncFromWasm,
    wasmRef,
  ]);

  const beginMatch = useCallback(() => {
    setSetupStep("play");
    startNewGame();
  }, [startNewGame]);

  const restartSetup = useCallback(() => {
    setSetupStep("mode");
    setGameOver(false);
    setWinner("");
    setIsAiThinking(false);
    setBoard(Array(9).fill(EMPTY_CELL));
    setCurrentPlayer("X");
  }, []);

  if (error) {
    return (
      <GameContainer title="Tic Tac Toe" onBack={onBack}>
        <div className="text-center text-red-600">
          <h3 className="text-xl font-semibold mb-1">Error loading game</h3>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </GameContainer>
    );
  }

  if (!isLoaded) {
    return (
      <GameContainer title="Tic Tac Toe" onBack={onBack}>
        <div className="text-center">
          <div className="w-9 h-9 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading game...</p>
        </div>
      </GameContainer>
    );
  }

  if (setupStep === "mode") {
    return (
      <GameContainer title="Tic Tac Toe" onBack={onBack}>
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow p-4 sm:p-5 space-y-4">
          <h3 className="text-xl font-bold text-gray-800">Choose Mode</h3>
          <p className="text-sm text-gray-600">
            Start with local multiplayer or challenge the computer.
          </p>

          <button
            onClick={() => {
              setGameMode("pvp");
              beginMatch();
            }}
            className="w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Player vs Player
          </button>

          <button
            onClick={() => {
              setGameMode("cpu");
              setSetupStep("difficulty");
            }}
            className="w-full px-4 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
          >
            Player vs Computer
          </button>
        </div>
      </GameContainer>
    );
  }

  if (setupStep === "difficulty") {
    return (
      <GameContainer title="Tic Tac Toe" onBack={onBack}>
        <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow p-4 sm:p-5 space-y-4">
          <h3 className="text-xl font-bold text-gray-800">Choose Difficulty</h3>
          <p className="text-sm text-gray-600">
            The computer always plays as O. You play first as X.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["easy", "medium", "hard", "impossible"] as AIDifficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => setAIDifficulty(level)}
                className={`px-4 py-3 rounded-xl border-2 font-semibold transition capitalize ${
                  aiDifficulty === level
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setSetupStep("mode")}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              Back
            </button>
            <button
              onClick={beginMatch}
              className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            >
              Start Game
            </button>
          </div>
        </div>
      </GameContainer>
    );
  }

  return (
    <GameContainer title="Tic Tac Toe" onBack={onBack}>
      <div className="w-full flex flex-col items-center gap-4">
        <div className="w-full max-w-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white p-3 rounded-xl shadow">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">Mode:</span>{" "}
            {gameMode === "cpu" ? "Player vs Computer" : "Player vs Player"}
            {gameMode === "cpu" && (
              <span>
                {" "}
                • <span className="font-semibold text-gray-800">Difficulty:</span>{" "}
                <span className="capitalize">{aiDifficulty}</span>
              </span>
            )}
          </div>
          <button
            onClick={restartSetup}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Change Setup
          </button>
        </div>

        {/* Current player */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white shadow text-gray-700">
          <span className="font-medium">Current Player:</span>
          <span
            className={`text-lg font-bold ${
              currentPlayer === "X" ? "text-red-600" : "text-green-700"
            }`}
          >
            {currentPlayer}
          </span>
          {gameMode === "cpu" && currentPlayer === "O" && !gameOver && (
            <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
              Computer thinking...
            </span>
          )}
        </div>

        {/* Board */}
        <div className="grid grid-cols-3 gap-2 bg-gray-900 p-2 sm:p-3 rounded-xl shadow-2xl w-full max-w-[22rem] aspect-square">
          {board.map((value, index) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={
                gameOver ||
                value !== EMPTY_CELL ||
                (gameMode === "cpu" && currentPlayer === "O") ||
                isAiThinking
              }
              className={`w-full h-full rounded-md border-2 border-gray-800 flex items-center justify-center text-3xl sm:text-4xl font-extrabold transition min-h-[64px] min-w-[64px] touch-manipulation
                ${
                  value === "X"
                    ? "bg-red-50 text-red-600"
                    : value === "O"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-white text-gray-800 hover:bg-gray-50 disabled:hover:bg-white"
                }`}
              aria-label={`cell-${index}`}
            >
              {value || "\u00A0"}
            </button>
          ))}
        </div>

        {/* Result + Action */}
        {gameOver && (
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">
              {winner === "Draw"
                ? "Game Over - It's a Draw!"
                : gameMode === "cpu" && winner === "O"
                ? "Computer Wins!"
                : `Player ${winner} Wins!`}
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={startNewGame}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white font-medium shadow hover:shadow-lg hover:-translate-y-0.5 transition"
              >
                Play Again
              </button>
              <button
                onClick={restartSetup}
                className="px-5 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                New Setup
              </button>
            </div>
          </div>
        )}
      </div>
    </GameContainer>
  );
}
