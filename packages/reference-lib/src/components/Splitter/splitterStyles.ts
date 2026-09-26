// Reduced-motion guard for Splitter Handle chrome (PATCHES item 6).
// Mirrors the Toast convention: a <style> tag rendered by the Root, with
// `transition: none !important` so the guard wins over the inline 150ms
// Handle transitions only when the user prefers reduced motion.
export const SPLITTER_STYLES = `
@media (prefers-reduced-motion: reduce) {
  [data-reference-splitter-handle-line],
  [data-reference-splitter-thumb],
  [data-reference-splitter-thumb-dot] {
    transition: none !important;
  }
}
`
