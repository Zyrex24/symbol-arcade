#!/bin/bash
set -e

CPP_DIR="cpp"
BUILD_DIR="wasm_build"
EMCC_FLAGS="-O3 --no-entry -s WASM=1 -s MODULARIZE=1 -s EXPORT_NAME=\"Module\" -s EXPORTED_FUNCTIONS=['_start_game','_make_guess','_get_attempts'] -s EXPORTED_RUNTIME_METHODS=['cwrap','ccall']"

if [ "$1" == "clean" ]; then
    echo "Cleaning $BUILD_DIR..."
    rm -rf "$BUILD_DIR"/*
    exit 0
fi

mkdir -p "$BUILD_DIR"

# Only build GuessTheNumber.cpp for now
echo "Building GuessTheNumber..."
emcc "$CPP_DIR/GuessTheNumber.cpp" $EMCC_FLAGS -o "$BUILD_DIR/GuessTheNumber.js"

echo "Build complete. WASM module is in $BUILD_DIR/"
