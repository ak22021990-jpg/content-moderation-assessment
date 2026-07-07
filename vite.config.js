import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/content-moderation-assessment/',
  build: {
    target: 'es2022',
    sourcemap: false,
  },
})
