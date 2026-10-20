import type { ReactNode } from 'react'
import { Button, Div, Span, css } from '@reference-ui/react'

/**
 * Before-and-after specimens for the Customization page: the library's stock
 * buttons on the left, the customised ones on the right. The global CSS demo
 * applies its rule as style props, because a real `.ref-button` rule would
 * restyle every button on the docs site.
 */
const split = css({
  display: 'grid',
  gridTemplateColumns: '1fr',
  width: '100%',
  r: { 480: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } },
})

const side = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4r',
  paddingBlock: '4r',
})

const divider = css({
  borderTopWidth: '1px',
  borderTopStyle: 'solid',
  borderTopColor: 'docsBorder',
  r: {
    480: {
      borderTopWidth: '0',
      borderLeftWidth: '1px',
      borderLeftStyle: 'solid',
      borderLeftColor: 'docsBorder',
    },
  },
})

const buttons = css({ display: 'flex', alignItems: 'center', gap: '2r', minHeight: '10r' })

const label = css({ fontSize: '3r', color: 'design.text.lighter' })

function Side({ label: text, last, children }: { label: string; last?: boolean; children: ReactNode }) {
  return (
    <Div className={last ? `${side} ${divider}` : side}>
      <Div className={buttons}>{children}</Div>
      <Span className={label}>{text}</Span>
    </Div>
  )
}

export function StylePropsDemo() {
  return (
    <Div className={split}>
      <Side label="Default">
        <Button type="button" variant="primary">
          Save changes
        </Button>
      </Side>
      <Side label="With style props" last>
        <Button
          type="button"
          variant="primary"
          bg="blue.600"
          color="white"
          borderRadius="full"
          paddingInline="5r"
        >
          Save changes
        </Button>
      </Side>
    </Div>
  )
}

export function GlobalCssDemo() {
  return (
    <Div className={split}>
      <Side label="Default">
        <Button type="button">Cancel</Button>
        <Button type="button" variant="primary">
          Save
        </Button>
      </Side>
      <Side label="With the .ref-button rule" last>
        <Button
          type="button"
          borderRadius="0"
          fontSize="3r"
          textTransform="uppercase"
          letterSpacing="0.08em"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          borderRadius="0"
          fontSize="3r"
          textTransform="uppercase"
          letterSpacing="0.08em"
        >
          Save
        </Button>
      </Side>
    </Div>
  )
}
