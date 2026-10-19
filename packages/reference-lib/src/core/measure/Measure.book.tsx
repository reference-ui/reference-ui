// Book stories for useMeasure: settled box and resize observation specimens.
// They take nothing and emit interactive stories rendering the hook's rect and
// isSettled state for visual inspection.
import * as React from 'react'
import { Button, Code, Div, Span } from '@reference-ui/react'
import { useMeasure } from './use-measure'

export default {
  SettledBox: () => {
    const { ref, rect, isSettled } = useMeasure<HTMLDivElement>()
    const [wide, setWide] = React.useState(false)
    return (
      <Div display="flex" flexDirection="column" gap="3r" maxW="80r">
        <Div
          ref={ref}
          w={wide ? '64r' : '32r'}
          h="16r"
          bg="design.bg.muted"
          borderRadius="md"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Span fontSize="3r">drag-free box</Span>
        </Div>
        <Button type="button" onClick={() => setWide(value => !value)}>
          Toggle width
        </Button>
        <Code fontSize="3r">
          {isSettled && rect
            ? `${Math.round(rect.width)}×${Math.round(rect.height)} settled`
            : 'measuring…'}
        </Code>
      </Div>
    )
  },
}
