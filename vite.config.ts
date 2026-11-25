import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost",
    port: 5174,
    allowedHosts: [
      "guptamanvi.c.googlers.com",
      ".proxy.googlers.com",
      "localhost",
      "127.0.0.1",
    ],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8788",
        changeOrigin: false,
      },
    },
  },
});
