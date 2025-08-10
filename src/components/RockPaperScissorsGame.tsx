import { useEffect, useState, useCallback } from "react";
import GameContainer from "./GameContainer";
import { useWasmLoader } from "../hooks/useWasmLoader";

const CHOICES = [
  { id: 0, name: "Rock", emoji: "🪨", icon: "✊" },
  { id: 1, name: "Paper", emoji: "📄", icon: "✋" },
  { id: 2, name: "Scissors", emoji: "✂️", icon: "✌️" },
];

const RESULT_MESSAGES = {
  0: "It's a tie! 🤝",
  1: "You win! 🎉",
  2: "Computer wins! 🤖",
};

export default function RockPaperScissorsGame({
  onBack,
}: {
  onBack: () => void;
}) {
  const { wasmRef, isLoaded, error } = useWasmLoader("RockPaperScissors");
  const [gameReady, setGameReady] = useState(false);
  const [playerChoice, setPlayerChoice] = useState<number>(-1);
  const [computerChoice, setComputerChoice] = useState<number>(-1);
  const [result, setResult] = useState<number>(-1);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({
    playerWins: 0,
    computerWins: 0,
    ties: 0,
    totalGames: 0,
  });
  const [gameError, setGameError] = useState<string | null>(null);

  // Read game state from C++
  const updateGameState = useCallback(() => {
    try {
      const mod = wasmRef.current;
      if (!mod) return;

      setGameReady(!!(mod._rps_is_game_ready?.() ?? 0));
      setPlayerChoice(mod._rps_get_player_choice?.() ?? -1);
      setComputerChoice(mod._rps_get_computer_choice?.() ?? -1);
      setResult(mod._rps_get_result?.() ?? -1);
      setShowResult(!!(mod._rps_show_result?.() ?? 0));

      setStats({
        playerWins: mod._rps_get_player_wins?.() ?? 0,
        computerWins: mod._rps_get_computer_wins?.() ?? 0,
        ties: mod._rps_get_ties?.() ?? 0,
        totalGames: mod._rps_get_total_games?.() ?? 0,
      });
    } catch (err) {
      console.error("Error updating game state:", err);
      setGameError(`State update error: ${err}`);
    }
  }, [wasmRef]);

  // Start new game
  const startGame = useCallback(() => {
    try {
      const mod = wasmRef.current;
      if (!mod?._rps_start_game) return;

      mod._rps_start_game();
      setGameError(null);
      updateGameState();
    } catch (err) {
      console.error("Error starting game:", err);
      setGameError(`Game start error: ${err}`);
    }
  }, [wasmRef, updateGameState]);

  // Make a choice
  const makeChoice = useCallback(
    (choice: number) => {
      try {
        const mod = wasmRef.current;
        if (!mod?._rps_make_choice || !gameReady) return;

        const success = mod._rps_make_choice(choice);
        if (success) {
          updateGameState();
        }
      } catch (err) {
        console.error("Error making choice:", err);
        setGameError(`Choice error: ${err}`);
      }
    },
    [wasmRef, gameReady, updateGameState]
  );

  // Start new round
  const newRound = useCallback(() => {
    try {
      const mod = wasmRef.current;
      if (!mod?._rps_new_round) return;

      mod._rps_new_round();
      updateGameState();
    } catch (err) {
      console.error("Error starting new round:", err);
      setGameError(`New round error: ${err}`);
    }
  }, [wasmRef, updateGameState]);

  // Reset statistics
  const resetStats = useCallback(() => {
    try {
      const mod = wasmRef.current;
      if (!mod?._rps_reset_stats) return;

      mod._rps_reset_stats();
      updateGameState();
    } catch (err) {
      console.error("Error resetting stats:", err);
      setGameError(`Reset error: ${err}`);
    }
  }, [wasmRef, updateGameState]);

  // Initialize game on load
  useEffect(() => {
    if (!isLoaded) return;
    const t = setTimeout(() => startGame(), 100);
    return () => clearTimeout(t);
  }, [isLoaded, startGame]);

  if (error) {
    return (
      <GameContainer title="Rock Paper Scissors" onBack={onBack}>
        <div className="text-center text-red-600">
          <h3 className="text-xl font-semibold mb-1">Error loading game</h3>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </GameContainer>
    );
  }

  if (gameError) {
    return (
      <GameContainer title="Rock Paper Scissors" onBack={onBack}>
        <div className="text-center text-red-600">
          <h3 className="text-xl font-semibold mb-1">Game Error</h3>
          <p className="text-sm opacity-80 mb-3">{gameError}</p>
          <button
            onClick={() => {
              setGameError(null);
              startGame();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </GameContainer>
    );
  }

  if (!isLoaded) {
    return (
      <GameContainer title="Rock Paper Scissors" onBack={onBack}>
        <div className="text-center">
          <div className="w-9 h-9 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading game...</p>
        </div>
      </GameContainer>
    );
  }

  const winRate =
    stats.totalGames > 0
      ? Math.round((stats.playerWins / stats.totalGames) * 100)
      : 0;

  return (
    <GameContainer title="Rock Paper Scissors" onBack={onBack}>
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Statistics */}
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-3 text-center">
            Statistics
          </h3>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-green-600 rounded-lg p-2">
              <div className="text-white font-bold text-lg">
                {stats.playerWins}
              </div>
              <div className="text-green-100 text-xs">You</div>
            </div>
            <div className="bg-red-600 rounded-lg p-2">
              <div className="text-white font-bold text-lg">
                {stats.computerWins}
              </div>
              <div className="text-red-100 text-xs">CPU</div>
            </div>
            <div className="bg-yellow-600 rounded-lg p-2">
              <div className="text-white font-bold text-lg">{stats.ties}</div>
              <div className="text-yellow-100 text-xs">Ties</div>
            </div>
            <div className="bg-blue-600 rounded-lg p-2">
              <div className="text-white font-bold text-lg">{winRate}%</div>
              <div className="text-blue-100 text-xs">Win Rate</div>
            </div>
          </div>
        </div>

        {/* Game Area */}
        <div className="bg-gray-800 rounded-xl p-6">
          {!showResult && gameReady && (
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                Choose your weapon!
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {CHOICES.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => makeChoice(choice.id)}
                    className="bg-gray-700 hover:bg-gray-600 rounded-xl p-4 transition-all duration-200 transform hover:scale-105 border-2 border-transparent hover:border-white/20"
                  >
                    <div className="text-4xl mb-2">{choice.emoji}</div>
                    <div className="text-white font-medium">{choice.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showResult && (
            <div className="text-center space-y-6">
              <div className="text-2xl font-bold text-white">
                {result !== -1 &&
                  RESULT_MESSAGES[result as keyof typeof RESULT_MESSAGES]}
              </div>

              <div className="flex justify-center items-center space-x-8">
                {/* Player Choice */}
                <div className="text-center">
                  <div className="text-gray-400 text-sm mb-2">You</div>
                  <div className="bg-gray-700 rounded-xl p-4 min-w-[80px]">
                    {playerChoice !== -1 && (
                      <>
                        <div className="text-3xl mb-1">
                          {CHOICES[playerChoice].emoji}
                        </div>
                        <div className="text-white text-sm">
                          {CHOICES[playerChoice].name}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-4xl">🆚</div>

                {/* Computer Choice */}
                <div className="text-center">
                  <div className="text-gray-400 text-sm mb-2">Computer</div>
                  <div className="bg-gray-700 rounded-xl p-4 min-w-[80px]">
                    {computerChoice !== -1 && (
                      <>
                        <div className="text-3xl mb-1">
                          {CHOICES[computerChoice].emoji}
                        </div>
                        <div className="text-white text-sm">
                          {CHOICES[computerChoice].name}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={newRound}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetStats}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
          >
            Reset Stats
          </button>
        </div>
      </div>
    </GameContainer>
  );
}
