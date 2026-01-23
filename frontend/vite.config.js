import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  server: {
    allowedHosts: [
      '3d4a80a85c02.ngrok-free.app'
    ],
    proxy: {
          
      "/api": {
        // target: "http://localhost:5000",   // your Flask backend
        target: "http://192.168.1.11:5000",   // your Flask backend
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      }
    }
  }
})
