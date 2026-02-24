/**
 * TypeScript configuration for declaration generation
 */

export interface TsConfigOptions {
  rootDir: string
  outDir: string
  entryFiles: string[]
}

/**
 * Create optimized tsconfig for .d.ts generation.
 * Configured for speed and reliability.
 */
export function createTsConfig(options: TsConfigOptions) {
  return {
    compilerOptions: {
      // Declaration generation
      declaration: true,
      emitDeclarationOnly: true,
      declarationMap: false,

      // Output configuration
      outDir: options.outDir,
      rootDir: options.rootDir,

      // Module resolution
      moduleResolution: 'bundler',
      module: 'ESNext',
      target: 'ESNext',

      // JSX support
      jsx: 'react-jsx',
      jsxImportSource: 'react',

      // Performance optimizations
      skipLibCheck: true,
      noEmitOnError: false,

      // Type quality
      strict: true,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
    },
    include: options.entryFiles,
    exclude: ['node_modules', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
  }
}
