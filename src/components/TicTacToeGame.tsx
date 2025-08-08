import { useState, useEffect, useCallback } from "react";
import { useWasmLoader } from "../hooks/useWasmLoader";
import GameContainer from "./GameContainer";

const EMPTY_CELL = "";

export default function TicTacToeGame({ onBack }: { onBack: () => void }) {
  const { wasmRef, isLoaded, error } = useWasmLoader("TicTacToe");
  const [board, setBoard] = useState<string[]>(Array(9).fill(EMPTY_CELL));
  const [currentPlayer, setCurrentPlayer] = useState<string>("X");
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<string>("");

  useEffect(() => {
    if (isLoaded) {
      const t = setTimeout(() => {
        startNewGame();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isLoaded]);

  const startNewGame = useCallback(() => {
    if (wasmRef.current?._ttt_start_game) {
      wasmRef.current._ttt_start_game();
      updateBoard();
      setCurrentPlayer("X");
      setGameOver(false);
      setWinner("");
    } else {
      console.error("[WASM] _ttt_start_game is not available.");
    }
  }, [wasmRef]);

  const updateBoard = useCallback(() => {
    const mod = wasmRef.current as any;
    if (!mod) return;
    try {
      const boardData: string[] = [];
      if (typeof mod._ttt_get_cell === "function") {
        for (let i = 0; i < 9; i++) {
          const code = mod._ttt_get_cell(i) as number;
          if (code === 32) boardData.push(EMPTY_CELL);
          else if (code > 0) boardData.push(String.fromCharCode(code));
          else boardData.push(EMPTY_CELL);
        }
      } else if (typeof mod._ttt_get_board === "function" && mod.HEAPU8) {
        const ptr = mod._ttt_get_board();
        if (ptr === 0) {
          console.error("WASM failed to return board pointer.");
          return;
        }
        const heap = mod.HEAPU8 as Uint8Array;
        for (let i = 0; i < 9; i++) {
          const cell = heap[ptr + i];
          boardData.push(cell === 32 ? EMPTY_CELL : String.fromCharCode(cell));
        }
      } else {
        console.error("[WASM] Neither _ttt_get_cell nor _ttt_get_board+HEAPU8 is available.");
        return;
      }
      setBoard(boardData);
      if (typeof mod._ttt_get_current_player === "function") {
        const playerCode = mod._ttt_get_current_player();
        if (playerCode) setCurrentPlayer(String.fromCharCode(playerCode));
      }
    } catch (err) {
      console.error("Error updating board:", err);
    }
  }, [wasmRef]);

  const handleCellClick = useCallback(
    (index: number) => {
      if (gameOver || board[index] !== EMPTY_CELL || !wasmRef.current) return;
      try {
        const success = wasmRef.current._ttt_make_move?.(index);
        if (!success) return;
        setBoard((prev) => prev.map((c, i) => (i === index ? currentPlayer : c)));
        const winnerResult = wasmRef.current._ttt_check_winner?.();
        if (
          winnerResult &&
          (winnerResult === "X".charCodeAt(0) || winnerResult === "O".charCodeAt(0))
        ) {
          setGameOver(true);
          setWinner(String.fromCharCode(winnerResult));
          return;
        } else if (winnerResult && winnerResult === "D".charCodeAt(0)) {
          setGameOver(true);
          setWinner("Draw");
          return;
        }
        wasmRef.current._ttt_next_player?.();
        setCurrentPlayer((p) => (p === "X" ? "O" : "X"));
        updateBoard();
      } catch (err) {
        console.error("Error during handleCellClick:", err);
      }
    },
    [board, currentPlayer, gameOver, updateBoard, wasmRef]
  );

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

  return (
    <GameContainer title="Tic Tac Toe" onBack={onBack}>
      <div className="w-full flex flex-col items-center gap-4">
        {/* Current player */}
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white shadow text-gray-700">
          <span className="font-medium">Current Player:</span>
          <span className={`text-lg font-bold ${currentPlayer === 'X' ? 'text-red-600' : 'text-green-700'}`}>
            {currentPlayer}
          </span>
        </div>

        {/* Board */}
        <div className="grid grid-cols-3 gap-1 bg-gray-900 p-1.5 rounded-xl shadow-2xl">
          {board.map((value, index) => (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={gameOver || value !== EMPTY_CELL}
              className={`aspect-square rounded-md border-2 border-gray-800 flex items-center justify-center text-4xl font-extrabold transition 
                ${value === 'X' ? 'bg-red-50 text-red-600' : value === 'O' ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
              aria-label={`cell-${index}`}
            >
              {value}
            </button>
          ))}
        </div>

        {/* Result + Action */}
        {gameOver && (
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">
              {winner === "Draw" ? "Game Over - It's a Draw!" : `Player ${winner} Wins!`}
            </h3>
            <button 
              onClick={startNewGame}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-medium shadow hover:shadow-lg hover:-translate-y-0.5 transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </GameContainer>
  );
}