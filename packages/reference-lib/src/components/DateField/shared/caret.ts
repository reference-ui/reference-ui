/**
 * Caret restore for segment stepping: restoreCaretAt returns the caret
 * to the stepped segment on the next frame so repeated steps stay in
 * place. Total — a null target or a throwing selection context is a
 * silent no-op.
 */
export function restoreCaretAt(
  target: { setSelectionRange: (start: number, end: number) => void } | null,
  pos: number
): void {
  const restore = () => {
    try {
      target?.setSelectionRange(pos, pos)
    } catch {
      // Non-text selection contexts (tests) ignore caret restore.
    }
  }
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(restore)
  } else {
    restore()
  }
}
