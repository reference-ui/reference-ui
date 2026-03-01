import { css } from '@reference-ui/react'

/**
 * Uses refLibCanary from @reference-ui/lib baseSystem.
 * Only works when ui.config has extends: [baseSystem] from @reference-ui/lib.
 */
export default function ExtendsTest() {
  return (
    <div
      data-testid="extends-test"
      className={css({ color: 'refLibCanary' })}
    >
      ExtendsTest: refLibCanary
    </div>
  )
}
