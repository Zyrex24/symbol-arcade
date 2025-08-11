import { mkdirSync, readdirSync, copyFileSync, existsSync } from "fs";
import { basename, resolve, join } from "path";
import { spawn } from "child_process";

const CPP_DIR = resolve("cpp");
const BUILD_DIR = resolve("wasm_build");
const PUBLIC_DIR = resolve("public/wasm");

function ensureDirs() {
  mkdirSync(BUILD_DIR, { recursive: true });
  mkdirSync(PUBLIC_DIR, { recursive: true });
}

function resolveEmcc() {
  // Prefer PATH
  const isWin = process.platform === 'win32';
  // Common local emsdk path at repo root
  const repoRoot = resolve('.');
  const localEmsdk = resolve(repoRoot, 'emsdk');
  const envEmsdk = process.env.EMSDK;
  const candidates = [];
  if (envEmsdk) {
    candidates.push(join(envEmsdk, 'upstream', 'emscripten', isWin ? 'emcc.bat' : 'emcc'));
  }
  if (existsSync(localEmsdk)) {
    candidates.push(join(localEmsdk, 'upstream', 'emscripten', isWin ? 'emcc.bat' : 'emcc'));
  }
  // If none found, fall back to relying on PATH
  candidates.push('emcc');
  for (const p of candidates) {
    if (p === 'emcc') return p;
    if (existsSync(p)) return p;
  }
  return 'emcc';
}

function runEmcc(args) {
  const emccPath = resolveEmcc();
  const isWin = process.platform === 'win32';
  return new Promise((resolvePromise, reject) => {
    if (isWin) {
      // Use shell to run .bat reliably on Windows
      const cmd = [emccPath, ...args.map((a) => (a.includes(' ') ? `"${a}"` : a))].join(' ');
      const child = spawn(cmd, { stdio: 'inherit', shell: true });
      child.on('close', (code) => {
        if (code === 0) resolvePromise();
        else reject(new Error(`emcc failed with code ${code}`));
      });
    } else {
      const child = spawn(emccPath, args, { stdio: 'inherit' });
      child.on('close', (code) => {
        if (code === 0) resolvePromise();
        else reject(new Error(`emcc failed with code ${code}`));
      });
    }
  });
}

async function buildOne(src) {
  const base = basename(src, ".cpp");
  console.log(`Building ${base}...`);
  const out = resolve(BUILD_DIR, `${base}.js`);
  let exportedFunctions = [];

  if (base === "GuessTheNumber") {
    exportedFunctions = [
      "_start_game",
      "_make_guess",
      "_get_attempts",
    ];
  } else if (base === "TicTacToe") {
    exportedFunctions = [
      "_malloc",
      "_free",
      "_ttt_start_game",
      "_ttt_get_current_player",
      "_ttt_make_move",
      "_ttt_next_player",
      "_ttt_get_board",
      "_ttt_get_cell",
      "_ttt_check_winner",
    ];
  } else if (base === "Snake") {
    exportedFunctions = [
      "_snake_start_game",
      "_snake_reset",
      "_snake_set_direction",
      "_snake_tick",
      "_snake_is_game_over",
      "_snake_get_score",
      "_snake_get_width",
      "_snake_get_height",
      "_snake_get_board",
      "_snake_get_cell",
    ];
  } else if (base === "Pacman") {
    exportedFunctions = [
      "_pacman_start_game",
      "_pacman_set_direction",
      "_pacman_tick",
      "_pacman_update",
      "_pacman_is_game_over",
      "_pacman_get_score",
      "_pacman_get_width",
      "_pacman_get_height",
      "_pacman_get_cell",
    ];
  } else if (base === "FlappyBird") {
    exportedFunctions = [
      "_flappy_start_game",
      "_flappy_flap",
      "_flappy_tick",
      "_flappy_update",
      "_flappy_is_game_over",
      "_flappy_get_score",
      "_flappy_get_width",
      "_flappy_get_height",
      "_flappy_get_cell",
    ];
  } else {
    console.log(`Skipping unknown C++ source ${base}.cpp`);
    return;
  }

  const args = [
    src,
    "-O3",
    "--no-entry",
    "-s",
    "WASM=1",
    "-s",
    "MODULARIZE=1",
    "-s",
    "EXPORT_NAME=Module",
    "-s",
    `EXPORTED_FUNCTIONS=[${exportedFunctions.map((s) => `'${s}'`).join(",")}]`,
    "-s",
    "EXPORTED_RUNTIME_METHODS=['cwrap','ccall']",
    "-o",
    out,
  ];

  await runEmcc(args);

  copyFileSync(out, resolve(PUBLIC_DIR, `${base}.js`));
  copyFileSync(resolve(BUILD_DIR, `${base}.wasm`), resolve(PUBLIC_DIR, `${base}.wasm`));
}

async function main() {
  ensureDirs();
  const sources = readdirSync(CPP_DIR)
    .filter((f) => f.endsWith(".cpp"))
    .map((f) => resolve(CPP_DIR, f));

  for (const src of sources) {
    await buildOne(src);
  }
  console.log(`Build complete. WASM modules are in ${BUILD_DIR}/ and copied to ${PUBLIC_DIR}/`);
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});


