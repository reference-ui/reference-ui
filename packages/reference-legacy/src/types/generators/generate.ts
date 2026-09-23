/**
 * Type-graph generator orchestrator.
 *
 * Composes the focused generators (`./fonts`, `./strict`) so the packager has
 * one entrypoint per generated package. Public types live in `src/types/public`
 * and are owned exclusively by authored modules; this directory is generation
 * infrastructure only.
 */
import { existsSync } from 'node:fs'
import {
  refreshGeneratedTypesArtefact,
  writeFontRegistryIntoTypes,
} from './fonts'
import { getPublicSiblingDeclarationPath } from './shared'
import { writeStrictSystemStyleObject } from './strict'

export {
  buildFontTypeRegistry,
  readGeneratedFontRegistry,
  renderFontRegistryInterface,
  renderGeneratedFontRegistryFile,
  writeGeneratedSystemFontTypes,
  type FontTypeRegistry,
} from './fonts'
export { renderSystemStyleObjectDts, writeStrictSystemStyleObject } from './strict'

async function writeGeneratedPackageTypes(
  cwd: string,
  typesPath: string
): Promise<void> {
  if (!existsSync(typesPath)) {
    return
  }

  writeStrictSystemStyleObject(typesPath)

  const registry = refreshGeneratedTypesArtefact(cwd, typesPath)

  const splitFontRegistryPath = getPublicSiblingDeclarationPath(typesPath, 'fontRegistry')
  const splitFontsPath = getPublicSiblingDeclarationPath(typesPath, 'fonts')

  if (splitFontRegistryPath && splitFontsPath) {
    writeFontRegistryIntoTypes(splitFontRegistryPath, registry)
    writeFontRegistryIntoTypes(splitFontsPath, registry)
    return
  }

  writeFontRegistryIntoTypes(typesPath, registry)
}

export async function writeGeneratedSystemTypes(cwd: string, systemTypesPath: string): Promise<void> {
  await writeGeneratedPackageTypes(cwd, systemTypesPath)
}

export async function writeGeneratedReactTypes(cwd: string, reactTypesPath: string): Promise<void> {
  await writeGeneratedPackageTypes(cwd, reactTypesPath)
}
