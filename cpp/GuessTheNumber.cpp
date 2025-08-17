#include <emscripten.h>
#include <stdlib.h>
#include <time.h>

extern "C" {
    static int secret_number = 0;
    static int attempts = 0;

    EMSCRIPTEN_KEEPALIVE
    void start_game(int max_number) {
        srand((unsigned int)time(NULL));
        secret_number = rand() % max_number + 1;
        attempts = 0;
    }

    EMSCRIPTEN_KEEPALIVE
    int make_guess(int guess) {
        attempts++;
        return guess - secret_number;
    }

    EMSCRIPTEN_KEEPALIVE
    int get_attempts() {
        return attempts;
    }
}