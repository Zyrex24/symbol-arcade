# WASM Arcade v2.0

High-performance mini games powered by C++ WebAssembly for game logic and React for UI.

Built by [Zyrex24](https://github.com/Zyrex24) and [DIEMOS192](https://github.com/DIEMOS192).

## Live Demo

[https://diemos192.github.io/symbol-arcade/](https://diemos192.github.io/symbol-arcade/)

## What's New In v2.0

- GitHub Pages deployment with correct base-path WASM loading.
- PWA support for installable experience and offline-ready assets.
- Tic Tac Toe computer opponent moved fully into C++ with difficulty levels.
- Guess The Number hint system improved with clearer closeness tiers.
- Flappy Bird improved with smoother fixed-step gameplay and better mobile fit.
- Snake improved with stable timing, swipe controls, and dedicated mobile play focus.
- Pacman updated to a cleaner Lite flow with more deterministic collisions.

## Featured Games

- Guess The Number
- Tic Tac Toe
- Snake
- Rock Paper Scissors
- Pacman Lite
- Flappy Bird

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- C++ compiled to WebAssembly with Emscripten
- Bun-first dev/build workflow

## Quick Start

### Prerequisites

- Bun
- Emscripten SDK (for WASM compilation)

### Setup

```bash
git clone https://github.com/Zyrex24/symbol-arcade.git
cd symbol-arcade
bun install
bun run wasm:build
bun run dev
```

### Common Commands

```bash
bun run dev
bun run build
bun run preview
bun run wasm:build
bun run wasm:clean
bun run wasm:watch
```

## Architecture

- C++/WASM handles game rules, state transitions, and AI logic.
- React handles rendering, user interaction, and responsive layouts.

## License

MIT. See [LICENSE](LICENSE).
