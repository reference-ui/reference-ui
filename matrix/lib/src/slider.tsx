import * as React from 'react'
import { Slider } from '@reference-ui/lib'

export function SliderFixture() {
  const [value, setValue] = React.useState(30)
  const [rangeValue, setRangeValue] = React.useState<number | number[]>([20, 80])

  return (
    <div data-testid="slider-fixture-root">
      <h1>Slider Fixture</h1>

      <div style={{ width: 300, margin: '24px 0' }}>
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

        <p data-testid="slider-value-display">Current value: {value}</p>
      </div>

      <div style={{ width: 300, margin: '24px 0' }}>
        <h2>Range Slider</h2>
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
        <p data-testid="range-value-display">
          Range: {Array.isArray(rangeValue) ? `${rangeValue[0]} - ${rangeValue[1]}` : rangeValue}
        </p>
      </div>
    </div>
  )
}
