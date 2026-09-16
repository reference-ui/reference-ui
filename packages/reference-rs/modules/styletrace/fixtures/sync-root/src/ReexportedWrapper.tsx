/**
 * Re-exported wrapper component verifying that style forwarding is preserved across module re-exports.
 * Re-exports DirectWrapper to ensure consumer boundaries trace through re-export edges.
 * Emits the re-exported identifier as a traced style-bearing component.
 */
export { DirectWrapper as ReexportedWrapper } from './DirectWrapper'
