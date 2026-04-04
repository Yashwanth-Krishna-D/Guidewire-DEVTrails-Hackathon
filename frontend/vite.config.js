import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ["india-state-district"],
  },
  server: {
    host: true,      // bind to 0.0.0.0 — accessible from any port / LAN device
    port: 5173,      // default port (Vite will auto-pick next free port if taken)
    strictPort: false,
  },
})
