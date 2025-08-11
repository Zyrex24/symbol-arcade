#include <vector>
#include <cstdlib>
#include <ctime>

// Minimal Flappy Bird clone for WASM export
// Board is a simple character grid read from JS via _flappy_get_cell

extern "C" {

// Game parameters
static const int FB_WIDTH = 28;
static const int FB_HEIGHT = 20;
static const int PIPE_GAP = 5;      // vertical gap size
static const int PIPE_SPACING = 12; // columns between pipes
static const int BIRD_X = 6;        // fixed x position of bird

// Game state
static bool fb_initialized = false;
static bool fb_game_over = false;
static int fb_score = 0;
static int fb_tick = 0;

static int birdY = 10;
static int birdVy = 0;

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
  fb_score = 0;
  fb_tick = 0;
  birdY = FB_HEIGHT / 2;
  birdVy = 0;
  pipes.clear();

  // Seed with a couple of pipes off-screen to the right
  int startX = FB_WIDTH + 8;
  for (int i = 0; i < 3; ++i) {
    Pipe p;
    p.x = startX + i * PIPE_SPACING;
    p.gapY = irand(2, FB_HEIGHT - PIPE_GAP - 2);
    pipes.push_back(p);
  }
}

// Public API
int _flappy_get_width() { return FB_WIDTH; }
int _flappy_get_height() { return FB_HEIGHT; }
int _flappy_get_score() { return fb_score; }
int _flappy_is_game_over() { return fb_game_over ? 1 : 0; }

void _flappy_start_game() { fb_reset(); }

void _flappy_flap() {
  if (fb_game_over) return;
  birdVy = -3; // impulse upward
}

static void add_pipe_right() {
  int maxRight = FB_WIDTH;
  for (const auto &p : pipes) if (p.x > maxRight) maxRight = p.x;
  Pipe np;
  np.x = maxRight + PIPE_SPACING;
  np.gapY = irand(2, FB_HEIGHT - PIPE_GAP - 2);
  pipes.push_back(np);
}

static void update_physics() {
  if (fb_game_over) return;

  // gravity
  birdVy += 1;          // accelerate downwards
  if (birdVy > 3) birdVy = 3; // clamp terminal velocity
  birdY += birdVy;

  // bounds check
  if (birdY < 0 || birdY >= FB_HEIGHT) {
    fb_game_over = true;
    return;
  }

  // move pipes left every few ticks to keep pace reasonable
  bool movedThisTick = (fb_tick % 2) == 0;
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
      if (birdY < p.gapY || birdY >= p.gapY + PIPE_GAP) {
        fb_game_over = true;
        return;
      }
    }
    if (p.x == BIRD_X - 1 && movedThisTick) {
      // passed a pipe
      fb_score += 1;
    }
  }
}

int _flappy_tick() {
  if (fb_game_over) return 0;
  fb_tick += 1;
  update_physics();
  return fb_game_over ? 0 : 1;
}

int _flappy_update() { return _flappy_tick(); }

// Return board content as character code for flattened index
int _flappy_get_cell(int index) {
  if (index < 0) return 0;
  int w = FB_WIDTH;
  int h = FB_HEIGHT;
  int x = index % w;
  int y = index / w;
  if (y < 0 || y >= h) return 0;

  // bird
  if (x == BIRD_X && y == birdY) return 'B';

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


