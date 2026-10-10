/**
 * Toast identity minting: collision-proof string IDs for caller-omitted
 * identities. Timestamp plus base36 entropy keeps concurrently shown
 * toasts distinct; the state store treats the result as an opaque key.
 */
export function generateToastId() {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
