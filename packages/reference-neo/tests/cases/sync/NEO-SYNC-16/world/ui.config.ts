// Config for the NEO-SYNC-16 world. It takes the backchannel fixture and emits
// an opt-in compile: name plus include scope plus logs ['compiler'], so the
// engine returns compilerDiagnostics and sync prints the [neo] compiler call.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-sync16',
  include: ['theme/**/*.{ts,tsx}'],
  logs: ['compiler'],
})
