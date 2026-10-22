/**
 * Config for the committed styletrace sync-root fixture. Its `name` is what lets a real `ref sync`
 * accept this directory, and `include` names the sources under `src/` that the tracer reads.
 * fixtures/README.md explains how to regenerate the committed `.reference-ui` stand-in from it.
 */
export default {
  name: 'fixture-sync-root',
  include: ['src/**/*.{ts,tsx}'],
}
