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
        if (guess < secret_number) return -1; // Too low
        if (guess > secret_number) return 1;  // Too high
        return 0; // Correct
    }

    EMSCRIPTEN_KEEPALIVE
    int get_attempts() {
        return attempts;
    }
} 