import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Split heavy third-party libraries into their own cacheable chunks so
    // a change to app code doesn't force mobile users to redownload vendor JS.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react")) return "vendor-react";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("firebase")) return "vendor-firebase";
          return "vendor";
        },
      },
    },
    // Smaller, more efficient output for slower mobile connections.
    cssMinify: true,
    reportCompressedSize: false,
  },
})
