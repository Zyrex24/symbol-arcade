import { useState, useEffect } from "react";
import { useWasmLoader } from "../hooks/useWasmLoader";
import GameContainer from "./GameContainer";
import "../styles/Games.css";

export default function TicTacToeGame({ onBack }: { onBack: () => void }) {
  const { wasmRef, isLoaded, error } = useWasmLoader("TicTacToe");
  const [board, setBoard] = useState<string[]>(Array(9).fill(""));
  const [currentPlayer, setCurrentPlayer] = useState<string>("X");
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<string>("");

  // Initialize the game when the component mounts
  useEffect(() => {
    if (isLoaded) {
      // A small delay can help prevent race conditions on initial load
      setTimeout(() => {
        startNewGame();
      }, 100);
    }
  }, [isLoaded]);

  const startNewGame = () => {
    if (wasmRef.current?._ttt_start_game) {
      wasmRef.current._ttt_start_game();
      updateBoard();
      setCurrentPlayer("X");
      setGameOver(false);
      setWinner("");
    }
  };

  const updateBoard = () => {
    if (!wasmRef.current?._ttt_get_board || !wasmRef.current?.HEAPU8) return;

    try {
      const ptr = wasmRef.current._ttt_get_board();
      if (ptr === 0) {
        console.error("WASM failed to return board pointer.");
        return;
      }

      const boardData = [];
      for (let i = 0; i < 9; i++) {
        const cell = wasmRef.current.HEAPU8[ptr + i];
        boardData.push(cell === 32 ? "" : String.fromCharCode(cell)); // 32 is ASCII for space
      }
      setBoard(boardData);

      if (wasmRef.current._ttt_get_current_player) {
        const playerCode = wasmRef.current._ttt_get_current_player();
        setCurrentPlayer(String.fromCharCode(playerCode));
      }
    } catch (err) {
      console.error("Error updating board:", err);
    }
  };

  const handleCellClick = (index: number) => {
    console.log(`[DEBUG] handleCellClick called for index: ${index}`);
    if (gameOver || board[index] !== "" || !wasmRef.current) return;

    try {
      // 1. Make the move for the current player
      const success = wasmRef.current._ttt_make_move?.(index);
      console.log(`[DEBUG] _ttt_make_move result: ${success}`);
      if (!success) {
        // Move was invalid (e.g., cell already taken), so we stop.
        return;
      }

      // 2. Update the board state in React to show the move
      updateBoard();

      // 3. Check for a winner or a draw
      const winnerResult = wasmRef.current._ttt_check_winner?.();
      if (winnerResult && (winnerResult === 'X'.charCodeAt(0) || winnerResult === 'O'.charCodeAt(0))) {
        setGameOver(true);
        setWinner(String.fromCharCode(winnerResult));
        return; // Game is over, no need to switch player
      } else if (winnerResult && winnerResult === 'D'.charCodeAt(0)) {
        setGameOver(true);
        setWinner("Draw");
        return; // Game is over
      }

      // 4. If the game is not over, switch to the next player
      wasmRef.current._ttt_next_player?.();

      // 5. Update the UI again to reflect the player change
      updateBoard();

    } catch (err) {
      console.error("Error during handleCellClick:", err);
    }
  };

  const renderCell = (index: number) => (
    <button
      key={index}
      onClick={() => handleCellClick(index)}
      disabled={gameOver || board[index] !== ""}
      className={`board-cell ${board[index] ? board[index].toLowerCase() : ""}`}
    >
      {board[index]}
    </button>
  );

  if (error) {
    return (
      <GameContainer title="Tic Tac Toe" onBack={onBack}>
        <div className="error-container">
          <h3 className="error-title">Error loading game</h3>
          <p>{error}</p>
        </div>
      </GameContainer>
    );
  }

  if (!isLoaded) {
    return (
      <GameContainer title="Tic Tac Toe" onBack={onBack}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading game...</p>
        </div>
      </GameContainer>
    );
  }

  return (
    <GameContainer title="Tic Tac Toe" onBack={onBack}>
      <div className="tictactoe-game">
        <div className="player-info">
          <div className="player-display">
            <span className="player-label">Current Player: </span>
            <span className={`player-symbol ${currentPlayer.toLowerCase()}`}>
              {currentPlayer}
            </span>
          </div>
        </div>
        
        <div className="game-board">
          {Array(9).fill(null).map((_, index) => renderCell(index))}
        </div>

        {gameOver && (
          <div className="game-result">
            <h3>
              {winner === "Draw" 
                ? "Game Over - It's a Draw!" 
                : `Player ${winner} Wins!`}
            </h3>
            <button 
              onClick={startNewGame} 
              className="new-game-btn"
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                fontSize: '1rem',
                backgroundColor: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </GameContainer>
  );
}