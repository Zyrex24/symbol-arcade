import { useState } from "react";
import { useWasmLoader } from "../hooks/useWasmLoader";
import GameContainer from "./GameContainer";
import "../styles/Games.css";

export default function GuessTheNumberGame({ onBack }: { onBack: () => void }) {
  const { wasmRef, isLoaded, error } = useWasmLoader("GuessTheNumber");
  const [message, setMessage] = useState("");
  const [guess, setGuess] = useState("");
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    if (wasmRef.current && wasmRef.current._start_game) {
      wasmRef.current._start_game(100); // 1-100
      setMessage("Game started! Guess a number between 1 and 100.");
      setGameStarted(true);
    }
  };

  const handleGuess = () => {
    if (!wasmRef.current || !guess.trim()) return;
    const num = parseInt(guess, 10);
    if (isNaN(num) || num < 1 || num > 100) {
      setMessage("Please enter a valid number between 1 and 100.");
      return;
    }

    if (wasmRef.current._make_guess) {
      const result = wasmRef.current._make_guess(num);
      if (result === 0) {
        if (wasmRef.current._get_attempts) {
          setMessage(
            `🎉 Correct! You got it in ${wasmRef.current._get_attempts()} attempts!`
          );
        } else {
          setMessage(`🎉 Correct! You got it!`);
        }
        setGameStarted(false);
        setGuess(""); // Only clear on win
      } else if (result < 0) {
        setMessage(`📉 Too low! Try a higher number. (Previous guess: ${num})`);
        // Keep the previous number for adjustment
      } else {
        setMessage(`📈 Too high! Try a lower number. (Previous guess: ${num})`);
        // Keep the previous number for adjustment
      }
    }
  };

  if (error) {
    return (
      <GameContainer title="Guess The Number" onBack={onBack}>
        <div className="error-container">
          <h3 className="error-title">Error loading game</h3>
          <p>{error}</p>
        </div>
      </GameContainer>
    );
  }

  if (!isLoaded) {
    return (
      <GameContainer title="Guess The Number" onBack={onBack}>
        <div className="loading-container">
          <div className="loading-text">Loading game...</div>
        </div>
      </GameContainer>
    );
  }

  return (
    <GameContainer title="Guess The Number" onBack={onBack}>
      <div className="guess-game">
        <h2 className="guess-title">🔢 Guess The Number</h2>

        {!gameStarted ? (
          <div>
            <p className="guess-description">
              I'm thinking of a number between 1 and 100. Can you guess it?
            </p>
            <button onClick={startGame} className="start-button">
              Start Game
            </button>
          </div>
        ) : (
          <div className="guess-input-container">
            <div className="guess-controls">
              <input
                type="number"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder="Enter your guess (1-100)"
                className="guess-input"
                onKeyPress={(e) => e.key === "Enter" && handleGuess()}
                min="1"
                max="100"
              />
              <button onClick={handleGuess} className="guess-submit">
                Guess
              </button>
            </div>
          </div>
        )}

        <div className="message-container">
          <div
            className={`message-text ${
              message.includes("🎉")
                ? "success"
                : message.includes("Error")
                ? "error"
                : "default"
            }`}
          >
            {message || "Click 'Start Game' to begin!"}
          </div>
        </div>
      </div>
    </GameContainer>
  );
}
