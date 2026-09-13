import * as React from 'react'
import { Div, Span } from '@reference-ui/react'
import { ReferenceLibrary } from '../ReferenceLibrary'
import { Slider } from './index'

export const SingleSliderFixture = () => {
  const [value, setValue] = React.useState(30)

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="slider-fixture-root">
        <Div style={{ width: 300, margin: '24px 0' }}>
          <Slider
            data-testid="test-slider"
            value={value}
            onChange={setValue}
            min={0}
            max={100}
            step={5}
          >
            <Slider.Track data-testid="slider-track">
              <Slider.Range data-testid="slider-range" />
              <Slider.Thumb data-testid="slider-thumb" />
            </Slider.Track>
          </Slider>

          <Span fontSize="3r" color="design.text.light" data-testid="slider-value-display">
            Current value: {value}
          </Span>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}

export const RangeSliderFixture = () => {
  const [rangeValue, setRangeValue] = React.useState<number | number[]>([20, 80])

  return (
    <ReferenceLibrary>
      <Div p="4r" maxW="80r" data-testid="range-slider-root">
        <Div style={{ width: 300, margin: '24px 0' }}>
          <Slider
            data-testid="range-slider"
            value={rangeValue}
            onChange={setRangeValue}
            min={0}
            max={100}
            step={5}
          >
            <Slider.Track data-testid="range-track">
              <Slider.Range data-testid="range-range" />
              <Slider.Thumb index={0} data-testid="range-thumb-0" />
              <Slider.Thumb index={1} data-testid="range-thumb-1" />
            </Slider.Track>
          </Slider>
          <Span fontSize="3r" color="design.text.light" data-testid="range-value-display">
            Range: {Array.isArray(rangeValue) ? `${rangeValue[0]} - ${rangeValue[1]}` : rangeValue}
          </Span>
        </Div>
      </Div>
    </ReferenceLibrary>
  )
}
