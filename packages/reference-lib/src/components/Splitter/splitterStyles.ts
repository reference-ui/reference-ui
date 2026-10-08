// Reduced-motion guard for Splitter Handle chrome (PATCHES item 6).
// Mirrors the Toast convention: a <style> tag rendered by the Root, with
// `transition: none !important` so the guard wins over the inline 150ms
// Handle transitions only when the user prefers reduced motion.
//
// FEATURES #11 (invisible hit area): the visible Handle stays 9px, but a
// transparent ::before strip extends the pointer target 8px into each
// neighbor (25px total, clearing the 24px minimum). Absolute, transparent,
// and transition-free: zero paint/layout change, so visual baselines hold.
// TRADE-OFF (shipped on maintainer recommendation without explicit HQ
// acceptance): clicks within 8px of the Handle land on the separator
// instead of neighboring content.
export const SPLITTER_STYLES = `
@media (prefers-reduced-motion: reduce) {
  [data-reference-splitter-handle-line],
  [data-reference-splitter-thumb],
  [data-reference-splitter-thumb-dot] {
    transition: none !important;
  }
}
[data-reference-splitter-handle]::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: -8px;
  right: -8px;
  background: transparent;
}
[data-reference-splitter][data-orientation="vertical"] [data-reference-splitter-handle]::before {
  top: -8px;
  bottom: -8px;
  left: 0;
  right: 0;
}
`
