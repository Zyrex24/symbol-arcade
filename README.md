# 🎮 WASM Arcade

> **High-performance mini games powered by WebAssembly and C++**

A collection of classic games reimagined with blazing-fast C++ logic and modern React UI. Experience the perfect blend o---

**Built with ❤️ by [Zyrex24](https://github.com/Zyrex24) & [DIEMOS192](https://github.com/DIEMOS192)**

*Experience the future of web gaming - where C++ performance meets React elegance.*formance and user experience.

![WASM Arcade](https://img.shields.io/badge/WASM-Arcade-blue?style=for-the-badge&logo=webassembly)
![Performance](https://img.shields.io/badge/Performance-C++-red?style=for-the-badge&logo=cplusplus)
![UI](https://img.shields.io/badge/UI-React-blue?style=for-the-badge&logo=react)

## 🚀 Live Demo

**[Play Now → https://symbol-arcade.vercel.app](https://symbol-arcade.vercel.app)**

## 🎯 Featured Games

| Game                       | Description                 | Technology Highlights                       |
| -------------------------- | --------------------------- | ------------------------------------------- |
| 🔢 **Guess The Number**    | Classic 1-100 guessing game | C++ random generation + attempt tracking    |
| ❌⭕ **Tic Tac Toe**       | Two-player strategy         | C++ game logic + winner detection           |
| 🐍 **Snake**               | Real-time arcade action     | C++ collision detection + autonomous timing |
| ✂️ **Rock Paper Scissors** | Hand game with stats        | C++ winner calculation + statistics         |
| 🟡 **Pacman**              | Maze navigation classic     | C++ pathfinding + ghost AI                  |

## ⚡ Performance Architecture

### **C++ Handles (WebAssembly)**

- 🧮 **Game Logic** - All calculations and rules
- 🎲 **Random Generation** - Seed-based algorithms
- 📊 **State Management** - Memory-efficient storage
- 🏃 **Real-time Updates** - 60fps game loops
- 🤖 **AI Behavior** - Deterministic algorithms

### **React Handles (UI Layer)**

- 🎨 **Rendering** - Pure UI display
- 👆 **User Interaction** - Event handling
- 🎭 **Animations** - CSS transitions
- 📱 **Responsive Design** - Mobile-first layout

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v3.4 + Custom gradients
- **Performance**: WebAssembly (C++ → WASM)
- **Build**: Emscripten + Smart WASM compilation
- **Deployment**: Vercel with automatic builds

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Emscripten SDK (for WASM compilation)

### Installation

```bash
# Clone the repository
git clone https://github.com/Zyrex24/symbol-arcade.git
cd symbol-arcade

# Install dependencies
npm install
# or
bun install

# Build WASM modules
npm run wasm:build

# Start development server
npm run dev
```

### Development Commands

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Rebuild WASM modules
npm run wasm:build

# Clean and rebuild WASM
npm run wasm:clean

# Watch C++ files for changes
npm run wasm:watch
```

## 🏗️ Project Structure

```
├── cpp/                    # C++ game logic
│   ├── GuessTheNumber.cpp  # Number guessing game
│   ├── TicTacToe.cpp      # Tic tac toe logic
│   ├── Snake.cpp          # Snake game engine
│   ├── RockPaperScissors.cpp # Hand game logic
│   └── Pacman.cpp         # Pacman maze engine
├── src/
│   ├── components/        # React game components
│   ├── hooks/            # WASM integration hooks
│   └── types/            # TypeScript definitions
├── public/wasm/          # Compiled WASM modules
└── scripts/              # Build automation
```

## 🔧 Adding New Games

1. **Create C++ Logic** (`cpp/YourGame.cpp`)

```cpp
#include <emscripten.h>

extern "C" {
  EMSCRIPTEN_KEEPALIVE
  void your_game_start() {
    // Game initialization
  }
}
```

2. **Add Build Configuration** (`make.sh`)

```bash
elif [ "$base" == "YourGame" ]; then
    emcc $src -O3 --no-entry -s WASM=1 \
      -s EXPORTED_FUNCTIONS="['_your_game_start']" \
      # ... other flags
```

3. **Create React Component** (`src/components/YourGameComponent.tsx`)

```tsx
import { useWasmLoader } from "../hooks/useWasmLoader";

export default function YourGame({ onBack }) {
  const { wasmRef, isLoaded } = useWasmLoader("YourGame");
  // Component logic
}
```

4. **Update Type Definitions** (`src/hooks/useWasmLoader.ts`)

## 🎨 Design Philosophy

### **Performance First**

- C++ handles all computational logic
- WASM provides near-native performance
- React only manages UI rendering
- Zero JavaScript game calculations

### **Modern UX**

- Responsive design for all devices
- Smooth animations and transitions
- Accessible color schemes
- Intuitive navigation

### **Developer Experience**

- Hot reload for both React and WASM
- TypeScript for type safety
- Automated build pipeline
- Smart change detection

## 📊 Performance Metrics

- **Game Logic**: C++ WebAssembly (~near-native speed)
- **UI Rendering**: React 19 with concurrent features
- **Bundle Size**: ~2MB (including all WASM modules)
- **First Load**: <3s on 3G networks
- **Game Response**: <16ms (60fps)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-game`
3. Add your C++ game logic and React component
4. Update documentation and tests
5. Submit a pull request

### Development Guidelines

- Follow C++ performance best practices
- Keep React components purely presentational
- Add TypeScript types for all WASM functions
- Update build scripts for new games

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **Emscripten** - C++ to WebAssembly compilation
- **React Team** - Modern UI framework
- **Tailwind CSS** - Utility-first styling
- **Vite** - Lightning-fast build tool

---

**Built with ❤️ by [Zyrex24](https://github.com/Zyrex24) & [DIEMOS192](https://github.com/DIEMOS192)**

*Experience the future of web gaming - where C++ performance meets React elegance.*
