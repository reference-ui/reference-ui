import { css } from '@reference-ui/react'

/**
 * Slice for testing token fragment reload: the token-sync-watch spec writes a
 * token file that defines `watch-sync.primary`, waits for ref sync to
 * regenerate the Panda config and CSS, then asserts the computed color changed.
 */
export default function TokenSyncWatch() {
  return (
    <div
      data-testid="token-sync-watch"
      className={css({
        color: 'watch-sync.primary',
      })}
    >
      TokenSyncWatch: token fragment reload
    </div>
  )
}
