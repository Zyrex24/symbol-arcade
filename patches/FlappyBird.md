# Flappy Bird – Patch Notes (2025-10-18)

Summary of changes in this patch:

- UI/UX

  - Removed difficulty buttons; Normal is the implicit default.
  - Click-to-start overlay; click to flap during play; click anywhere to restart on Game Over.

- Physics/Gameplay

  - Switched to float-based motion (birdYf/birdVyf) for smoother animation.
  - Flap impulse reduced to -2.7 (was -3.6) for less jumpiness.
  - Gravity reduced to +0.22 per tick; velocity caps set to +3.5 (down) / -4.0 (up).
  - Position integration factor 0.30 for smoother movement.
  - First tap now starts the game and applies a flap impulse.
  - No loss when above the top of the screen; ground still causes loss.
  - Pipe movement adjusted to move every 3rd tick.

- Rendering & Styles

  - Replaced inline grid style with CSS class `flappy-board-cols-28` to satisfy lint rules.

- Build/Tooling

  - Added single-module WASM build support: `node scripts/build-wasm.mjs FlappyBird`.
  - NPM convenience: `npm run wasm:build:flappy`.
  - Kept `_flappy_set_difficulty` exported for parity (unused by UI).

- Files Touched

  - `src/components/FlappyBirdGame.tsx`: UI changes, click handling, class usage.
  - `cpp/FlappyBird.cpp`: physics tuning, above-top behavior, initial flap.
  - `src/styles/Games.css`: added `flappy-board-cols-28`.
  - `scripts/build-wasm.mjs`, `package.json`: single-game build support.

- Verification
  - Rebuilt Flappy only; TypeScript build ok.
