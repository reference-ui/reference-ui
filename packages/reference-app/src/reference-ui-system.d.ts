/**
 * Declares @reference-ui/system so app code can import fragment APIs.
 * The actual implementation is provided by the CLI at build time (ref sync).
 */
declare module '@reference-ui/system' {
  export function tokens(config: Record<string, unknown>): void
  export function keyframes(config: Record<string, unknown>): void
  export function utilities(config: Record<string, unknown>): void
  export function globalCss(config: Record<string, unknown>): void
  export function staticCss(config: Record<string, unknown>): void
  export function globalFontface(config: Record<string, unknown>): void
}
