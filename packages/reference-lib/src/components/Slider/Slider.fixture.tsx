import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { Slider } from './index'

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
      <Div height="50r" display="flex" alignItems="center" gap="4r" p="4r">
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
  NativeParity: () => {
    const [sliderVal, setSliderVal] = React.useState(40)
    const [nativeVal, setNativeVal] = React.useState(40)
    return (
      <Div maxW="80r" display="flex" flexDirection="column" gap="5r" p="4r">
        <Div display="flex" flexDirection="column" gap="2r">
          <Span fontSize="2.5r" color="design.text.light">
            Library Slider Component ({sliderVal}%)
          </Span>
          <Slider value={sliderVal} onChange={setSliderVal} min={0} max={100}>
            <Slider.Track>
              <Slider.Range />
              <Slider.Thumb />
            </Slider.Track>
          </Slider>
        </Div>
        <Div display="flex" flexDirection="column" gap="2r">
          <Span fontSize="2.5r" color="design.text.light">
            Native CSS Range Input ({nativeVal}%)
          </Span>
          <input
            type="range"
            className="ref-input"
            value={nativeVal}
            onChange={(e) => setNativeVal(Number(e.target.value))}
            min={0}
            max={100}
            style={{ '--range-percent': `${nativeVal}%` } as React.CSSProperties}
          />
        </Div>
      </Div>
    )
  },
}
