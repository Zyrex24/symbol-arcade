# Snake – Patch Notes (2025-10-18)

Summary of changes:

- UI/UX

  - Removed difficulty selector, debug toggle, and Tick.
  - No auto-start; click or press any movement key to start/restart.
  - Overlays for start and game over; cleaner HUD.
  - Replaced inline grid style with CSS class `snake-board-cols-20`.

- Logic

  - Input queue (size 8) buffers rapid consecutive direction inputs.
  - Applies at most one queued direction per move; prevents direct reversals.

- Build
  - Added `npm run wasm:build:snake` for single-module rebuild.
