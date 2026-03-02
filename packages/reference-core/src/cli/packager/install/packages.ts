import { resolve, dirname } from 'node:path'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import type { PackageDefinition } from '../package'
import { installPackage } from './package'
import { ENABLE_REFERENCE_UI_SYMLINKS } from './package'
import type { ReferenceUIConfig } from '../../config'

const STYLES_SRC = 'src/system/styles.css'

/** Append config.layers[].css to base styles content. */
function appendLayerCss(content: string, config?: ReferenceUIConfig): string {
  const layers = config?.layers ?? []
  if (layers.length === 0) return content
  const layerCss = layers.filter(s => s?.css).map(s => s!.css!).join('\n\n')
  if (!layerCss) return content
  return content + '\n\n' + layerCss
}

/**
 * Copy styles.css from core to the React package install location.
 * Appends config.layers[].css for layer consumers.
 * Hot path: called on panda:css:compiled for fast pixels.
 */
export function copyStylesToReactPackage(
  coreDir: string,
  userProjectDir: string,
  config?: ReferenceUIConfig
): boolean {
  const srcPath = resolve(coreDir, STYLES_SRC)
  if (!existsSync(srcPath)) return false

  const refUiDir = resolve(userProjectDir, '.reference-ui')
  const refUiScopeDir = resolve(userProjectDir, 'node_modules', '@reference-ui')
  const targetDir = ENABLE_REFERENCE_UI_SYMLINKS
    ? resolve(refUiDir, 'react')
    : resolve(refUiScopeDir, 'react')
  const destPath = resolve(targetDir, 'styles.css')

  const baseContent = readFileSync(srcPath, 'utf-8')
  const content = appendLayerCss(baseContent, config)
  mkdirSync(dirname(destPath), { recursive: true })

  try {
    const existing = readFileSync(destPath, 'utf-8')
    if (existing === content) return false
  } catch {
    /* dest doesn't exist */
  }

  writeFileSync(destPath, content, 'utf-8')
  return true
}

/**
 * Install packages to node_modules. When ENABLE_REFERENCE_UI_SYMLINKS is true:
 * output to .reference-ui/ and symlink into node_modules (for Vite HMR). When false: output
 * directly to node_modules.
 */
export async function installPackages(
  coreDir: string,
  userProjectDir: string,
  packages: PackageDefinition[]
): Promise<void> {
  const refUiDir = resolve(userProjectDir, '.reference-ui')
  const refUiScopeDir = resolve(userProjectDir, 'node_modules', '@reference-ui')
  mkdirSync(refUiScopeDir, { recursive: true })

  for (const pkg of packages) {
    await installPackage(coreDir, refUiDir, refUiScopeDir, pkg)
  }
}
