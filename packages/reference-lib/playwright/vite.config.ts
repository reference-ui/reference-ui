import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeConfig } from 'vite'
import bookConfig from '../book/vite.config'

const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export default mergeConfig(bookConfig, {
  root: pkgDir,
  server: {
    port: 3101,
    strictPort: true,
    host: true,
  },
})
