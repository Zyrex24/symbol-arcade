# Symbol Arcade

**Symbol Arcade** is a retro-inspired web game hub that blends modern web technologies with the nostalgic charm of old-school browser games. Built using **React** for the UI and **C++ compiled to WebAssembly (WASM)** for high-performance game logic, each icon on the menu represents a mini-game waiting to be played.

> Powered by C++ + WebAssembly | 💻 Built with React | 🎮 Runs 100% in the browser

---

## Live Demo

Coming soon...

---

## Features

- **Symbol-Based Game Menu** – Clickable icon grid to access each game.
- **WASM-Powered Gameplay** – Game logic written in C++, compiled to WebAssembly.
- **Modular Mini-Games** – Add new games easily with a scalable structure.
- **Canvas Rendering** – Smooth rendering using HTML5 Canvas.
- **Fully Responsive** – Optimized for desktop, tablet, and mobile devices.
- **Educational Value** – Learn cross-language development (C++ + JavaScript).

---

## Games Included

| Game | Description |
|------|-------------|
| 🐍 Snake | Classic snake game with arrow/WASD controls |
| 🏓 Pong | Old-school paddle game for 1 or 2 players |
| 🧩 More coming... | Memory, Brick Breaker, and more planned |

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Game Logic:** C++ compiled to WebAssembly using Emscripten
- **Rendering:** HTML5 Canvas
- **Optional Backend (future):** Node.js, Firebase, or Supabase

---

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/Zyrex24/symbol-arcade.git
cd symbol-arcade
````

### 2. Install dependencies

```bash
npm install
```

### 3. Compile C++ to WebAssembly

Make sure you have [Emscripten](https://emscripten.org/docs/getting_started/downloads.html) installed.

Example command:

```bash
emcc games/snake.cpp -s WASM=1 -o public/games/snake.js
```

Repeat for other games.

### 4. Run the dev server

```bash
npm run dev
```

Visit `http://localhost:5173` (or whatever Vite shows) to see your game hub in action.

---

## Future Ideas

* 🔐 Player login + score saving
* 🏆 Leaderboards and achievements
* 🌐 Multiplayer via WebRTC
* 🌙 Dark mode UI
* 🧩 Game builder (user-contributed WASM games)

---

## Contributing

Contributions are welcome! If you’d like to add a new game, improve UI/UX, or optimize performance, feel free to fork and PR.

---

## License

MIT © \[Ahmed Niazi & Omar Tarek]

---

## Acknowledgements

* [Emscripten](https://emscripten.org/)
* [React](https://reactjs.org/)
* [Hugging Face WebAssembly models](https://huggingface.co/)
