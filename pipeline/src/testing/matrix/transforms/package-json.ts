/**
 * Matrix consumer package.json generation.
 *
 * The matrix runner synthesizes a minimal downstream consumer inside Dagger so
 * it can install from the staged Verdaccio registry instead of the workspace.
 * This file owns the generated package manifest for that synthetic consumer.
 */

interface MatrixConsumerPackageJsonOptions {
  coreVersion: string
  libVersion: string
}

export function createMatrixConsumerPackageJson(
  options: MatrixConsumerPackageJsonOptions,
): string {
  return `${JSON.stringify(
    {
      name: 'reference-ui-matrix-install-test',
      private: true,
      type: 'module',
      scripts: {
        sync: 'ref sync',
      },
      dependencies: {
        '@reference-ui/core': options.coreVersion,
        '@reference-ui/lib': options.libVersion,
        react: '^19.2.0',
        'react-dom': '^19.2.0',
      },
      devDependencies: {
        '@types/react': '^19.2.2',
        '@types/react-dom': '^19.2.2',
        typescript: '~5.9.3',
      },
    },
    null,
    2,
  )}\n`
}