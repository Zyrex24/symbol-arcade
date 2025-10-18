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
  const int BOARD_WIDTH = 28;
  const int BOARD_HEIGHT = 31;

  // Base map without dynamic entities. '#' wall, '.' pellet, 'o' power pellet, ' ' empty
  std::vector<char> baseBoard(BOARD_WIDTH * BOARD_HEIGHT, ' ');

  int pacmanX = 13;
  int pacmanY = 23;
  int pacmanDir = 1; // 0 Up, 1 Right, 2 Down, 3 Left
  int pacmanPendingDir = -1; // buffered desired direction

  struct Ghost { int x; int y; int dir; int scatterX; int scatterY; bool released; int releaseTick; };
  std::vector<Ghost> ghosts;

  int score = 0;
  bool gameOver = false;
  bool gameWon = false;
  int frightenedTimer = 0; // global frightened duration for simplicity
  long long tickCount = 0;
  int ghostSpeed = 1; // ticks per move, lower is faster (Pacman update throttled in UI)
  int ghostMoveTick = 0;

  inline int idx(int x, int y) { return y * BOARD_WIDTH + x; }

  bool isWall(int x, int y) {
    if (x < 0 || y < 0 || x >= BOARD_WIDTH || y >= BOARD_HEIGHT) return true;
    return baseBoard[idx(x, y)] == '#';
  }

  void seedMap() {
    // Approximate 28x31 classic maze. Each string must be width 28.
    // Using simple straight segments to keep pathfinding performant.
    static const char* MAP[BOARD_HEIGHT] = {
      "############################",
      "#............##............#",
      "#.####.#####.##.#####.####.#",
      "#o####.#####.##.#####.####o#",
      "#.####.#####.##.#####.####.#",
      "#..........................#",
      "#.####.##.########.##.####.#",
      "#.####.##.########.##.####.#",
      "#......##....##....##......#",
      "######.##### ## #####.######",
      "######.##### ## #####.######",
      "######.##          ##.######",
      "######.## ###GG### ##.######",
      "      .   #      #   .      ",
      "######.## # #### # ##.######",
      "######.## #      # ##.######",
      "######.## ######## ##.######",
      "#............##............#",
      "#.####.#####.##.#####.####.#",
      "#.####.#####.##.#####.####.#",
      "#o..##................##..o#",
      "###.##.##.########.##.##.###",
      "###.##.##.########.##.##.###",
      "#......##....##....##......#",
      "#.##########.##.##########.#",
      "#..........................#",
      "#.##########.##.##########.#",
      "#..........................#",
      "############################",
      "############################",
      "############################",
    };

    for (int y = 0; y < BOARD_HEIGHT; ++y) {
      for (int x = 0; x < BOARD_WIDTH; ++x) {
        char c = MAP[y][x];
        if (c == 'G') c = ' '; // ghosts are dynamic, leave path
        baseBoard[idx(x, y)] = c;
      }
    }
  }

  // Basic connectivity check to ensure Pacman can reach pellets
  bool mapIsReachableFrom(int sx, int sy) {
    std::vector<int> vis(BOARD_WIDTH * BOARD_HEIGHT, 0);
    std::vector<int> q;
    auto push = [&](int x, int y){ int id = idx(x,y); if (!vis[id]) { vis[id]=1; q.push_back(id);} };
    if (isWall(sx, sy)) return false;
    push(sx, sy);
    size_t qi = 0;
    const int dx[4] = {0,1,0,-1};
    const int dy[4] = {-1,0,1,0};
    while (qi < q.size()) {
      int id0 = q[qi++];
      int x = id0 % BOARD_WIDTH; int y = id0 / BOARD_WIDTH;
      for (int d = 0; d < 4; ++d) {
        int nx = x + dx[d]; int ny = y + dy[d];
        if (nx < 0 || ny < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) continue;
        if (isWall(nx, ny)) continue;
        push(nx, ny);
      }
    }
    // Ensure all pellets are in visited area
    for (int y = 0; y < BOARD_HEIGHT; ++y) {
      for (int x = 0; x < BOARD_WIDTH; ++x) {
        char c = baseBoard[idx(x,y)];
        if ((c == '.' || c == 'o') && !vis[idx(x,y)]) return false;
      }
    }
    return true;
  }

  void randomMap() {
    for (int y = 0; y < BOARD_HEIGHT; ++y) {
      for (int x = 0; x < BOARD_WIDTH; ++x) {
        if (x == 0 || y == 0 || x == BOARD_WIDTH-1 || y == BOARD_HEIGHT-1) {
          baseBoard[idx(x, y)] = '#';
        } else {
          baseBoard[idx(x, y)] = '.';
        }
      }
    }
    // Carve random paths, ensure connectivity afterwards
    int holes = (BOARD_WIDTH * BOARD_HEIGHT) / 3;
    for (int i = 0; i < holes; ++i) {
      int x = 1 + std::rand() % (BOARD_WIDTH-2);
      int y = 1 + std::rand() % (BOARD_HEIGHT-2);
      baseBoard[idx(x, y)] = ' ';
    }
    // Place power pellets at random non-wall cells
    int placed = 0;
    while (placed < 4) {
      int x = 1 + std::rand() % (BOARD_WIDTH-2);
      int y = 1 + std::rand() % (BOARD_HEIGHT-2);
      if (!isWall(x,y) && baseBoard[idx(x,y)] == '.') {
        baseBoard[idx(x,y)] = 'o';
        placed++;
      }
    }
    // Validate connectivity; if invalid, regenerate recursively (bounded attempts)
    for (int attempt = 0; attempt < 4; ++attempt) {
      if (mapIsReachableFrom(pacmanX, pacmanY)) return;
      // regenerate holes
      for (int y = 1; y < BOARD_HEIGHT-1; ++y) {
        for (int x = 1; x < BOARD_WIDTH-1; ++x) {
          baseBoard[idx(x, y)] = (std::rand()%4==0) ? ' ' : '.';
        }
      }
    }
    // Fallback: seeded map if random failed to be valid
    seedMap();
  }

  void resetGame(int level = 1) {
    if (level <= 2) seedMap();
    else randomMap();
    pacmanX = 13; pacmanY = 23; pacmanDir = 1;
    ghosts.clear();
    int ghostCount = 4;
    ghostSpeed = 1;
    if (level == 2) { ghostCount = 5; ghostSpeed = 2; }
    if (level >= 3) { ghostCount = 6; ghostSpeed = 3; }
    ghosts.push_back({13, 12, 2, BOARD_WIDTH-2, 1, false, 80});   // red, release early
    ghosts.push_back({14, 12, 2, 1, 1, false, 160});              // pink
    ghosts.push_back({12, 12, 2, 1, BOARD_HEIGHT-2, false, 240}); // blue
    ghosts.push_back({15, 12, 2, BOARD_WIDTH-2, BOARD_HEIGHT-2, false, 320}); // orange
    for (int i = 4; i < ghostCount; ++i) {
      ghosts.push_back({13 + (i-4), 13, 2, BOARD_WIDTH/2, 1, false, 400 + (i-4)*80});
    }
    score = 0;
    gameOver = false;
    gameWon = false;
    frightenedTimer = 0;
    tickCount = 0;
    ghostMoveTick = 0;
    std::srand((unsigned int)time(NULL));
  }

  bool canMove(int x, int y, int dir) {
    int nx = x, ny = y;
    if (dir == 0) ny -= 1; else if (dir == 1) nx += 1; else if (dir == 2) ny += 1; else if (dir == 3) nx -= 1;
    return !isWall(nx, ny);
  }

  bool moveIfFree(int &x, int &y, int dir) {
    int nx = x, ny = y;
    if (dir == 0) ny -= 1; else if (dir == 1) nx += 1; else if (dir == 2) ny += 1; else if (dir == 3) nx -= 1;
    if (!isWall(nx, ny)) { x = nx; y = ny; return true; }
    return false;
  }

  void stepPacman() {
    // Apply buffered turn if available and possible from current tile
    if (pacmanPendingDir != -1 && canMove(pacmanX, pacmanY, pacmanPendingDir)) {
      pacmanDir = pacmanPendingDir;
      pacmanPendingDir = -1;
    }
    if (moveIfFree(pacmanX, pacmanY, pacmanDir)) {
      char &cell = baseBoard[idx(pacmanX, pacmanY)];
      if (cell == '.') { cell = ' '; score += 10; }
      else if (cell == 'o') { cell = ' '; score += 50; frightenedTimer = 80; }
    }
  }

  int randomDirExcept(int except) {
    int d = std::rand() % 4;
    if (d == except) d = (d + 1) % 4;
    return d;
  }

  struct Node { int x; int y; int px; int py; };

  bool passable(int x, int y) { return !isWall(x, y); }

  int bfsNextDir(int sx, int sy, int tx, int ty, int forbidDir) {
    if (sx == tx && sy == ty) return forbidDir == 0 ? 0 : (forbidDir == 1 ? 1 : (forbidDir == 2 ? 2 : 3));
    const int size = BOARD_WIDTH * BOARD_HEIGHT;
    std::vector<int> visited(size, 0);
    std::vector<Node> parent(size, {-1,-1,-1,-1});
    std::vector<Node> q;
    auto push = [&](int x, int y, int px, int py){
      int id = idx(x,y);
      if (visited[id]) return;
      visited[id] = 1;
      parent[id] = {x,y,px,py};
      q.push_back({x,y,px,py});
    };
    push(sx, sy, -1, -1);
    size_t qi = 0;
    const int dx[4] = {0,1,0,-1};
    const int dy[4] = {-1,0,1,0};
    while (qi < q.size()) {
      Node cur = q[qi++];
      if (cur.x == tx && cur.y == ty) break;
      for (int dir = 0; dir < 4; ++dir) {
        // forbid immediate reverse from the start tile only
        if (cur.x == sx && cur.y == sy && dir == ((forbidDir + 2) % 4)) continue;
        int nx = cur.x + dx[dir];
        int ny = cur.y + dy[dir];
        if (nx < 0 || ny < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) continue;
        if (!passable(nx, ny)) continue;
        push(nx, ny, cur.x, cur.y);
      }
    }
    // Reconstruct path from target back to start
    int tid = idx(tx, ty);
    if (!visited[tid]) return randomDirExcept(forbidDir); // no path
    int cx = tx, cy = ty;
    int px = parent[tid].px, py = parent[tid].py;
    while (!(px == -1 && py == -1)) {
      if (px == sx && py == sy) {
        // first step from start to (cx,cy)
        if (cx == sx && cy == sy-1) return 0;
        if (cx == sx+1 && cy == sy) return 1;
        if (cx == sx && cy == sy+1) return 2;
        if (cx == sx-1 && cy == sy) return 3;
      }
      int id = idx(px, py);
      int npx = parent[id].px;
      int npy = parent[id].py;
      cx = px; cy = py; px = npx; py = npy;
    }
    return randomDirExcept(forbidDir);
  }

  int clamp(int v, int lo, int hi) { if (v < lo) return lo; if (v > hi) return hi; return v; }

  void stepGhosts() {
    ++tickCount;
    if (tickCount % ghostSpeed != 0) return; // ghosts move slower on lower levels
    if (frightenedTimer > 0) frightenedTimer--;
    // Mode schedule: scatter for 60 ticks every 400, otherwise chase
    bool scatter = ((tickCount % 400) < 60);
    for (size_t i = 0; i < ghosts.size(); ++i) {
      auto &g = ghosts[i];
      // Prison release timing
      if (!g.released) {
        if ((int)tickCount >= g.releaseTick) {
          g.released = true;
        } else {
          continue; // stay in pen until released
        }
      }
      int targetX = pacmanX;
      int targetY = pacmanY;
      if (frightenedTimer > 0) {
        // run away: target its scatter corner
        targetX = g.scatterX; targetY = g.scatterY;
      } else if (scatter) {
        targetX = g.scatterX; targetY = g.scatterY;
      } else {
        // chase variations
        int dx = (pacmanDir == 1) ? 1 : (pacmanDir == 3 ? -1 : 0);
        int dy = (pacmanDir == 2) ? 1 : (pacmanDir == 0 ? -1 : 0);
        if (i == 1) { // predict two tiles ahead
          targetX = clamp(pacmanX + 2*dx, 1, BOARD_WIDTH-2);
          targetY = clamp(pacmanY + 2*dy, 1, BOARD_HEIGHT-2);
        } else if (i == 2) { // predict four tiles ahead
          targetX = clamp(pacmanX + 4*dx, 1, BOARD_WIDTH-2);
          targetY = clamp(pacmanY + 4*dy, 1, BOARD_HEIGHT-2);
        } else if (i == 3) { // mix scatter bias
          if ((tickCount % 80) < 20) { targetX = g.scatterX; targetY = g.scatterY; }
        }
      }

      int ndir = bfsNextDir(g.x, g.y, targetX, targetY, g.dir);
      // move
      int ox = g.x, oy = g.y;
      if (!moveIfFree(g.x, g.y, ndir)) {
        // fallback try keep moving
        if (!moveIfFree(g.x, g.y, g.dir)) {
          // try random
          for (int k = 0; k < 4 && !moveIfFree(g.x, g.y, k); ++k) {}
        } else {
          ndir = g.dir;
        }
      }
      g.dir = ndir;
    }
  }

  void checkCollision() {
    for (auto &g : ghosts) {
      if (g.x == pacmanX && g.y == pacmanY) {
        if (frightenedTimer > 0) {
          score += 200; // eat ghost, send back to pen
          g.x = 13; g.y = 12; g.dir = 2;
        } else {
          gameOver = true; return;
        }
      }
    }
    // Win detection: no pellets or power pellets left
    if (!gameOver) {
      bool anyPellet = false;
      for (int y = 0; y < BOARD_HEIGHT && !anyPellet; ++y) {
        for (int x = 0; x < BOARD_WIDTH; ++x) {
          char c = baseBoard[idx(x,y)];
          if (c == '.' || c == 'o') { anyPellet = true; break; }
        }
      }
      if (!anyPellet) { gameWon = true; gameOver = true; }
    }
  }
}
extern "C" {
  KEEPALIVE void pacman_start_game(int level) { resetGame(level); }
  KEEPALIVE void pacman_set_direction(int dir) {
    if (dir >= 0 && dir <= 3) {
      // Buffer desired direction; applied at next step if possible
      pacmanPendingDir = dir;
    }
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
    for (int i = 0; i < (int)ghosts.size(); ++i) {
      if (ghosts[i].x == x && ghosts[i].y == y) return (int)('G');
    }
    return (int)baseBoard[index];
  }
}


