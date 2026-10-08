/**
 * Second antihost for ATM-SITE-56: no style props at the boundary and no
 * primitive import, so discovery never traces it.
 */
export function Label({ text }: { text: string }) {
  return <span>{text}</span>
}
