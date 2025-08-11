import { useState } from "react";
import GuessTheNumberGame from "./components/GuessTheNumberGame";
import TicTacToeGame from "./components/TicTacToeGame";
import SnakeGame from "./components/SnakeGame";
import RockPaperScissorsGame from "./components/RockPaperScissorsGame";
import PacmanGame from "./components/PacmanGame";
import FlappyBirdGame from "./components/FlappyBirdGame";

type GameType = "menu" | "guess" | "tictactoe" | "snake" | "rps" | "pacman" | "flappy";

export default function App() {
  const [currentGame, setCurrentGame] = useState<GameType>("menu");

  const Header = (
    <header className="fixed top-0 left-0 right-0 z-20 bg-gradient-to-r from-indigo-700/80 via-purple-700/80 to-fuchsia-700/80 shadow-lg backdrop-blur">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-4 md:px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-black text-white tracking-tight drop-shadow">WASM Arcade</span>
          <span className="ml-1 px-2 py-0.5 rounded bg-white/20 text-white text-[10px] sm:text-xs font-mono tracking-widest">v1.0</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-full bg-white/20 hover:bg-white/40 p-2 transition" title="Theme toggle (coming soon)"><span role="img" aria-label="theme">🌗</span></button>
          <a href="https://github.com/Zyrex24/symbol-arcade" target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/20 hover:bg-white/40 p-2 transition" title="GitHub">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="#fff" d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.987 1.029-2.687-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.594 1.028 2.687 0 3.847-2.338 4.695-4.566 4.944.36.31.68.92.68 1.855 0 1.338-.012 2.419-.012 2.749 0 .267.18.577.688.48C19.138 20.2 22 16.448 22 12.021 22 6.484 17.523 2 12 2Z"/></svg>
          </a>
        </div>
      </div>
    </header>
  );

  const Footer = (
    <footer className="w-full text-center text-xs text-white/70 py-4 mt-8">
      <span>
        &copy; {new Date().getFullYear()} WASM Arcade &mdash;{" "}
        <a
          href="https://github.com/Zyrex24/symbol-arcade"
          className="underline hover:text-white"
        >
          GitHub
        </a>
      </span>
    </footer>
  );

  const renderGame = () => {
    switch (currentGame) {
      case "guess":
        return <GuessTheNumberGame onBack={() => setCurrentGame("menu")} />;
      case "tictactoe":
        return <TicTacToeGame onBack={() => setCurrentGame("menu")} />;
      case "snake":
        return <SnakeGame onBack={() => setCurrentGame("menu")} />;
      case "rps":
        return <RockPaperScissorsGame onBack={() => setCurrentGame("menu")} />;
      case "pacman":
        return <PacmanGame onBack={() => setCurrentGame("menu")} />;
      case "flappy":
        return <FlappyBirdGame onBack={() => setCurrentGame("menu")} />;
      default:
        return null;
    }
  };

  if (currentGame !== "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-700 flex flex-col items-center justify-center p-4 pt-20">
        {Header}
        <main className="flex-1 flex items-center justify-center w-full">
          {renderGame()}
        </main>
        {Footer}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-700 flex flex-col items-center justify-center p-4 pt-20">
      {Header}
      <main className="w-full max-w-6xl mx-auto bg-white/10 backdrop-blur rounded-3xl shadow-2xl ring-1 ring-white/20 p-8 mt-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight text-white drop-shadow-lg mb-3">
            WASM Arcade
          </h1>
          <p className="text-white/80 text-lg">
            Choose your game. Logic runs in WebAssembly, UI in React.
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
          <button
            onClick={() => setCurrentGame("guess")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white px-8 py-8 text-left shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 focus:ring-4 focus:ring-sky-400/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">Guess The Number</div>
                <div className="text-white/90 mt-2 text-base">
                  Classic 1-100 guessing
                </div>
              </div>
              <div className="text-5xl">🔢</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentGame("tictactoe")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white px-8 py-8 text-left shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 focus:ring-4 focus:ring-emerald-400/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">Tic Tac Toe</div>
                <div className="text-white/90 mt-2 text-base">
                  Two-player strategy
                </div>
              </div>
              <div className="text-5xl">❌⭕</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentGame("snake")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white px-8 py-8 text-left shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 focus:ring-4 focus:ring-fuchsia-400/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">Snake</div>
                <div className="text-white/90 mt-2 text-base">
                  Eat, grow, survive
                </div>
              </div>
              <div className="text-5xl">🐍</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentGame("rps")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white px-8 py-8 text-left shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 focus:ring-4 focus:ring-orange-400/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">Rock Paper Scissors</div>
                <div className="text-white/90 mt-2 text-base">
                  Classic hand game
                </div>
              </div>
              <div className="text-5xl">✂️</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentGame("pacman")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 text-white px-8 py-8 text-left shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 focus:ring-4 focus:ring-amber-300/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">Pacman</div>
                <div className="text-white/90 mt-2 text-base">Eat pellets, avoid ghosts</div>
              </div>
              <div className="text-5xl">🟡</div>
            </div>
          </button>

          <button
            onClick={() => setCurrentGame("flappy")}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-600 text-white px-8 py-8 text-left shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:-translate-y-1 focus:ring-4 focus:ring-cyan-300/40"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">Flappy Bird</div>
                <div className="text-white/90 mt-2 text-base">Tap to fly through pipes</div>
              </div>
              <div className="text-5xl">🐤</div>
            </div>
          </button>
        </div>
      </main>
      {Footer}
    </div>
  );
}
