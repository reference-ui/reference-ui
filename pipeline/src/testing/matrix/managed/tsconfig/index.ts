/**
 * Managed tsconfig generation for matrix consumers.
 *
 * The synthetic matrix consumer only needs enough TypeScript configuration to
 * exercise `ref sync` and compile the selected fixture as a downstream app.
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
      include: ['src/**/*', 'tests/**/*', 'unit/**/*', 'component/**/*', 'ui.config.ts'],
    },
    null,
    2,
  )}\n`
}
