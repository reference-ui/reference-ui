// Dead-file template for bench repos.
// It takes a file index and emits one style-free module.
// Sync still globs and parses these, so they load the walk without loading the compiler.

export function deadFile(index: number): string {
  return [
    `export const FACTOR_${index} = ${(index * 31 + 7) % 1000}`,
    '',
    `export function combine${index}(left: number, right: number): number {`,
    `  return (left + right) * FACTOR_${index}`,
    '}',
    '',
  ].join('\n')
}
