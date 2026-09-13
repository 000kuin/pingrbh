import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Router — separate so it doesn't block render
          "vendor-router": ["wouter"],
          // Charts — largest dep, only downloaded when a chart tab first opens
          "vendor-charts": ["recharts"],
        },
      },
    },
    // Raise the warning limit; individual chunks will be well below this
    chunkSizeWarningLimit: 600,
  },
});
