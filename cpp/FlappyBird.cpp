#include <vector>
#include <cstdlib>
#include <ctime>
#include <emscripten.h>

// Minimal Flappy Bird clone for WASM export
// Board is a simple character grid read from JS via _flappy_get_cell

extern "C" {

// Game parameters
static const int FB_WIDTH = 28;
static const int FB_HEIGHT = 20;
// Default to Normal difficulty implicitly
static int PIPE_GAP = 8;            // vertical gap size (Normal)
static const int PIPE_SPACING = 13; // columns between pipes
static const int BIRD_X = 6;        // fixed x position of bird

// Game state
static bool fb_initialized = false;
static bool fb_game_over = false;
static bool fb_started = false; // game hasn't started until first flap
static int fb_score = 0;
static int fb_tick = 0;
// Physics (floating point for smoother motion)
static double birdYf = FB_HEIGHT / 2.0;
static double birdVyf = 0.0;

struct Pipe {
  int x;   // column index of the pipe
  int gapY; // top of the gap (inclusive)
};

static std::vector<Pipe> pipes;

static inline int irand(int minVal, int maxVal) {
  return minVal + (std::rand() % (maxVal - minVal + 1));
}

static void fb_reset() {
  if (!fb_initialized) {
    std::srand((unsigned)std::time(nullptr));
    fb_initialized = true;
  }
  fb_game_over = false;
  fb_started = false; // require first click to start
  fb_score = 0;
  fb_tick = 0;
  birdYf = FB_HEIGHT / 2.0; // center bird
  birdVyf = 0.0;            // no velocity at start
  pipes.clear();

  // Start with pipes VERY far away to give player lots of time
  int startX = FB_WIDTH + 20;
  for (int i = 0; i < 3; ++i) {
    Pipe p;
    p.x = startX + i * PIPE_SPACING;
    p.gapY = irand(4, FB_HEIGHT - PIPE_GAP - 4); // more centered gaps
    pipes.push_back(p);
  }
}

// Set difficulty: 1=Easy, 2=Normal, 3=Hard
EMSCRIPTEN_KEEPALIVE void flappy_set_difficulty(int level) {
  if (level == 1) {
    PIPE_GAP = 10; // Easy
  } else if (level == 3) {
    PIPE_GAP = 7; // Hard
  } else {
    PIPE_GAP = 8; // Normal
  }
}

// Public API
EMSCRIPTEN_KEEPALIVE int flappy_get_width() { return FB_WIDTH; }
EMSCRIPTEN_KEEPALIVE int flappy_get_height() { return FB_HEIGHT; }
EMSCRIPTEN_KEEPALIVE int flappy_get_score() { return fb_score; }
EMSCRIPTEN_KEEPALIVE int flappy_is_game_over() { return fb_game_over ? 1 : 0; }
EMSCRIPTEN_KEEPALIVE int flappy_has_started() { return fb_started ? 1 : 0; }
EMSCRIPTEN_KEEPALIVE double flappy_get_bird_y() { return birdYf; }

EMSCRIPTEN_KEEPALIVE void flappy_start_game() { fb_reset(); }

EMSCRIPTEN_KEEPALIVE void flappy_flap() {
  if (fb_game_over) return;
  if (!fb_started) {
    fb_started = true; // start game on first flap
    birdVyf = -3.1;
    return;
  }
  birdVyf = -3.1;
}

static void add_pipe_right() {
  int maxRight = FB_WIDTH;
  for (const auto &p : pipes) if (p.x > maxRight) maxRight = p.x;
  Pipe np;
  np.x = maxRight + PIPE_SPACING;
  np.gapY = irand(4, FB_HEIGHT - PIPE_GAP - 4);
  pipes.push_back(np);
}

static void update_physics() {
  if (fb_game_over || !fb_started) return;

  // Gravity (small acceleration each tick, reduced for smoother motion)
  birdVyf += 0.24;
  // Cap velocities
  if (birdVyf > 3.9) birdVyf = 3.9;
  if (birdVyf < -4.5) birdVyf = -4.5;

  // Integrate position with a small factor for smoother motion on coarse grids
  birdYf += birdVyf * 0.28;

  int birdY = (int)(birdYf + 0.5);

  // bounds check
  // Allow flying above the screen without instant loss; ground is still a loss
  if (birdY >= FB_HEIGHT) {
    fb_game_over = true;
    return;
  }

  // Pipe movement (moderate speed)
  bool movedThisTick = (fb_tick % 5) == 0;
  if (movedThisTick) {
    for (auto &p : pipes) p.x -= 1;
  }

  // remove off-screen pipes and add new ones
  if (!pipes.empty() && pipes.front().x < -1) {
    pipes.erase(pipes.begin());
  }
  if (pipes.empty() || pipes.back().x < FB_WIDTH) {
    add_pipe_right();
  }

  // collision and scoring: check pipe at bird column
  for (const auto &p : pipes) {
    if (p.x == BIRD_X) {
      // in pipe column; collide if outside gap
      // Only check collision when the bird is within visible board height
      if (birdY >= 0 && birdY < FB_HEIGHT) {
        if (birdY < p.gapY || birdY >= p.gapY + PIPE_GAP) {
          fb_game_over = true;
          return;
        }
      }
    }
    if (p.x == BIRD_X - 1 && movedThisTick) {
      // passed a pipe
      fb_score += 1;
    }
  }
}

EMSCRIPTEN_KEEPALIVE int flappy_tick() {
  if (fb_game_over) return 0;
  fb_tick += 1;
  update_physics();
  return fb_game_over ? 0 : 1;
}

EMSCRIPTEN_KEEPALIVE int flappy_update() { return flappy_tick(); }

// Return board content as character code for flattened index
EMSCRIPTEN_KEEPALIVE int flappy_get_cell(int index) {
  if (index < 0) return 0;
  int w = FB_WIDTH;
  int h = FB_HEIGHT;
  int x = index % w;
  int y = index / w;
  if (y < 0 || y >= h) return 0;

  // bird
  {
    int birdY = (int)(birdYf + 0.5);
    if (x == BIRD_X && y == birdY) return 'B';
  }

  // pipes
  for (const auto &p : pipes) {
    if (p.x == x) {
      if (y < p.gapY || y >= p.gapY + PIPE_GAP) return '#';
      break;
    }
  }

  // background
  return ' ';
}

} 


