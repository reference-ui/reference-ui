// ui.config.ts — the NEO-WATCH-01 world config. It takes no inputs beyond the
// file itself and emits the system the watch loop syncs against: name
// neo-watch over the src tree. Sources live under src/ so the harness build
// feeds the page's dist entry from the same files the watcher tracks.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-watch',
  include: ['src/**/*.{ts,tsx}'],
})
