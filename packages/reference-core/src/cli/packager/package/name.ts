/** Extract short name from scoped package (e.g. '@reference-ui/react' → 'react') */
export function getShortName(pkgName: string): string {
  const scope = pkgName.indexOf('/')
  return scope >= 0 ? pkgName.slice(scope + 1) : pkgName
}
