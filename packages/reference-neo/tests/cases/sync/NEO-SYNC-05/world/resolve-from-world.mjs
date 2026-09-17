// Resolver probe for the consumer-specifier case. Takes a bare specifier and
// returns its resolved URL from this world's node_modules scope, so the spec
// exercises the same ESM resolution a real consumer import would. Node's
// import.meta.resolve anchors at the importing module, which is why the probe
// lives in the world instead of the spec.
export function resolve(specifier) {
  return import.meta.resolve(specifier)
}
