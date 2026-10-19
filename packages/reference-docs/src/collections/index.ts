// Content-collections config wiring.
// It takes the docs collection and emits the defineConfig the CLI and Vite plugin load
// through the content-collections.ts entrypoint.
import { defineConfig } from '@content-collections/core'
import { docsCollection } from './docs'

export { docsCollection } from './docs'

export default defineConfig({
  content: [docsCollection],
})