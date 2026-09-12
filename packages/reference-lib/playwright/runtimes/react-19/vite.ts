import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = dirname(fileURLToPath(import.meta.url))
const libDir = resolve(dir, '../../..')

function pkgDir(specifier: string) {
  const require = createRequire(join(dir, 'package.json'))
  try {
    return dirname(require.resolve(`${specifier}/package.json`))
  } catch {
    throw new Error(
      `CT React ${specifier} is not installed in ${dir}. Run pnpm install from the repo root.`,
    )
  }
}

export function runtime() {
  const reactDir = pkgDir('react')
  const reactDomDir = pkgDir('react-dom')
  return {
    dir,
    host: join(dir, 'host.ts'),
    cacheDir: resolve(libDir, 'node_modules/.vite-ct-react19'),
    aliases: [
      { find: /^react$/, replacement: reactDir },
      { find: /^react\/jsx-runtime$/, replacement: join(reactDir, 'jsx-runtime.js') },
      { find: /^react\/jsx-dev-runtime$/, replacement: join(reactDir, 'jsx-dev-runtime.js') },
      { find: /^react-dom$/, replacement: reactDomDir },
      { find: /^react-dom\/client$/, replacement: join(reactDomDir, 'client.js') },
    ],
  }
}
