#include <emscripten.h>
#include <cstring>
#include <chrono>

extern "C" {
  // Game choices: 0=Rock, 1=Paper, 2=Scissors
  static int player_choice = -1;
  static int computer_choice = -1;
  static int last_result = -1; // -1=none, 0=tie, 1=player wins, 2=computer wins
  
  // Game statistics
  static int player_wins = 0;
  static int computer_wins = 0;
  static int ties = 0;
  static int total_games = 0;
  
  // Game state
  static bool game_ready = false;
  static bool show_result = false;

  // Simple random number generator
  static unsigned int rng_state = 1234567u;
  static int rand_int(int maxExclusive) {
    auto now = std::chrono::steady_clock::now();
    auto time_seed = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
    rng_state = rng_state * 1103515245u + 12345u + (unsigned)time_seed;
    return (int)((rng_state >> 16) % (unsigned)maxExclusive);
  }

  // Determine winner: 0=tie, 1=player wins, 2=computer wins
  static int determine_winner(int player, int computer) {
    if (player == computer) return 0; // tie
    
    // Rock(0) beats Scissors(2), Paper(1) beats Rock(0), Scissors(2) beats Paper(1)
    if ((player == 0 && computer == 2) || 
        (player == 1 && computer == 0) || 
        (player == 2 && computer == 1)) {
      return 1; // player wins
    }
    
    return 2; // computer wins
  }

  EMSCRIPTEN_KEEPALIVE
  void rps_start_game() {
    player_choice = -1;
    computer_choice = -1;
    last_result = -1;
    game_ready = true;
    show_result = false;
  }

  EMSCRIPTEN_KEEPALIVE
  void rps_reset_stats() {
    player_wins = 0;
    computer_wins = 0;
    ties = 0;
    total_games = 0;
  }

  EMSCRIPTEN_KEEPALIVE
  int rps_make_choice(int choice) {
    if (!game_ready || choice < 0 || choice > 2) return 0;
    
    player_choice = choice;
    computer_choice = rand_int(3); // Generate computer choice
    
    // Determine winner
    last_result = determine_winner(player_choice, computer_choice);
    
    // Update statistics
    total_games++;
    if (last_result == 0) ties++;
    else if (last_result == 1) player_wins++;
    else computer_wins++;
    
    show_result = true;
    return 1; // Success
  }

  EMSCRIPTEN_KEEPALIVE
  void rps_new_round() {
    player_choice = -1;
    computer_choice = -1;
    last_result = -1;
    show_result = false;
    game_ready = true;
  }

  // Getter functions
  EMSCRIPTEN_KEEPALIVE int rps_get_player_choice() { return player_choice; }
  EMSCRIPTEN_KEEPALIVE int rps_get_computer_choice() { return computer_choice; }
  EMSCRIPTEN_KEEPALIVE int rps_get_result() { return last_result; }
  EMSCRIPTEN_KEEPALIVE int rps_is_game_ready() { return game_ready ? 1 : 0; }
  EMSCRIPTEN_KEEPALIVE int rps_show_result() { return show_result ? 1 : 0; }
  
  // Statistics
  EMSCRIPTEN_KEEPALIVE int rps_get_player_wins() { return player_wins; }
  EMSCRIPTEN_KEEPALIVE int rps_get_computer_wins() { return computer_wins; }
  EMSCRIPTEN_KEEPALIVE int rps_get_ties() { return ties; }
  EMSCRIPTEN_KEEPALIVE int rps_get_total_games() { return total_games; }
}
