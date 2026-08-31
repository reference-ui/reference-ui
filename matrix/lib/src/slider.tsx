import * as React from 'react'
import { Slider } from '@reference-ui/lib'

export function SliderFixture() {
  const [value, setValue] = React.useState(30)

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
    </div>
  )
}
