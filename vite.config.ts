import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { vitePages } from "@kingironman2011/vite-pages";

export default defineConfig({
  base: "/",
  plugins: [react(), vitePages()],
  define: {
    "process.env": {},
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    host: true,
    port: 5173,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
      clientPort: 5173,
    },
    watch: {
      usePolling: true,
    },
  },
  build: {
    target: "esnext",
    cssCodeSplit: true,
    minify: "esbuild",
    sourcemap: true,
    chunkSizeWarningLimit: 400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom")) {
              return "react";
            }
            if (id.includes("lucide-react") || id.includes("react-icons")) {
              return "icons";
            }
            if (id.includes("framer-motion")) {
              return "animations";
            }
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
  },
});
