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
  _make_guess?: (guess: number) => number;
  _get_attempts?: () => number;
  // Tic Tac Toe functions
  _ttt_start_game?: () => void;
  _ttt_get_current_player?: () => number;
  _ttt_make_move?: (index: number) => number;
  _ttt_next_player?: () => void;
  _ttt_get_board?: (ptr: number) => void;
  _ttt_check_winner?: () => number;
  _ttt_reset?: () => void;
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
}
