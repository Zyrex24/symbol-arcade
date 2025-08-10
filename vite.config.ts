import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
// @ts-ignore
import { wasmBuilderPlugin } from './vite-wasm-plugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wasmBuilderPlugin()],
  server: {
    watch: {
      ignored: ['**/wasm_build/**', '**/public/wasm/**'] // Don't watch build outputs
    }
  }
})
