#!/bin/bash

# Demo script to test automatic WASM rebuilding
# This script makes a small change to a C++ file to trigger rebuild

echo "Testing automatic WASM rebuild..."

# Create a backup
cp cpp/GuessTheNumber.cpp cpp/GuessTheNumber.cpp.backup

# Make a small comment change
echo "// Auto-build test $(date)" >> cpp/GuessTheNumber.cpp

echo "Modified GuessTheNumber.cpp - check your dev server console for automatic rebuild!"
echo "Reverting in 10 seconds..."

sleep 10

# Restore original
mv cpp/GuessTheNumber.cpp.backup cpp/GuessTheNumber.cpp

echo "Reverted changes. WASM should rebuild again automatically!"
