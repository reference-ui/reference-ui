import { defineConfig } from '@content-collections/core'
import { docsCollection } from './docs'

export { docsCollection } from './docs'

export default defineConfig({
  content: [docsCollection],
})