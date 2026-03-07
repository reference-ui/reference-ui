/**
 * Declares @reference-ui/system so app code can import the fragment API.
 * The actual implementation is provided by the CLI at build time (ref sync).
 */
declare module '@reference-ui/system' {
  export function tokens(config: Record<string, unknown>): void
}
