// Config for the NEO-SYNC-16 world. It takes the backchannel fixture and emits
// an opt-in compile: name plus include scope plus logs ['compiler'], so the
// engine returns compilerDiagnostics and sync counts them in the warning
// summary, listing them behind the compiler tag under --verbose.
import { defineConfig } from '@reference-ui/neo'

export default defineConfig({
  name: 'neo-sync16',
  include: ['theme/**/*.{ts,tsx}'],
  logs: ['compiler'],
})
