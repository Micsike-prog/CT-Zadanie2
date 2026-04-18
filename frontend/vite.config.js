import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Presmeruje /detect, /history atď. na FastAPI backend
      "/detect":    { target: "http://localhost:8000", changeOrigin: true },
      "/history":   { target: "http://localhost:8000", changeOrigin: true },
      "/detections":{ target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
