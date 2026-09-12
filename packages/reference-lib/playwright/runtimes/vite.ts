import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeConfig, searchForWorkspaceRoot, type Alias, type UserConfig } from 'vite'
import { resolveMajor, type Major } from './index'
import { runtime as react17 } from './react-17/vite'
import { runtime as react18 } from './react-18/vite'
import { runtime as react19 } from './react-19/vite'

const libDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

export type Runtime = {
  dir: string
  host: string
  cacheDir: string
  aliases: Alias[]
}

const runtimes: Record<Major, () => Runtime> = {
  '17': react17,
  '18': react18,
  '19': react19,
}

function stripReactDedupe(config: UserConfig) {
  const resolveOptions = config.resolve ?? {}
  resolveOptions.dedupe = (resolveOptions.dedupe ?? []).filter(
    (id: string) => id !== 'react' && id !== 'react-dom',
  )
  config.resolve = resolveOptions
}

function galleryOverlay(runtime: Runtime): UserConfig {
  return {
    root: libDir,
    cacheDir: runtime.cacheDir,
    server: {
      port: 3101,
      strictPort: true,
      host: true,
      fs: {
        allow: [searchForWorkspaceRoot(libDir), runtime.dir],
      },
    },
    resolve: {
      alias: [{ find: /^ct-host$/, replacement: runtime.host }, ...runtime.aliases],
    },
    optimizeDeps: {
      entries: ['playwright/index.html'],
      include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
    },
  }
}

/** Merge a base Vite config with the selected `@ct-runtime/react-*` runtime. */
export function withCtRuntime(base: UserConfig) {
  const runtime = runtimes[resolveMajor()]()
  const config = mergeConfig(base, galleryOverlay(runtime))
  stripReactDedupe(config)
  return config
}
