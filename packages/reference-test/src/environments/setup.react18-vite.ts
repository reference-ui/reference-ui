import { bootstrap } from './bootstrap.js'
import { MATRIX } from './matrix.js'

declare global {
  var __REF_TEST_PROJECT__: Awaited<ReturnType<typeof bootstrap>> | undefined
}

const config = MATRIX.find((e) => e.name === 'react18-vite')!
const project = await bootstrap(config)
globalThis.__REF_TEST_PROJECT__ = project
