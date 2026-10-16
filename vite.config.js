import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" lets the app work from any folder or host (Netlify, GitHub Pages, Capacitor)
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    target: "es2019",
    cssMinify: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: { output: { manualChunks: { react: ["react", "react-dom"] } } },
  },
});
