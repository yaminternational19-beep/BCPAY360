import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
     // 👈 ADD THIS

  server: {
    proxy: {
      "/api": "http://localhost:5000/api/employee",
    },
  },

  plugins: [react()],
})