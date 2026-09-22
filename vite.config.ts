/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from https://divyagopalnadar.github.io/cerop-console/ (GitHub Pages project site).
// Views are hash-routed, so deep links work without server rewrites.
export default defineConfig({
  base: '/cerop-console/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
