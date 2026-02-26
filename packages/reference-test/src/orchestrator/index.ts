/**
 * Orchestrator - test execution entry point.
 */

export {
  createProjectAndRunner,
  generateAllSandboxProjects,
  getMatrixEntries,
  runMatrixTests,
} from './orchestrator.js'
export { registerRunner, cleanupAll } from './test-context.js'
export * from './matrix/index.js'
