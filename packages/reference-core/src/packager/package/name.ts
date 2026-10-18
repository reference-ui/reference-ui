// Package-name helpers for Neo generated packages.
// They take a scoped package name and emit the short dir name the folder layout uses.
// Scopes never reach the filesystem: outDir holds react, styled, system, types, never the full ids.

/** Extract short name from scoped package (e.g. '@reference-ui/react' → 'react') */
export function getShortName(pkgName: string): string {
  const scope = pkgName.indexOf('/')
  return scope >= 0 ? pkgName.slice(scope + 1) : pkgName
}
