/**
 * Bootstrap: create project, return it. Tests use this to get a project to run against.
 */

import { createProject } from '../lib/project.js'

export type EnvConfig = { bundler?: 'vite'; react?: '18' }

export async function bootstrap(_config?: EnvConfig) {
  return createProject()
}
