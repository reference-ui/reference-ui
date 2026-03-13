import { resolve } from 'node:path'
import { getShortName as getShortNameFromName } from './package/name'

export { getShortName } from './package/name'

/** Package output directory under outDir (e.g. outDir + 'react'). */
export function getPackageDir(outDir: string, pkgName: string): string {
  return resolve(outDir, getShortNameFromName(pkgName))
}

/** Main entry basename from package manifest (e.g. 'react.mjs'). */
export function getEntryBasename(pkg: { main?: string }): string {
  return pkg.main?.replace('./', '') || 'index.js'
}

/** Declaration filename for a runtime outFile (e.g. 'react.mjs' → 'react.d.mts'). */
export function getDeclarationBasename(outFile: string): string {
  return outFile.replace(/\.m?js$/, '.d.mts')
}

/** Full path to the runtime entry file for a package (e.g. outDir/react/react.mjs). */
export function getRuntimeEntryPath(outDir: string, pkgName: string, outFile: string): string {
  return resolve(getPackageDir(outDir, pkgName), outFile)
}
