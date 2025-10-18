# Pacman – Patch Notes (2025-10-18)

Summary of changes:

- UI/UX

  - Removed difficulty selector and debug toggle.
  - No auto-start; start/restart via overlay click or key press; Start/Restart button removed.
  - Replaced inline grid style with CSS class `pacman-board-cols-28`.

- Logic

  - Smooth turning: buffered desired direction; applied as soon as movement allows to avoid missing corners.
  - Ghost pen release: staged release schedule (timed) before they start roaming.
  - Added win detection when all pellets/power pellets are consumed.
  - Frightened timer increased to 80; ghost eaten returns to pen.
  - Random map generation improved with connectivity check; fallback to seed map if invalid.
  - Ghost movement keeps BFS chase/scatter heuristic with small variations; safer fallbacks.

- Build
  - Rebuilt Pacman via single-module script.
