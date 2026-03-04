import { css } from '@reference-ui/react'

/**
 * Slice for testing ref sync --watch: user updates css() style, expect it to appear.
 * The sync-watch spec edits this file to change the color.
 */
export default function SyncWatch() {
  return (
    <div
      data-testid="sync-watch"
      className={css({
        color: '#059669',
        padding: 'test-md',
        borderRadius: 'test-round',
      })}
    >
      SyncWatch: ref sync --watch
    </div>
  )
}
