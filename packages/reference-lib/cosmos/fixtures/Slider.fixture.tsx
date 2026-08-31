import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Slider } from '../../src/index'

export default {
  SingleThumb: () => {
    const [val, setVal] = React.useState(35)
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Slider value={val} onChange={setVal} min={0} max={100} step={1}>
          <Slider.Track>
            <Slider.Range />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
        <Span fontSize="3r" color="design.text.light">Current Value: {val}</Span>
      </Div>
    )
  },
  RangeThumbs: () => {
    const [val, setVal] = React.useState<number | number[]>([20, 80])
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="3r">
        <Slider value={val} onChange={setVal} min={0} max={100} step={5}>
          <Slider.Track>
            <Slider.Range />
            <Slider.Thumb index={0} />
            <Slider.Thumb index={1} />
          </Slider.Track>
        </Slider>
        <Span fontSize="3r" color="design.text.light">
          Selected Range: {Array.isArray(val) ? `${val[0]} - ${val[1]}` : val}
        </Span>
      </Div>
    )
  },
  Vertical: () => {
    const [val, setVal] = React.useState(50)
    return (
      <Div height="50r" display="flex" alignItems="center" gap="4r">
        <Slider value={val} onChange={setVal} orientation="vertical" min={0} max={100}>
          <Slider.Track>
            <Slider.Range />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
        <Span fontSize="3r" color="design.text.light">Height: {val}%</Span>
      </Div>
    )
  },
}
