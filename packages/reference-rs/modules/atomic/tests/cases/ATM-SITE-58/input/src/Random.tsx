/**
 * Antihost for ATM-SITE-58 (NEO-SITE-12 shape): a bare div with no style
 * props at its boundary, so discovery never traces it.
 */
export function Random({ label }: { label?: string }) {
  return <div data-label={label}>hi</div>
}
