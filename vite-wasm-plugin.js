import { spawn } from "child_process";
import {
  watch,
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "fs";
import path from "path";

export function wasmBuilderPlugin() {
  let isBuilding = false;
  const gameListFile = path.resolve("cpp/.games-list.json");

  // Get current list of C++ files
  const getCurrentGames = () => {
    try {
      return readdirSync("cpp")
        .filter((file) => file.endsWith(".cpp"))
        .sort();
    } catch {
      return [];
    }
  };

  // Load previous games list
  const loadPreviousGames = () => {
    try {
      if (existsSync(gameListFile)) {
        return JSON.parse(readFileSync(gameListFile, "utf8"));
      }
    } catch {
      // File doesn't exist or is corrupted
    }
    return [];
  };

  // Save current games list
  const saveGamesList = (games) => {
    try {
      writeFileSync(gameListFile, JSON.stringify(games, null, 2));
    } catch (err) {
      console.warn("Failed to save games list:", err.message);
    }
  };

  // Check if build is needed
  const isBuildNeeded = () => {
    const currentGames = getCurrentGames();
    const previousGames = loadPreviousGames();

    // Build needed if games list changed or WASM files don't exist
    const gamesChanged =
      JSON.stringify(currentGames) !== JSON.stringify(previousGames);
    const wasmMissing = !currentGames.every((game) => {
      const gameName = path.basename(game, ".cpp");
      return existsSync(path.resolve("public/wasm", `${gameName}.wasm`));
    });

    if (gamesChanged) {
      console.log("🎮 Games list changed:", {
        added: currentGames.filter((g) => !previousGames.includes(g)),
        removed: previousGames.filter((g) => !currentGames.includes(g)),
      });
    }

    return gamesChanged || wasmMissing;
  };

  const buildWasm = (force = false) => {
    if (isBuilding) return;

    if (!force && !isBuildNeeded()) {
      console.log("⏭️ WASM build skipped (no changes detected)");
      return;
    }

    isBuilding = true;
    console.log("🔧 Building WASM modules...");

    const child = spawn("bash", ["make.sh"], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    child.on("close", (code) => {
      isBuilding = false;
      if (code === 0) {
        console.log("✅ WASM modules built successfully!");
        // Save current games list after successful build
        saveGamesList(getCurrentGames());
      } else {
        console.error("❌ WASM build failed with code:", code);
      }
    });
  };

  return {
    name: "wasm-builder",
    buildStart() {
      // Smart build check on startup
      buildWasm();
    },
    configureServer(server) {
      // Watch C++ files for changes
      const cppDir = path.resolve("cpp");

      try {
        watch(cppDir, { recursive: true }, (eventType, filename) => {
          if (filename && filename.endsWith(".cpp")) {
            console.log(`🔄 C++ file changed: ${filename}`);
            buildWasm(true); // Force build on file changes

            // Trigger HMR update for WASM files
            setTimeout(() => {
              server.ws.send({
                type: "full-reload",
              });
            }, 2000); // Wait for build to complete
          }
        });

        console.log("👀 Watching C++ files for changes...");
      } catch (error) {
        console.warn("⚠️  Could not watch C++ directory:", error.message);
      }
    },
  };
}
