/**
 * Export barrel for the committed sync-root test fixture.
 * Re-exports both valid style-bearing wrappers and non-style components for assertion coverage.
 * Emits the public component surface consumed by the test suites.
 */
export { DirectWrapper } from './DirectWrapper'
export { ReexportedWrapper } from './ReexportedWrapper'
export { StrippedWrapper } from './StrippedWrapper'
export { UnrelatedComponent } from './UnrelatedComponent'
