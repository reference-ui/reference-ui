import { cpSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { microBundle } from '../../../../lib/microbundle'

export const PANDA_EXTENSIONS_DIRNAME = 'extensions'
export const PANDA_EXTENSIONS_FILENAME = 'index.mjs'

export function getPandaExtensionsDir(styledDir: string): string {
  return join(styledDir, PANDA_EXTENSIONS_DIRNAME)
}

export function getPandaExtensionsBundlePath(styledDir: string): string {
  return join(getPandaExtensionsDir(styledDir), PANDA_EXTENSIONS_FILENAME)
}

export async function writePandaExtensionsBundle(
  cliDir: string,
  styledDir: string
): Promise<string> {
  const entryPath = join(cliDir, 'src/system/panda/config/extensions/runtime.ts')
  const outputPath = getPandaExtensionsBundlePath(styledDir)

  mkdirSync(getPandaExtensionsDir(styledDir), { recursive: true })
  const bundled = await microBundle(entryPath)
  writeFileSync(outputPath, bundled, 'utf-8')

  return outputPath
}

export function mirrorPandaExtensionsBundle(
  cliStyledDir: string,
  outDir: string
): string {
  const sourceDir = getPandaExtensionsDir(cliStyledDir)
  const targetDir = join(outDir, 'styled', PANDA_EXTENSIONS_DIRNAME)

  mkdirSync(join(outDir, 'styled'), { recursive: true })
  cpSync(sourceDir, targetDir, { recursive: true })

  return join(targetDir, PANDA_EXTENSIONS_FILENAME)
}
