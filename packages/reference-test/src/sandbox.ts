/**
 * Sandbox generation entry point.
 * Run: pnpm run sandbox
 * Delegates to orchestrator.generateAllSandboxProjects().
 */

import { generateAllSandboxProjects } from './orchestrator/index.js'

generateAllSandboxProjects().then(() => {
  // orchestrator logs "sandbox ready"
})
