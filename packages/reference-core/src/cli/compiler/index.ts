import { compile } from './compile.js'
import type { BuildResult, GenerateDesignSystemConfig } from './types.js'

export function generateDesignSystem(config: GenerateDesignSystemConfig = {}): BuildResult {
  return compile(config)
}

export type { BuildResult, GenerateDesignSystemConfig } from './types.js'
