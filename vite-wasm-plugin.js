import { spawn } from "child_process";
import { watch } from "fs";
import path from "path";

export function wasmBuilderPlugin() {
  let isBuilding = false;

  const buildWasm = () => {
    if (isBuilding) return;
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
      } else {
        console.error("❌ WASM build failed with code:", code);
      }
    });
  };

  return {
    name: "wasm-builder",
    buildStart() {
      // Build WASM on startup
      buildWasm();
    },
    configureServer(server) {
      // Watch C++ files for changes
      const cppDir = path.resolve("cpp");

      try {
        watch(cppDir, { recursive: true }, (eventType, filename) => {
          if (filename && filename.endsWith(".cpp")) {
            console.log(`🔄 C++ file changed: ${filename}`);
            buildWasm();

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
