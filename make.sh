#!/bin/bash
set -e

CPP_DIR="cpp"
BUILD_DIR="wasm_build"
PUBLIC_DIR="public/wasm"

if [ "$1" == "clean" ]; then
    echo "Cleaning $BUILD_DIR and $PUBLIC_DIR..."
    rm -rf "$BUILD_DIR"/*
    rm -rf "$PUBLIC_DIR"/*
    exit 0
fi

mkdir -p "$BUILD_DIR"
mkdir -p "$PUBLIC_DIR"

for src in "$CPP_DIR"/*.cpp; do
    base=$(basename "$src" .cpp)
    echo "Building $base..."
    if [ "$base" == "GuessTheNumber" ]; then
        emcc $src -O3 --no-entry -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME="Module" \
          -s EXPORTED_FUNCTIONS="['_start_game','_make_guess','_get_attempts']" \
          -s EXPORTED_RUNTIME_METHODS="['cwrap','ccall']" \
          -o "$BUILD_DIR/$base.js"
        # Copy to public directory
        cp "$BUILD_DIR/$base.js" "$PUBLIC_DIR/"
        cp "$BUILD_DIR/$base.wasm" "$PUBLIC_DIR/"
    elif [ "$base" == "TicTacToe" ]; then
        emcc $src -O3 --no-entry -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME="Module" \
          -s EXPORTED_FUNCTIONS="['_malloc','_free','_ttt_start_game','_ttt_get_current_player','_ttt_make_move','_ttt_next_player','_ttt_get_board','_ttt_get_cell','_ttt_check_winner']" \
          -s EXPORTED_RUNTIME_METHODS="['cwrap','ccall']" \
          -o "$BUILD_DIR/$base.js"
        # Copy to public directory
        cp "$BUILD_DIR/$base.js" "$PUBLIC_DIR/"
        cp "$BUILD_DIR/$base.wasm" "$PUBLIC_DIR/"
    elif [ "$base" == "Snake" ]; then
        emcc $src -O3 --no-entry -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME="Module" \
          -s EXPORTED_FUNCTIONS="['_snake_start_game','_snake_reset','_snake_set_direction','_snake_tick','_snake_is_game_over','_snake_get_score','_snake_get_width','_snake_get_height','_snake_get_board','_snake_get_cell']" \
          -s EXPORTED_RUNTIME_METHODS="['cwrap','ccall']" \
          -o "$BUILD_DIR/$base.js"
        # Copy to public directory
        cp "$BUILD_DIR/$base.js" "$PUBLIC_DIR/"
        cp "$BUILD_DIR/$base.wasm" "$PUBLIC_DIR/"
    elif [ "$base" == "Pacman" ]; then
        emcc $src -O3 --no-entry -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME="Module" \
          -s EXPORTED_FUNCTIONS="['_pacman_start_game','_pacman_set_direction','_pacman_tick','_pacman_update','_pacman_is_game_over','_pacman_get_score','_pacman_get_width','_pacman_get_height','_pacman_get_cell']" \
          -s EXPORTED_RUNTIME_METHODS="['cwrap','ccall']" \
          -o "$BUILD_DIR/$base.js"
        # Copy to public directory
        cp "$BUILD_DIR/$base.js" "$PUBLIC_DIR/"
        cp "$BUILD_DIR/$base.wasm" "$PUBLIC_DIR/"
    fi
    # each game will be an elif block
done

echo "Build complete. WASM modules are in $BUILD_DIR/ and copied to $PUBLIC_DIR/"
