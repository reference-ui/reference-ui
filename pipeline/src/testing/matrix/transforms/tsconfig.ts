/**
 * Matrix consumer tsconfig generation.
 *
 * The synthetic matrix consumer only needs enough TypeScript configuration to
 * exercise `ref sync` against a realistic downstream app shape. Keeping the
 * generated `tsconfig.json` here makes that contract explicit next to the other
 * generated consumer files.
 */

export function createMatrixConsumerTsconfig(): string {
  return `${JSON.stringify(
    {
      compilerOptions: {
        jsx: 'react-jsx',
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        module: 'esnext',
        moduleResolution: 'bundler',
        types: [],
        target: 'es2022',
        strict: true,
        skipLibCheck: true,
      },
      include: ['src/**/*', 'tests/**/*', 'ui.config.ts'],
    },
    null,
    2,
  )}\n`
}