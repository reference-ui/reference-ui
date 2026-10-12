/**
 * Caret restore for segment stepping: restoreCaretAt synchronously returns
 * the caret to the stepped segment. Strictly synchronous — the caller invokes
 * it after the committed input value is in the DOM, so no frame or timer
 * deferral is needed. Total — a null target or a throwing selection context
 * is a silent no-op.
 */
export function restoreCaretAt(
  target: { setSelectionRange: (start: number, end: number) => void } | null,
  pos: number
): void {
  try {
    target?.setSelectionRange(pos, pos)
  } catch {
    // Non-text selection contexts (tests) ignore caret restore.
  }
}
