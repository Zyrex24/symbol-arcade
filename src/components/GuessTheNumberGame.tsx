import { useMemo, useState } from "react";
import { useWasmLoader } from "../hooks/useWasmLoader";
import GameContainer from "./GameContainer";
import "../styles/Games.css";

export default function GuessTheNumberGame({ onBack }: { onBack: () => void }) {
  const { wasmRef, isLoaded, error } = useWasmLoader("GuessTheNumber");
  const [message, setMessage] = useState("");
  const [guess, setGuess] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [difficulty, setDifficulty] = useState<"Easy" | "Normal" | "Hard">(
    "Normal"
  );

  const maxNumber = useMemo(() => {
    return difficulty === "Easy" ? 10 : difficulty === "Hard" ? 1000 : 100;
  }, [difficulty]);

  const startGame = () => {
    if (wasmRef.current && wasmRef.current._start_game) {
      wasmRef.current._start_game(maxNumber); // 1-maxNumber
      setMessage(
        `Game started! Guess a number between 1 and ${maxNumber}.`
      );
      setGameStarted(true);
    }
  };

  const handleGuess = () => {
    if (!wasmRef.current || !guess.trim()) return;
    const num = parseInt(guess, 10);
    if (isNaN(num) || num < 1 || num > maxNumber) {
      setMessage(`Please enter a valid number between 1 and ${maxNumber}.`);
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
        setMessage(
          `📉 Too low! Try a higher number. (Previous guess: ${num})`
        );
        // Keep the previous number for adjustment
      } else {
        setMessage(
          `📈 Too high! Try a lower number. (Previous guess: ${num})`
        );
        // Keep the previous number for adjustment
      }
    }
  };

  const resetGame = () => {
    setMessage("");
    setGuess("");
    setGameStarted(false);
    startGame();
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

        {/* Difficulty + Attempts */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <span>Difficulty:</span>
            <select
              className="px-2 py-1 rounded-md border border-gray-300"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "Easy" | "Normal" | "Hard")
              }
              disabled={gameStarted}
              aria-label="Select difficulty"
            >
              <option>Easy</option>
              <option>Normal</option>
              <option>Hard</option>
            </select>
          </label>
          <div className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm shadow">
            Range: 1–{maxNumber}
          </div>
          {wasmRef.current?._get_attempts && (
            <div
              className="px-3 py-1 rounded-lg bg-gray-900 text-white text-sm shadow"
              aria-live="polite"
            >
              Attempts: {wasmRef.current._get_attempts()}
            </div>
          )}
        </div>

        {!gameStarted ? (
          <div>
            <p className="guess-description">
              I'm thinking of a number between 1 and {maxNumber}. Can you guess it?
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
                placeholder={`Enter your guess (1-${maxNumber})`}
                className="guess-input"
                onKeyPress={(e) => e.key === "Enter" && handleGuess()}
                min={1}
                max={maxNumber}
                aria-label="Enter your guess"
              />
              <button onClick={handleGuess} className="guess-submit">
                Guess
              </button>
              <button
                onClick={resetGame}
                className="px-3 py-2 rounded-lg bg-gray-200 text-gray-800"
                aria-label="Restart game"
                title="Restart game"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        <div className="message-container" aria-live="polite" aria-atomic="true">
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
