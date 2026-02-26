/**
 * Project generation types and interfaces.
 * Config-driven types for generating test environments.
 */

/** Environment combination for matrix testing */
export interface MatrixEnvironment {
  reactVersion: '18' | '19'
  bundler: 'vite' | 'webpack' | 'rollup'
  bundlerVersion: string
}

/** Configuration for project generation */
export interface ProjectConfig {
  environment: MatrixEnvironment
  /** Test fixture variant: tokens, fonts, keyframes, comprehensive */
  testConfigVariant?: 'minimal' | 'tokens' | 'fonts' | 'keyframes' | 'comprehensive'
}

/** Result of project generation */
export interface ProjectHandle {
  rootPath: string
  cleanup: () => Promise<void>
}
