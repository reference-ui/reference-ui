// Barrel for the Neo-owned path helpers.
// It takes nothing and re-exports config discovery plus out-dir and tmp paths.
// The virtual dir and the global registry deliberately do not come across.

export { resolveRefConfigFile } from './ref-config.ts'
export { getOutDirPath } from './out-dir.ts'
export { getOutDirTmpPath, getProjectTmpDirPath } from './tmp-dir.ts'
