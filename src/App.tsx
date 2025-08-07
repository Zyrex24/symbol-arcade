import { useState } from "react";
import GuessTheNumberGame from "./components/GuessTheNumberGame";
import TicTacToeGame from "./components/TicTacToeGame";

type GameType = "menu" | "guess" | "tictactoe";

export default function App() {
  const [currentGame, setCurrentGame] = useState<GameType>("menu");

  const renderGame = () => {
    switch (currentGame) {
      case "guess":
        return <GuessTheNumberGame onBack={() => setCurrentGame("menu")} />;
      case "tictactoe":
        return <TicTacToeGame onBack={() => setCurrentGame("menu")} />;
      default:
        return null;
    }
  };

  if (currentGame !== "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700 flex items-center justify-center p-4">
        {renderGame()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-700 flex items-center justify-center p-4">
      <div className="game-card w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎮 WASM Arcade
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Choose your game! All games run on WebAssembly for maximum
            performance.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setCurrentGame("guess")}
            className="game-button-blue"
          >
            🔢 Guess The Number
          </button>

          <button
            onClick={() => setCurrentGame("tictactoe")}
            className="game-button-green"
          >
            ❌⭕ Tic Tac Toe
          </button>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse-slow"></div>
            <span className="text-sm font-medium text-white">
              Powered by WebAssembly
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
