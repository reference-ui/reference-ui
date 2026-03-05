/**
 * Declares @reference-ui/system so app code can import tokens() for fragment files.
 * The actual implementation is provided by the CLI at build time (ref sync).
 */
declare module '@reference-ui/system' {
  /**
   * Register design tokens with Panda CSS (build-time fragment).
   * e.g. tokens({ colors: { primary: { value: '#0066cc' } } })
   */
  export function tokens(config: Record<string, unknown>): void
}
