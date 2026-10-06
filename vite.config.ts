import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  // Das QA-Inspektions-Plugin ist nur lokal nötig und nicht öffentlich
  // installierbar – im CI-Build (GitHub Pages) weglassen.
  plugins: [process.env.CI ? null : inspectAttr(), react()].filter(Boolean) as ReturnType<typeof react>[],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
