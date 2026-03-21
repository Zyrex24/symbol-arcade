#include <emscripten.h>
#include <stdlib.h>
#include <time.h>

static double absd(double v) { return v < 0.0 ? -v : v; }

extern "C" {
    static int secret_number = 0;
    static int attempts = 0;
    static int max_number_global = 100;
    static int hint_difficulty = 1; // 0 easy, 1 normal, 2 hard

    static int hint_code_from_guess(int guess) {
        if (guess == secret_number) return 0;

        int range = max_number_global - 1;
        if (range < 1) range = 1;

        const double ratio = absd((double)(guess - secret_number)) / (double)range;

        double very_close_t = 0.03;
        double close_t = 0.08;
        double low_high_t = 0.20;

        if (hint_difficulty <= 0) {
            very_close_t = 0.05;
            close_t = 0.12;
            low_high_t = 0.28;
        } else if (hint_difficulty >= 2) {
            very_close_t = 0.02;
            close_t = 0.05;
            low_high_t = 0.12;
        }

        int magnitude = 4; // 1 very close, 2 close, 3 low/high, 4 too low/too high
        if (ratio <= very_close_t) magnitude = 1;
        else if (ratio <= close_t) magnitude = 2;
        else if (ratio <= low_high_t) magnitude = 3;

        if (guess < secret_number) return -magnitude;
        return magnitude;
    }

    EMSCRIPTEN_KEEPALIVE
    void start_game(int max_number) {
        srand((unsigned int)time(NULL));
        max_number_global = max_number;
        secret_number = rand() % max_number + 1;
        attempts = 0;
    }

    EMSCRIPTEN_KEEPALIVE
    void set_hint_difficulty(int level) {
        if (level < 0) level = 0;
        if (level > 2) level = 2;
        hint_difficulty = level;
    }

    EMSCRIPTEN_KEEPALIVE
    int make_guess(int guess) {
        attempts++;
        return guess - secret_number;
    }

    EMSCRIPTEN_KEEPALIVE
    int make_guess_hint(int guess) {
        attempts++;
        return hint_code_from_guess(guess);
    }

    EMSCRIPTEN_KEEPALIVE
    int get_attempts() {
        return attempts;
    }
}