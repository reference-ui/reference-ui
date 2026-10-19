// Live useMeasure demo for the useMeasure docs page.
// It takes nothing and emits the measured-box readout. Colocated with the page that embeds it.
import { Div, Span, Textarea } from '@reference-ui/react'
import { useMeasure } from '@reference-ui/lib'
import { demoNote, demoStack } from './demo-surface'

/** Reports the settled size of a resizable textarea. */
export function UseMeasureDemo() {
  const { ref, rect, isSettled } = useMeasure<HTMLTextAreaElement>()
  const size = rect ? `${Math.round(rect.width)} × ${Math.round(rect.height)}px` : 'Not measured'
  return (
    <Div className={demoStack}>
      <Textarea ref={ref} aria-label="Resize me" placeholder="Drag the corner to resize" />
      <Span className={demoNote}>
        {size} {isSettled ? '(settled)' : '(measuring)'}
      </Span>
    </Div>
  )
}
