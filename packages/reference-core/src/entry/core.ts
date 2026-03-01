// Configuration API (for ui.config.ts files) — uses types so bundling ui.config doesn't pull in load-config
export { defineConfig } from '../cli/config/types.js'
export type { ReferenceUIConfig } from '../cli/config/types.js'
