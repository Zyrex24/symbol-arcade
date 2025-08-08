#include <emscripten.h>
#include <cstring>

extern "C" {
    static char board[9]; // 0-8, 'X', 'O', or ' '
    static char current_player;
    static int moves;

    EMSCRIPTEN_KEEPALIVE
    void ttt_start_game() {
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
        int wins[8][3] = {
            {0,1,2},{3,4,5},{6,7,8}, // rows
            {0,3,6},{1,4,7},{2,5,8}, // cols
            {0,4,8},{2,4,6}          // diags
        };
        for (int i = 0; i < 8; ++i) {
            int a = wins[i][0], b = wins[i][1], c = wins[i][2];
            if (board[a] != ' ' && board[a] == board[b] && board[b] == board[c])
                return board[a]; // 'X' or 'O'
        }
        if (moves == 9) return 'D'; // Draw
        return 0; // No winner
    }
}
