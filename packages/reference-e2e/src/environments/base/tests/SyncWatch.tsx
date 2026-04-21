import { css } from '@reference-ui/react'

/**
 * Slice for testing ref sync --watch: user updates css() style, expect it to appear.
 * The sync-watch spec edits this file to change the background from blue to red.
 */
export default function SyncWatch() {
  return (
    <div
      data-testid="sync-watch"
      className={css({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '14rem',
        minHeight: '6rem',
        color: '#ffffff' as never,
        backgroundColor: '#2563eb' as never,
        padding: 'test-md',
        borderRadius: 'test-round',
      })}
    >
      SyncWatch: ref sync --watch
    </div>
  )
}
