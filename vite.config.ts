import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["firebase", "@firebase/app", "@firebase/firestore", "@firebase/component", "@firebase/util"],
  },
  server: {
    port: 5173,
  },
});
