import { defineConfig } from '@pandacss/dev'

export default defineConfig({
  include: ['./src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['./tests/**/*.{ts,tsx,js,jsx}'],
  outdir: 'styled-system',
  hash: false,
  preflight: false,
})