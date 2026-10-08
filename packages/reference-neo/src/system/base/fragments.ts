// Portable fragment bundle assembly for the published base system.
// It takes upstream bundles plus local bundles and emits one concatenated
// fragment string. The narrowed inputs keep base clear of collect's prepared
// shape: callers project the two lists at the call.

export function createPortableFragmentBundle(
  upstream: string[],
  local: string[]
): string {
  return [...upstream, ...local]
    .map(bundle => `;${bundle}`)
    .join('\n')
}
