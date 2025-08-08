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
    fi
    # each game will be an elif block
done

echo "Build complete. WASM modules are in $BUILD_DIR/ and copied to $PUBLIC_DIR/"
