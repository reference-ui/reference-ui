/**
 * Create a project for testing. Delegates to the sandbox generator.
 */

import { generateSandbox } from '../environments/generator/index.js'

export interface Project {
  root: string
  cleanup: () => Promise<void>
}

export async function createProject(): Promise<Project> {
  return generateSandbox()
}
