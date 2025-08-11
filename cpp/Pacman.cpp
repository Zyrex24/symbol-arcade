#include <vector>
#include <cstdlib>
#include <ctime>
#include <algorithm>

#ifdef __EMSCRIPTEN__
#include <emscripten/emscripten.h>
#define KEEPALIVE EMSCRIPTEN_KEEPALIVE
#else
#define KEEPALIVE
#endif

namespace {
  const int BOARD_WIDTH = 19;
  const int BOARD_HEIGHT = 21;

  // Base map without dynamic entities. '#' wall, '.' pellet, ' ' empty
  // A tiny maze inspired layout; outer walls plus some corridors.
  std::vector<char> baseBoard(BOARD_WIDTH * BOARD_HEIGHT, '.');

  int pacmanX = 1;
  int pacmanY = 1;
  int pacmanDir = 1; // 0 Up, 1 Right, 2 Down, 3 Left

  struct Ghost { int x; int y; int dir; };
  std::vector<Ghost> ghosts;

  int score = 0;
  bool gameOver = false;

  inline int idx(int x, int y) { return y * BOARD_WIDTH + x; }

  bool isWall(int x, int y) {
    if (x < 0 || y < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return true;
    return baseBoard[idx(x, y)] == '#';
  }

  void seedMap() {
    // Fill borders with walls, inner with pellets
    for (int y = 0; y < BOARD_HEIGHT; ++y) {
      for (int x = 0; x < BOARD_WIDTH; ++x) {
        bool border = (x == 0 || y == 0 || x == BOARD_WIDTH - 1 || y == BOARD_HEIGHT - 1);
        baseBoard[idx(x, y)] = border ? '#' : '.';
      }
    }
    // Add a few inner walls to form a simple maze
    for (int x = 3; x < BOARD_WIDTH - 3; ++x) baseBoard[idx(x, 3)] = '#';
    for (int x = 3; x < BOARD_WIDTH - 3; ++x) baseBoard[idx(x, BOARD_HEIGHT - 4)] = '#';
    for (int y = 5; y < BOARD_HEIGHT - 5; ++y) baseBoard[idx(3, y)] = '#';
    for (int y = 5; y < BOARD_HEIGHT - 5; ++y) baseBoard[idx(BOARD_WIDTH - 4, y)] = '#';
    // Carve a few passages
    baseBoard[idx(5, 3)] = '.';
    baseBoard[idx(BOARD_WIDTH - 6, 3)] = '.';
    baseBoard[idx(3, 7)] = '.';
    baseBoard[idx(BOARD_WIDTH - 4, 9)] = '.';
  }

  void resetGame() {
    seedMap();
    pacmanX = 1; pacmanY = 1; pacmanDir = 1;
    ghosts.clear();
    ghosts.push_back({BOARD_WIDTH - 2, 1, 3});
    ghosts.push_back({1, BOARD_HEIGHT - 2, 1});
    ghosts.push_back({BOARD_WIDTH - 2, BOARD_HEIGHT - 2, 0});
    score = 0;
    gameOver = false;
    std::srand(12345); // deterministic
  }

  bool moveIfFree(int &x, int &y, int dir) {
    int nx = x, ny = y;
    if (dir == 0) ny -= 1; else if (dir == 1) nx += 1; else if (dir == 2) ny += 1; else if (dir == 3) nx -= 1;
    if (!isWall(nx, ny)) { x = nx; y = ny; return true; }
    return false;
  }

  void stepPacman() {
    if (moveIfFree(pacmanX, pacmanY, pacmanDir)) {
      char &cell = baseBoard[idx(pacmanX, pacmanY)];
      if (cell == '.') { cell = ' '; score += 10; }
    }
  }

  int randomDirExcept(int except) {
    int d = std::rand() % 4;
    if (d == except) d = (d + 1) % 4;
    return d;
  }

  void stepGhosts() {
    for (auto &g : ghosts) {
      // try forward, else pick a random viable dir
      if (!moveIfFree(g.x, g.y, g.dir)) {
        int tries = 0;
        int nd = randomDirExcept((g.dir + 2) % 4); // avoid direct backtrack
        while (tries < 4 && !moveIfFree(g.x, g.y, nd)) {
          nd = std::rand() % 4;
          ++tries;
        }
        g.dir = nd;
      }
    }
  }

  void checkCollision() {
    for (const auto &g : ghosts) {
      if (g.x == pacmanX && g.y == pacmanY) { gameOver = true; return; }
    }
  }
}

extern "C" {
  KEEPALIVE void pacman_start_game() { resetGame(); }
  KEEPALIVE void pacman_set_direction(int dir) {
    if (dir >= 0 && dir <= 3) pacmanDir = dir;
  }
  KEEPALIVE int pacman_tick() {
    if (gameOver) return 0;
    stepPacman();
    stepGhosts();
    checkCollision();
    return gameOver ? 0 : 1;
  }
  KEEPALIVE int pacman_update() { return pacman_tick(); }
  KEEPALIVE int pacman_is_game_over() { return gameOver ? 1 : 0; }
  KEEPALIVE int pacman_get_score() { return score; }
  KEEPALIVE int pacman_get_width() { return BOARD_WIDTH; }
  KEEPALIVE int pacman_get_height() { return BOARD_HEIGHT; }
  KEEPALIVE int pacman_get_cell(int index) {
    if (index < 0 || index >= (int)baseBoard.size()) return 0;
    int x = index % BOARD_WIDTH;
    int y = index / BOARD_WIDTH;
    // Dynamic overlay: Pacman and ghosts override base tiles
    if (x == pacmanX && y == pacmanY) return (int)('P');
    for (const auto &g : ghosts) { if (g.x == x && g.y == y) return (int)('G'); }
    return (int)baseBoard[index];
  }
}


