import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; //allows Vite to compile React (JSX/TSX).
import path from "path"; // Allows using @/* to refer to src/*

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // ✅ this makes @ point to /src
    },
  },
});
