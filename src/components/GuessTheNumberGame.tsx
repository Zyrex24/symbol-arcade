import { useState } from "react";
import { useWasmLoader } from "../hooks/useWasmLoader";
import GameContainer from "./GameContainer";
import "../styles/Games.css";

const DIFFICULTY_LEVELS = [
  { label: "Easy", value: 10 },
  { label: "Normal", value: 100 },
  { label: "Hard", value: 1000 },
];

// NumberPad component for digit input
interface NumberPadProps {
  onInput: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

function NumberPad({ onInput, onBackspace, onClear }: NumberPadProps) {
  return (
    <div className="number-pad">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <button
          key={n}
          className="number-btn primary"
          onClick={() => onInput(n.toString())}
        >
          {n}
        </button>
      ))}
      <button className="number-btn secondary" onClick={onClear}>
        C
      </button>
      <button className="number-btn primary" onClick={() => onInput("0")}>
        0
      </button>
      <button className="number-btn secondary" onClick={onBackspace}>
        ⌫
      </button>
    </div>
  );
}

// Feedback message logic for guess result
function getFeedbackMessage(
  result: number,
  guess: number,
  attempts?: number
): string {
  if (result === 0) {
    return attempts
      ? `🎉 Correct! You got it in ${attempts} attempts!`
      : `🎉 Correct! You got it!`;
  }
  const diff = Math.abs(result);
  if (diff <= 2) return `Very close! (Previous guess: ${guess})`;
  if (diff <= 5) return `Close! (Previous guess: ${guess})`;
  return result < 0
    ? `📉 Too low! (Previous guess: ${guess})`
    : `📈 Too high! (Previous guess: ${guess})`;
}

export default function GuessTheNumberGame({ onBack }: { onBack: () => void }) {
  const { wasmRef, isLoaded, error } = useWasmLoader("GuessTheNumber");
  const [guess, setGuess] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [feedback, setFeedback] = useState<string>("");
  const [max, setMax] = useState<number>(100);
  const [difficulty, setDifficulty] = useState("Normal");

  const handleNumberPad = (digit: string) => {
    if (guess.length >= max.toString().length) return;
    setGuess((prev) => (prev === "0" ? digit : prev + digit));
  };
  const handleBackspace = () => setGuess((prev) => prev.slice(0, -1));
  const handleClear = () => setGuess("");

  const startGame = () => {
    if (wasmRef.current && wasmRef.current._start_game) {
      wasmRef.current._start_game(max);
      setGameStarted(true);
    }
  };

  const handleGuess = () => {
    if (!wasmRef.current || !guess.trim()) return;
    const num = parseInt(guess, 10);
    if (isNaN(num) || num < 1 || num > max) {
      setFeedback(`Please enter a valid number between 1 and ${max}.`);
      return;
    }
    if (wasmRef.current._make_guess) {
      const result = wasmRef.current._make_guess(num);
      if (result === 0) {
        const attempts = wasmRef.current._get_attempts?.();
        setFeedback(getFeedbackMessage(result, num, attempts));
        setGameStarted(false);
        setGuess("");
      } else {
        setFeedback(getFeedbackMessage(result, num));
      }
    }
  };

  const handleDifficultyChange = (
    level: (typeof DIFFICULTY_LEVELS)[number]
  ) => {
    setMax(level.value);
    setDifficulty(level.label);
    setGuess("");
    setFeedback("");
    setGameStarted(false);
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
            <p className="guess-description">Select difficulty:</p>
            <div className="difficulty-selector">
              {DIFFICULTY_LEVELS.map((level) => (
                <button
                  key={level.label}
                  onClick={() => handleDifficultyChange(level)}
                  className={`difficulty-btn ${
                    difficulty === level.label ? "active" : "inactive"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
            <p className="guess-description">
              I'm thinking of a number between 1 and {max}. Can you guess it?
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
                placeholder={`Enter your guess (1-${max})`}
                className="guess-input guess-input-enhanced"
                onKeyPress={(e) => e.key === "Enter" && handleGuess()}
                min="1"
                max={max}
              />
              <button onClick={handleGuess} className="guess-submit">
                Guess
              </button>
            </div>
            <NumberPad
              onInput={handleNumberPad}
              onBackspace={handleBackspace}
              onClear={handleClear}
            />
          </div>
        )}
        <div className="message-container">
          <div
            className={`message-text ${
              feedback.includes("🎉")
                ? "success"
                : feedback.includes("Error")
                ? "error"
                : feedback.includes("Way off")
                ? "wayoff"
                : feedback.includes("Far")
                ? "far"
                : feedback.includes("Close")
                ? "close"
                : feedback.includes("Very close")
                ? "veryclose"
                : "default"
            }`}
          >
            {feedback || `Click 'Start Game' to begin!`}
          </div>
        </div>
      </div>
    </GameContainer>
  );
}
