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
  // Snake functions
  _snake_start_game?: () => void;
  _snake_set_direction?: (direction: number) => void;
  _snake_tick?: () => number;
  _snake_update?: () => number;
  _snake_get_width?: () => number;
  _snake_get_height?: () => number;
  _snake_get_cell?: (index: number) => number;
  _snake_get_score?: () => number;
  _snake_is_game_over?: () => number;

  // Rock Paper Scissors functions
  _rps_start_game?: () => void;
  _rps_reset_stats?: () => void;
  _rps_make_choice?: (choice: number) => number;
  _rps_new_round?: () => void;
  _rps_get_player_choice?: () => number;
  _rps_get_computer_choice?: () => number;
  _rps_get_result?: () => number;
  _rps_is_game_ready?: () => number;
  _rps_show_result?: () => number;
  _rps_get_player_wins?: () => number;
  _rps_get_computer_wins?: () => number;
  _rps_get_ties?: () => number;
  _rps_get_total_games?: () => number;
  _rps_get_win_rate?: () => number;

  // Pacman functions
  _pacman_start_game?: () => void;
  _pacman_set_direction?: (direction: number) => void;
  _pacman_tick?: () => number;
  _pacman_update?: () => number;
  _pacman_get_width?: () => number;
  _pacman_get_height?: () => number;
  _pacman_get_cell?: (index: number) => number;
  _pacman_get_score?: () => number;
  _pacman_is_game_over?: () => number;
}

export function useWasmLoader(moduleName: string) {
  const wasmRef = useRef<WasmModule | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guard to avoid duplicate loads/instantiation in React StrictMode
  const loadedRef = useRef(false);

  useEffect(() => {
    const loadWasm = async () => {
      try {
        // Simple cache of instantiated modules keyed by moduleName
        const g = window as any;
        g.__wasmModules = g.__wasmModules || {};
        if (g.__wasmModules[moduleName]) {
          wasmRef.current = g.__wasmModules[moduleName] as WasmModule;
          setIsLoaded(true);
          return;
        }

        if (loadedRef.current) {
          // Already loading/loaded in this component lifecycle
          return;
        }
        loadedRef.current = true;

        // Remove any existing script tag with the same src
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
            // Wait a bit for the Module factory to be available
            await new Promise((resolve) => setTimeout(resolve, 100));

            const moduleLoader = (window as any).Module;
            if (moduleLoader) {
              // If someone else already instantiated while we were loading, reuse it
              if (g.__wasmModules[moduleName]) {
                wasmRef.current = g.__wasmModules[moduleName] as WasmModule;
                setIsLoaded(true);
                return;
              }

              const mod = await moduleLoader();
              console.log(
                `[WASM LOADER] Loaded module for ${moduleName}:`,
                mod
              );
              wasmRef.current = mod;
              // Cache for reuse across mounts/renders
              g.__wasmModules[moduleName] = mod;
              if (mod) {
                console.log(
                  `[WASM LOADER] Exported keys for ${moduleName}:`,
                  Object.keys(mod)
                );
              }
              setIsLoaded(true);
            } else {
              console.error(`[WASM LOADER] Module not found for ${moduleName}`);
              setError(`Module not found for ${moduleName}`);
            }
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(
              `[WASM LOADER] Failed to initialize ${moduleName}:`,
              message
            );
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
      // Do not delete the cached module. Only remove the script tag.
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
