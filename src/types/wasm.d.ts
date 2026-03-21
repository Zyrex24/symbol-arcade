declare global {
  interface Window {
    Module?: () => Promise<WasmModule>;
  }
}

interface WasmModule {
  _malloc?: (size: number) => number;
  _free?: (ptr: number) => void;
  HEAPU8?: Uint8Array;
  // Guess The Number functions
  _start_game?: (maxNumber: number) => void;
  _set_hint_difficulty?: (level: number) => void;
  _make_guess?: (guess: number) => number;
  _make_guess_hint?: (guess: number) => number;
  _get_attempts?: () => number;
  // Tic Tac Toe functions
  _ttt_start_game?: () => void;
  _ttt_get_current_player?: () => number;
  _ttt_make_move?: (index: number) => number;
  _ttt_next_player?: () => void;
  _ttt_get_board?: (ptr: number) => void;
  _ttt_check_winner?: () => number;
  _ttt_ai_move?: (difficulty: number) => number;
  _ttt_reset?: () => void;

  // Snake functions
  _snake_start_game?: () => void;
  _snake_set_direction?: (direction: number) => void;
  _snake_set_difficulty?: (level: number) => void;
  _snake_tick?: () => number;
  _snake_update?: () => number;
  _snake_get_width?: () => number;
  _snake_get_height?: () => number;
  _snake_get_move_interval_ms?: () => number;
  _snake_get_cell?: (index: number) => number;
  _snake_get_score?: () => number;
  _snake_is_game_over?: () => number;
  // Pacman functions
  _pacman_start_game?: () => void;
  _pacman_set_direction?: (direction: number) => void;
  _pacman_tick?: () => number;
  _pacman_update?: () => number;
  _pacman_get_width?: () => number;
  _pacman_get_height?: () => number;
  _pacman_get_cell?: (index: number) => number;
  _pacman_get_score?: () => number;
  _pacman_is_game_over?: () => number;

  // Flappy Bird functions
  _flappy_start_game?: () => void;
  _flappy_flap?: () => void;
  _flappy_tick?: () => number;
  _flappy_update?: () => number;
  _flappy_has_started?: () => number;
  _flappy_get_bird_y?: () => number;
  _flappy_get_width?: () => number;
  _flappy_get_height?: () => number;
  _flappy_get_cell?: (index: number) => number;
  _flappy_get_score?: () => number;
  _flappy_is_game_over?: () => number;
}
