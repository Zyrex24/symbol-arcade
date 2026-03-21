#include <emscripten.h>
#include <cstring>
#include <cstdlib>
#include <ctime>

static char board[9]; // 0-8, 'X', 'O', or ' '
static char current_player;
static int moves;
static bool rng_seeded = false;

static const int WIN_LINES[8][3] = {
    {0,1,2},{3,4,5},{6,7,8},
    {0,3,6},{1,4,7},{2,5,8},
    {0,4,8},{2,4,6}
};

static void seed_rng_once() {
    if (!rng_seeded) {
        std::srand(static_cast<unsigned int>(std::time(nullptr)));
        rng_seeded = true;
    }
}

static int winner_for_board(const char* b) {
    for (int i = 0; i < 8; ++i) {
        int a = WIN_LINES[i][0], c1 = WIN_LINES[i][1], c2 = WIN_LINES[i][2];
        if (b[a] != ' ' && b[a] == b[c1] && b[c1] == b[c2]) return b[a];
    }
    for (int i = 0; i < 9; ++i) {
        if (b[i] == ' ') return 0;
    }
    return 'D';
}

static int random_available_move() {
    int available[9];
    int count = 0;
    for (int i = 0; i < 9; ++i) {
        if (board[i] == ' ') available[count++] = i;
    }
    if (count == 0) return -1;
    return available[std::rand() % count];
}

static int find_winning_move(char player) {
    for (int i = 0; i < 9; ++i) {
        if (board[i] != ' ') continue;
        board[i] = player;
        int win = winner_for_board(board);
        board[i] = ' ';
        if (win == player) return i;
    }
    return -1;
}

static int minimax(bool maximizing) {
    int result = winner_for_board(board);
    if (result == 'O') return 10;
    if (result == 'X') return -10;
    if (result == 'D') return 0;

    if (maximizing) {
        int best = -1000;
        for (int i = 0; i < 9; ++i) {
            if (board[i] != ' ') continue;
            board[i] = 'O';
            int score = minimax(false);
            board[i] = ' ';
            if (score > best) best = score;
        }
        return best;
    }

    int best = 1000;
    for (int i = 0; i < 9; ++i) {
        if (board[i] != ' ') continue;
        board[i] = 'X';
        int score = minimax(true);
        board[i] = ' ';
        if (score < best) best = score;
    }
    return best;
}

static int best_minimax_move() {
    int best_score = -1000;
    int best_move = -1;
    for (int i = 0; i < 9; ++i) {
        if (board[i] != ' ') continue;
        board[i] = 'O';
        int score = minimax(false);
        board[i] = ' ';
        if (score > best_score) {
            best_score = score;
            best_move = i;
        }
    }
    return best_move;
}

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void ttt_start_game() {
        seed_rng_once();
        memset(board, ' ', 9);
        current_player = 'X';
        moves = 0;
    }

    EMSCRIPTEN_KEEPALIVE
    char ttt_get_current_player() {
        return current_player;
    }

    EMSCRIPTEN_KEEPALIVE
    int ttt_make_move(int idx) {
        if (idx < 0 || idx > 8 || board[idx] != ' ') return 0; // Invalid
        board[idx] = current_player;
        moves++;
        return 1; // Success
    }

    EMSCRIPTEN_KEEPALIVE
    void ttt_next_player() {
        current_player = (current_player == 'X') ? 'O' : 'X';
    }

    EMSCRIPTEN_KEEPALIVE
    char* ttt_get_board() {
        return board;
    }

    // New: Get a single cell value as an int (char code), -1 if invalid index
    EMSCRIPTEN_KEEPALIVE
    int ttt_get_cell(int idx) {
        if (idx < 0 || idx > 8) return -1;
        return (int)board[idx];
    }

    EMSCRIPTEN_KEEPALIVE
    int ttt_check_winner() {
        return winner_for_board(board);
    }

    // difficulty: 0 easy, 1 medium, 2 hard, 3 impossible
    EMSCRIPTEN_KEEPALIVE
    int ttt_ai_move(int difficulty) {
        if (current_player != 'O') return -1;
        if (winner_for_board(board) != 0) return -1;

        seed_rng_once();

        int move = -1;
        int win_now = find_winning_move('O');
        int block_now = find_winning_move('X');

        if (difficulty <= 0) {
            move = random_available_move();
        } else if (difficulty == 1) {
            if (win_now >= 0) move = win_now;
            else if (block_now >= 0 && (std::rand() % 100) < 60) move = block_now;
            else move = random_available_move();
        } else if (difficulty == 2) {
            if (win_now >= 0) move = win_now;
            else if (block_now >= 0) move = block_now;
            else if ((std::rand() % 100) < 75) move = best_minimax_move();
            else {
                int preferred[5] = {4,0,2,6,8};
                int candidates[5];
                int count = 0;
                for (int i = 0; i < 5; ++i) {
                    if (board[preferred[i]] == ' ') candidates[count++] = preferred[i];
                }
                if (count > 0) move = candidates[std::rand() % count];
                else move = random_available_move();
            }
        } else {
            move = best_minimax_move();
        }

        if (move < 0 || move > 8 || board[move] != ' ') return -1;
        board[move] = 'O';
        moves++;
        return move;
    }
}
