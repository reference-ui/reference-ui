import { useState } from 'react'
import { Div, Span } from '@reference-ui/react'
import { Slider } from '@reference-ui/lib'
import { demoNote, demoStack } from './demo-surface'

/** A single-thumb volume slider with its value read back below. */
export function SliderDemo() {
  const [volume, setVolume] = useState(35)
  return (
    <Div className={demoStack}>
      <Slider value={volume} onChange={setVolume}>
        <Slider.Track>
          <Slider.Range />
          <Slider.Thumb aria-label="Volume" />
        </Slider.Track>
      </Slider>
      <Span className={demoNote}>Volume: {volume}</Span>
    </Div>
  )
}
