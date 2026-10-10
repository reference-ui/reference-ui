/**
 * Splitter's owned stylesheet: a reduced-motion guard that silences the
 * 150ms Handle transitions, plus the invisible hit-area strip that extends
 * the 9px visible Handle to a 25px pointer target without repainting it.
 * The root renders it in a <style> tag, following the Toast convention.
 * Trade-off: clicks within 8px of the Handle land on the separator
 * instead of neighboring content.
 */
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
