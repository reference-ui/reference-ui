/**
 * Generate tsconfig.json for TypeScript declaration generation
 */

export interface TsConfigOptions {
  rootDir: string
  outDir: string
  entryFiles: string[]
}

/**
 * Create a tsconfig specifically for declaration generation.
 * This config is optimized for generating .d.ts files from TypeScript source.
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

      // Skip checking node_modules types (faster)
      skipLibCheck: true,

      // Don't fail the build on type errors - still generate declarations
      noEmitOnError: false,

      // Strict mode for better type generation
      strict: true,

      // Allow synthetic default imports
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,

      // Ensure consistent casing
      forceConsistentCasingInFileNames: true,

      // Resolve JSON modules
      resolveJsonModule: true,
    },
    include: options.entryFiles,
    exclude: ['node_modules', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'],
  }
}
