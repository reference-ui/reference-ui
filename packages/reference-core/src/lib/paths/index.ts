// Barrel for the core-owned path helpers.
// It takes nothing and re-exports config discovery plus out-dir and tmp paths.
// No virtual dir, no global registry: discovery plus paths, nothing else.

export { resolveRefConfigFile } from './ref-config.ts'
export { getOutDirPath } from './out-dir.ts'
export { getStageDirPath } from './stage-dir.ts'
export { getOutDirTmpPath, getProjectTmpDirPath } from './tmp-dir.ts'
