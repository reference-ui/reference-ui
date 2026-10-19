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

/** A two-thumb price range that keeps the thumbs at least five steps apart. */
export function SliderRangeDemo() {
  const [price, setPrice] = useState([20, 80])
  return (
    <Div className={demoStack}>
      <Slider value={price} onChange={setPrice} minStepsBetweenThumbs={5}>
        <Slider.Track>
          <Slider.Range />
          <Slider.Thumb aria-label="Minimum price" />
          <Slider.Thumb aria-label="Maximum price" />
        </Slider.Track>
      </Slider>
      <Span className={demoNote}>
        Price: {price[0]} to {price[1]}
      </Span>
    </Div>
  )
}

/** A vertical slider; the root fills its container's height, so the container has one. */
export function SliderVerticalDemo() {
  const [level, setLevel] = useState(60)
  return (
    <Div height="40r">
      <Slider value={level} onChange={setLevel} orientation="vertical">
        <Slider.Track>
          <Slider.Range />
          <Slider.Thumb aria-label="Level" />
        </Slider.Track>
      </Slider>
    </Div>
  )
}
