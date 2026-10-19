import * as React from 'react'
import { CheckIcon, Field } from '@reference-ui/lib'
import { ContentCopyIcon } from '@reference-ui/icons'
import { CheckBadge } from '@fixtures/aliased-host-library'
import { matrixChainT17Marker } from './probe'

export { matrixChainT17Marker }

/**
 * T17 render entry — consumer style props on prebuilt components.
 *
 * Every case below styles a PREBUILT (external) component with a consumer
 * style prop. The consumer sheet emits and backs `<system>__<stem>` for each
 * system the package renders through. Positive controls (`className` /
 * `style` / native props) stay alive on both sides.
 */
export function Index(): React.ReactElement {
  return (
    <main data-testid="chain-t17-root">
      <h1>Reference UI chain T17 matrix</h1>
      <p>
        Style prebuilt components with consumer style props. Each named prop
        must paint on the component&apos;s outermost element with zero runtime
        misses, and the backing rule must be foreign-qualified in the loaded
        sheet.
      </p>

      {/* 1. prebuilt icon via direct import, consumer token color */}
      <ContentCopyIcon data-testid="t17-direct-icon" color="t17ProbeInk" />

      {/* 2. prebuilt icon via lib re-export, consumer token color */}
      <CheckIcon data-testid="t17-lib-icon" color="t17ProbeInk" />

      {/* 3. prebuilt root styled by the consumer (spacing token) */}
      <Field data-testid="t17-field" padding="t17ProbeGap">
        <span>field</span>
      </Field>

      {/* 4. override: consumer value beats the package default (tone="inherit") */}
      <CheckBadge data-testid="t17-override-badge" color="t17ProbeInk" />

      {/* 5. value-kind split: a raw CSS value also paints from the consumer */}
      <ContentCopyIcon data-testid="t17-raw-icon" color="#b70233" />

      {/* 6. positive controls: className / style / native props through prebuilt parts */}
      <ContentCopyIcon
        data-testid="t17-controls-icon"
        className="t17-control-class"
        style={{ color: 'rgb(0, 128, 0)' }}
        role="img"
        aria-label="t17 controls"
      />

      {/* 7. css prop + condition arm through an external component */}
      <ContentCopyIcon data-testid="t17-css-icon" css={{ color: '#00b7ab' }} />
      <ContentCopyIcon data-testid="t17-hover-icon" _hover={{ color: '#00b7ab' }} />

      {/* 8. consumer tone through a prebuilt icon: `color` is a line-role prop */}
      <CheckIcon data-testid="t17-tone-icon" color="t17ProbeInk/t17ProbeTone" />
    </main>
  )
}
