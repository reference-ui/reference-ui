import { cpSync, mkdirSync, existsSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

function getSystemPackageJson(): string {
  return JSON.stringify(
    {
      name: '@reference-ui/system',
      version: '0.0.0-generated',
      description: 'Reference design system (generated)',
      type: 'module',
      main: './css/index.js',
      types: './css/index.d.ts',
      exports: {
        '.': {
          types: './css/index.d.ts',
          default: './css/index.js',
        },
        './css': {
          types: './css/index.d.ts',
          default: './css/index.js',
        },
        './styles.css': './styles.css'
      },
    },
    null,
    2
  )
}

function getWebPackageJson(): string {
  return JSON.stringify(
    {
      name: '@reference-ui/web',
      version: '0.0.0-generated',
      description: 'Reference web components',
      type: 'module',
      main: './index.cjs',
      module: './index.mjs',
      types: './index.d.mts',
      exports: {
        '.': {
          import: { types: './index.d.mts', default: './index.mjs' },
          require: { types: './index.d.cts', default: './index.cjs' },
        },
        './styles.css': './styles.css',
      },
    },
    null,
    2
  )
}

/** Copy core outputs to node_modules/@reference-ui/{system,web} */
export function copyToNodeModules(packageRoot: string, coreDir: string): void {
  const distDir = resolve(coreDir, 'dist/entry')
  const systemSourceDir = resolve(coreDir, 'src/system')
  const stylesSourcePath = resolve(coreDir, 'src/system/styles.css')

  if (!existsSync(distDir)) {
    throw new Error(
      `@reference-ui/core: dist/entry not found. Build reference-core first.`
    )
  }

  mkdirSync(resolve(packageRoot, 'node_modules/@reference-ui'), { recursive: true })
  const systemTarget = resolve(packageRoot, 'node_modules/@reference-ui/system')
  cpSync(systemSourceDir, systemTarget, { recursive: true })
  writeFileSync(resolve(systemTarget, 'package.json'), getSystemPackageJson(), 'utf-8')
  if (existsSync(stylesSourcePath)) {
    cpSync(stylesSourcePath, resolve(systemTarget, 'styles.css'))
  }

  const webTarget = resolve(packageRoot, 'node_modules/@reference-ui/web')
  cpSync(distDir, webTarget, { recursive: true })
  writeFileSync(resolve(webTarget, 'package.json'), getWebPackageJson(), 'utf-8')
  if (existsSync(stylesSourcePath)) {
    cpSync(stylesSourcePath, resolve(webTarget, 'styles.css'))
  }
}
