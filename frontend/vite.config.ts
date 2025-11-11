import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // 0.0.0.0 dentro del contenedor
    port: 5174,       // nuevo puerto
    strictPort: true, // si está ocupado, falla en lugar de moverse
  },
  preview: {
    port: 4174,
    strictPort: true,
  },
});
