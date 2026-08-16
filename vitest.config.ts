import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/renderer/src/**/*.test.{ts,tsx}', 'src/shared/**/*.test.ts', 'src/main/**/*.test.ts', 'src/preload/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts']
  }
})
