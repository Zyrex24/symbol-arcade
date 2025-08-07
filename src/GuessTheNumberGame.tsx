import React, { useEffect, useRef, useState } from "react";

export default function GuessTheNumberGame() {
  const wasmRef = useRef<any>(null);
  const [message, setMessage] = useState("");
  const [guess, setGuess] = useState("");
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    // Dynamically load the WASM module as a script
    const script = document.createElement("script");
    script.src = "/wasm/GuessTheNumber.js";
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      window
        .Module({
          locateFile: (path: string) => `/wasm/${path}`,
        })
        .then((mod: any) => {
          wasmRef.current = mod;
        });
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const startGame = () => {
    if (wasmRef.current) {
      wasmRef.current._start_game(100); // 1-100
      setMessage("Game started! Guess a number between 1 and 100.");
      setGameStarted(true);
    }
  };

  const handleGuess = () => {
    if (!wasmRef.current) return;
    const num = parseInt(guess, 10);
    const result = wasmRef.current._make_guess(num);
    if (result === 0) {
      setMessage(`Correct! Attempts: ${wasmRef.current._get_attempts()}`);
      setGameStarted(false);
    } else if (result < 0) {
      setMessage("Too low!");
    } else {
      setMessage("Too high!");
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "2rem auto",
        padding: 24,
        border: "1px solid #ccc",
        borderRadius: 8,
      }}
    >
      <h2>Guess The Number</h2>
      {!gameStarted ? (
        <button onClick={startGame}>Start Game</button>
      ) : (
        <>
          <input
            type="number"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Enter your guess"
            style={{ marginRight: 8 }}
          />
          <button onClick={handleGuess}>Guess</button>
        </>
      )}
      <div style={{ marginTop: 16 }}>{message}</div>
    </div>
  );
}
