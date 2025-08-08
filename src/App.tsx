import { useState } from "react";
import GuessTheNumberGame from "./components/GuessTheNumberGame";
import TicTacToeGame from "./components/TicTacToeGame";
import SnakeGame from "./components/SnakeGame";

type GameType = "menu" | "guess" | "tictactoe" | "snake";

export default function App() {
  const [currentGame, setCurrentGame] = useState<GameType>("menu");

  const renderGame = () => {
    switch (currentGame) {
      case "guess":
        return <GuessTheNumberGame onBack={() => setCurrentGame("menu")} />;
      case "tictactoe":
        return <TicTacToeGame onBack={() => setCurrentGame("menu")} />;
      case "snake":
        return <SnakeGame onBack={() => setCurrentGame("menu")} />;
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
      <div className="w-full max-w-5xl mx-auto bg-white/10 backdrop-blur rounded-3xl shadow-2xl ring-1 ring-white/20 p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md mb-3">
            WASM Arcade
          </h1>
          <p className="text-white/80 text-lg">
            Choose your game. Logic runs in WebAssembly, UI in React.
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <button
            onClick={() => setCurrentGame("guess")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white px-6 py-6 text-left shadow-lg hover:shadow-xl transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">Guess The Number</div>
                <div className="text-white/90 mt-1">Classic 1-100 guessing</div>
              </div>
              <div className="text-4xl">🔢</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentGame("tictactoe")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white px-6 py-6 text-left shadow-lg hover:shadow-xl transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">Tic Tac Toe</div>
                <div className="text-white/90 mt-1">Two-player strategy</div>
              </div>
              <div className="text-4xl">❌⭕</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentGame("snake")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white px-6 py-6 text-left shadow-lg hover:shadow-xl transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">Snake</div>
                <div className="text-white/90 mt-1">Eat, grow, survive</div>
              </div>
              <div className="text-4xl">🐍</div>
            </div>
          </button>
        </div>

        {/* Footer badge */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full ring-1 ring-white/20">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-medium text-white">Powered by WebAssembly</span>
          </div>
        </div>
      </div>
    </div>
  );
}
