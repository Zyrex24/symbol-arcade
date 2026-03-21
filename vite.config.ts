import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
// @ts-expect-error - wasmBuilderPlugin has no types
import { wasmBuilderPlugin } from "./vite-wasm-plugin.js";

// https://vite.dev/config/
export default defineConfig({
  base: "/symbol-arcade/",
  plugins: [
    react(),
    wasmBuilderPlugin(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "WASM Arcade",
        short_name: "WASM Arcade",
        description: "High-performance mini games arcade powered by WebAssembly and C++",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        icons: [
          {
            src: "favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          }
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,wasm}"],
      },
    }),
  ],
  server: {
    watch: {
      ignored: ["**/wasm_build/**", "**/public/wasm/**"], // Don't watch build outputs
    },
  },
});
