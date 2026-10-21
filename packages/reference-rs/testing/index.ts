/**
 * Public entrypoint for the Reference RS testing library.
 * Exports case suite runner, golden diffing facilities, virtual workspace
 * helpers, and standard test contracts used across compiler harnesses.
 * Also exports runIsolated, expectBounded and withTempDir, which run one export in a child
 * process so a crash or a hang becomes a reported outcome, and keep the temporary directories
 * such a child needs under the parent's control.
 * Provides unified testing primitives without external test framework sprawl.
 */
export * from './types.js'
export * from './runner.js'
export * from './goldens.js'
export * from './workspace.js'
export * from './normalizers.js'
export * from './css.js'
export * from './isolated.js'
