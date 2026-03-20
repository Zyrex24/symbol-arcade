export interface WasmModule {
  _malloc?: (size: number) => number;
  _free?: (ptr: number) => void;
  HEAPU8?: Uint8Array;

  // Guess The Number
  _start_game?: (maxNumber: number) => void;
  _set_hint_difficulty?: (level: number) => void;
  _make_guess?: (guess: number) => number;
  _make_guess_hint?: (guess: number) => number;
  _get_attempts?: () => number;

  // Tic Tac Toe
  _ttt_start_game?: () => void;
  _ttt_get_current_player?: () => number;
  _ttt_make_move?: (index: number) => number;
  _ttt_next_player?: () => void;
  _ttt_get_board?: () => number;
  _ttt_get_cell?: (index: number) => number;
  _ttt_check_winner?: () => number;
  _ttt_ai_move?: (difficulty: number) => number;
  _ttt_reset?: () => void;

  // Snake
  _snake_start_game?: () => void;
  _snake_set_direction?: (direction: number) => void;
  _snake_set_difficulty?: (level: number) => void;
  _snake_tick?: () => number;
  _snake_update?: () => number;
  _snake_get_width?: () => number;
  _snake_get_height?: () => number;
  _snake_get_cell?: (index: number) => number;
  _snake_get_score?: () => number;
  _snake_is_game_over?: () => number;

  // Rock Paper Scissors
  _rps_start_game?: () => void;
  _rps_reset_stats?: () => void;
  _rps_make_choice?: (choice: number) => number;
  _rps_new_round?: () => void;
  _rps_get_player_choice?: () => number;
  _rps_get_computer_choice?: () => number;
  _rps_get_result?: () => number;
  _rps_is_game_ready?: () => number;
  _rps_show_result?: () => number;
  _rps_get_player_wins?: () => number;
  _rps_get_computer_wins?: () => number;
  _rps_get_ties?: () => number;
  _rps_get_total_games?: () => number;
  _rps_get_win_rate?: () => number;

  // Pacman
  _pacman_start_game?: (level?: number) => void;
  _pacman_set_direction?: (direction: number) => void;
  _pacman_tick?: () => number;
  _pacman_update?: () => number;
  _pacman_get_width?: () => number;
  _pacman_get_height?: () => number;
  _pacman_get_cell?: (index: number) => number;
  _pacman_get_score?: () => number;
  _pacman_is_game_over?: () => number;

  // Flappy Bird
  _flappy_start_game?: () => void;
  _flappy_flap?: () => void;
  _flappy_set_difficulty?: (level: number) => void;
  _flappy_tick?: () => number;
  _flappy_update?: () => number;
  _flappy_get_width?: () => number;
  _flappy_get_height?: () => number;
  _flappy_get_cell?: (index: number) => number;
  _flappy_get_score?: () => number;
  _flappy_is_game_over?: () => number;
}
