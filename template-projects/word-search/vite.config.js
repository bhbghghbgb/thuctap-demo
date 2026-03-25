import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      output: {
        format: 'iife',
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/index.js',
        assetFileNames: 'assets/[name].[ext]'
      }
    }
  }
});
