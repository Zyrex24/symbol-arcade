import { useEffect, useRef, useState } from "react";

interface WasmModule {
  _malloc?: (size: number) => number;
  _free?: (ptr: number) => void;
  HEAPU8?: Uint8Array;
  // Guess The Number functions
  _start_game?: (maxNumber: number) => void;
  _make_guess?: (guess: number) => number;
  _get_attempts?: () => number;
  // Tic Tac Toe functions
  _ttt_start_game?: () => void;
  _ttt_get_current_player?: () => number;
  _ttt_make_move?: (index: number) => number;
  _ttt_next_player?: () => void;
  _ttt_get_board?: () => number;
  _ttt_check_winner?: () => number;
  _ttt_reset?: () => void;
}

export function useWasmLoader(moduleName: string) {
  const wasmRef = useRef<WasmModule | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        // Remove any existing script
        const existingScript = document.querySelector(
          `script[src="/wasm/${moduleName}.js"]`
        );
        if (existingScript) {
          existingScript.remove();
        }

        // Create and load new script
        const script = document.createElement("script");
        script.src = `/wasm/${moduleName}.js?v=${new Date().getTime()}`;
        script.async = true;

        script.onload = async () => {
          try {
            // Wait a bit for the Module to be available
            await new Promise((resolve) => setTimeout(resolve, 200));

            // TypeScript assertion for the Module function
            const moduleLoader = (window as any).Module;
            if (moduleLoader) {
              const mod = await moduleLoader();
              console.log(`[WASM LOADER] Loaded module for ${moduleName}:`, mod);
              wasmRef.current = mod;
              // Log available keys for debugging
              if (mod) {
                console.log(`[WASM LOADER] Exported keys for ${moduleName}:`, Object.keys(mod));
              }
              setIsLoaded(true);
            } else {
              console.error(`[WASM LOADER] Module not found for ${moduleName}`);
              setError(`Module not found for ${moduleName}`);
            }
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[WASM LOADER] Failed to initialize ${moduleName}:`, message);
            setError(`Failed to initialize ${moduleName}: ${message}`);
          }
        };

        script.onerror = () => {
          console.error(`[WASM LOADER] Failed to load ${moduleName}.js`);
          setError(`Failed to load ${moduleName}.js`);
        };

        document.body.appendChild(script);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[WASM LOADER] Error loading WASM module:`, message);
        setError(`Error loading WASM module: ${message}`);
      }
    };

    loadWasm();

    return () => {
      // Cleanup function
      const scriptToRemove = document.querySelector(
        `script[src="/wasm/${moduleName}.js"]`
      );
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [moduleName]);

  return { wasmRef, isLoaded, error };
}
