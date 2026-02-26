/**
 * Bootstrap: generate .sandbox from base environment, return it. Tests use this to get a project to run against.
 */

import { generateSandbox } from './generator/index.js'

export type EnvConfig = { bundler?: 'vite'; react?: '18' }

export async function bootstrap(_config?: EnvConfig) {
  return generateSandbox()
}
