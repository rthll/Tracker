import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3333",
        changeOrigin: true
      }
    }
  }
});
