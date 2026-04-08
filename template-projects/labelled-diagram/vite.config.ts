import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    viteSingleFile(),
  ],

  // 🔥 FIX WARNING + CHUẨN BUILDER
  build: {
    // thay thế inlineDynamicImports
    cssCodeSplit: false,

    rollupOptions: {
      output: {
        manualChunks: undefined, // 🔥 tránh split file
      },
    },
  },
});