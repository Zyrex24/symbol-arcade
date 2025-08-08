#include <emscripten.h>
#include <cstring>

extern "C" {
  // Board dimensions
  static const int W = 20;
  static const int H = 20;
  static const int MAX_CELLS = W * H;

  // Board cells: ' ' empty, 'S' snake, 'F' food
  static unsigned char board[MAX_CELLS];

  // Snake body stored as list of indices into board (row*W + col)
  static int snake_positions[MAX_CELLS];
  static int snake_length;

  // Direction: 0=Up,1=Right,2=Down,3=Left
  static int dir;

  // Game state
  static int game_over;
  static int score;
  static int moves;

  static void clear_board() {
    memset(board, ' ', MAX_CELLS);
  }

  static void place_snake_initial() {
    // Start at center, length 3 horizontal to the right
    int r = H / 2;
    int c = W / 2;
    snake_length = 3;
    snake_positions[0] = r * W + (c - 1);
    snake_positions[1] = r * W + c;
    snake_positions[2] = r * W + (c + 1);
    for (int i = 0; i < snake_length; ++i) {
      board[snake_positions[i]] = 'S';
    }
    dir = 1; // Right
  }

  static unsigned int rng_state = 1234567u;
  static int rand_int(int maxExclusive) {
    // simple LCG
    rng_state = rng_state * 1103515245u + 12345u + (unsigned)moves;
    return (int)((rng_state >> 16) % (unsigned)maxExclusive);
  }

  static void spawn_food() {
    // Place food on a random empty cell
    for (int tries = 0; tries < 2000; ++tries) {
      int idx = rand_int(MAX_CELLS);
      if (board[idx] == ' ') {
        board[idx] = 'F';
        return;
      }
    }
    // Fallback: scan
    for (int i = 0; i < MAX_CELLS; ++i) {
      if (board[i] == ' ') {
        board[i] = 'F';
        return;
      }
    }
  }

  EMSCRIPTEN_KEEPALIVE
  void snake_start_game() {
    clear_board();
    game_over = 0;
    score = 0;
    moves = 0;
    place_snake_initial();
    spawn_food();
  }

  EMSCRIPTEN_KEEPALIVE
  void snake_reset() {
    snake_start_game();
  }

  EMSCRIPTEN_KEEPALIVE
  void snake_set_direction(int newDir) {
    if (newDir < 0 || newDir > 3) return;
    // prevent reversing directly
    // up<->down (0 vs 2), left<->right (1 vs 3)
    if ((dir == 0 && newDir == 2) || (dir == 2 && newDir == 0)) return;
    if ((dir == 1 && newDir == 3) || (dir == 3 && newDir == 1)) return;
    dir = newDir;
  }

  EMSCRIPTEN_KEEPALIVE
  int snake_tick() {
    if (game_over) return 0;
    moves++;

    int head = snake_positions[snake_length - 1];
    int hr = head / W;
    int hc = head % W;
    if (dir == 0) hr -= 1;      // up
    else if (dir == 1) hc += 1; // right
    else if (dir == 2) hr += 1; // down
    else if (dir == 3) hc -= 1; // left

    // Wall collision
    if (hr < 0 || hr >= H || hc < 0 || hc >= W) {
      game_over = 1;
      return 0;
    }

    int newHead = hr * W + hc;

    // Self collision (allow tail overlap if not growing)
    if (board[newHead] == 'S') {
      // If newHead equals current tail and we are not eating, it's okay (tail moves)
      int tail = snake_positions[0];
      if (!(newHead == tail && board[newHead] == 'S' && board[newHead] != 'F')) {
        game_over = 1;
        return 0;
      }
    }

    int ateFood = (board[newHead] == 'F');

    // Move: if not growing, clear tail
    if (!ateFood) {
      int tail = snake_positions[0];
      board[tail] = ' ';
      // shift positions left
      for (int i = 1; i < snake_length; ++i) {
        snake_positions[i - 1] = snake_positions[i];
      }
      snake_positions[snake_length - 1] = newHead;
    } else {
      // grow: append new head without removing tail
      snake_positions[snake_length] = newHead;
      snake_length++;
      score += 1;
    }

    board[newHead] = 'S';

    if (ateFood) {
      spawn_food();
    }

    return 1;
  }

  EMSCRIPTEN_KEEPALIVE int snake_is_game_over() { return game_over; }
  EMSCRIPTEN_KEEPALIVE int snake_get_score() { return score; }
  EMSCRIPTEN_KEEPALIVE int snake_get_width() { return W; }
  EMSCRIPTEN_KEEPALIVE int snake_get_height() { return H; }

  EMSCRIPTEN_KEEPALIVE unsigned char* snake_get_board() { return board; }
  EMSCRIPTEN_KEEPALIVE int snake_get_cell(int idx) {
    if (idx < 0 || idx >= MAX_CELLS) return -1;
    return (int)board[idx];
  }
}
