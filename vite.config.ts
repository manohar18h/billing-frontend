import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; //allows Vite to compile React (JSX/TSX).
import path from "path"; // Allows using @/* to refer to src/*

export default defineConfig({
  plugins: [react()],
  server: {
    host: "192.168.29.180", // or your local IP like '192.168.1.100'
    port: 3005, // set fixed port
    strictPort: true, // if true, will fail if port is already used
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // ✅ this makes @ point to /src
    },
  },
});
