// Library components carousel demo: a working carousel built from primitives and CSS.
// It takes nothing and emits a card-sized, centred figure of plain gray slides, with back and
// next buttons over the slide's edges, clickable position dots and a muted caption under it.
// The track is a scroll-snap row; the buttons and dots only scroll it, showing that a carousel
// needs no component of its own. Colocated with the page that embeds it.
import { useEffect, useRef, useState } from 'react'
import { Button, Code, Div, Figcaption, Figure, css } from '@reference-ui/react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LightbulbIcon,
  MusicNoteIcon,
  PaletteIcon,
  RocketIcon,
} from '@reference-ui/lib'

const SLIDES = 4

/* A card-sized widget centred in the column, the proportions of a reference carousel. */
const frame = css({
  width: '100%',
  maxWidth: '112r',
  marginX: 'auto',
  marginY: '10r',
})

const viewport = css({ position: 'relative' })

const track = css({
  display: 'flex',
  overflowX: 'auto',
  scrollSnapType: 'x mandatory',
  scrollBehavior: 'smooth',
  scrollbarWidth: 'none',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'diagramBorder',
  borderRadius: 'diagramPanel',
  _focusVisible: { outline: '2px solid', outlineColor: 'diagramArrow', outlineOffset: '2px' },
})

const slide = css({
  flex: '0 0 100%',
  scrollSnapAlign: 'start',
  aspectRatio: '16 / 9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
})

/* One large, quiet icon per slide: present, but a step above the slide's own gray. */
const slideIcon = css({ color: 'gray.400', _dark: { color: 'gray.700' } })
const icons = [RocketIcon, PaletteIcon, LightbulbIcon, MusicNoteIcon]

/* Slides alternate a deep and a slightly lighter gray, so each move reads without any text.
 * Dark sits near the canvas, so the track's hairline border carries the edge. */
const deep = css({ bg: 'gray.300', _dark: { bg: 'gray.950' } })
const light = css({ bg: 'gray.200', _dark: { bg: 'gray.900' } })
const shades = [deep, light, deep, light]

const navButton = css({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '9r',
  height: '9r',
  padding: '0',
  borderRadius: 'full',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'diagramBorder',
  bg: 'diagramPanel',
  color: 'docsText',
  boxShadow: '0 1px 2px rgb(0 0 0 / 0.12)',
  cursor: 'pointer',
  _hover: { bg: 'diagramChip' },
  _dark: { bg: 'gray.800', borderColor: 'gray.700', _hover: { bg: 'gray.700' } },
  _disabled: { opacity: '0.4', pointerEvents: 'none' },
})

const prevButton = css({ left: '3r' })
const nextButton = css({ right: '3r' })

const dots = css({
  display: 'flex',
  justifyContent: 'center',
  gap: '2r',
  marginTop: '4r',
})

/* Dot shape shared by both states; the state classes carry the colour alone, so they
 * never stack two `_dark` rules on one element. Active is the pill: dark in light, light in dark. */
const dot = css({
  width: '2r',
  height: '2r',
  padding: '0',
  borderWidth: '0',
  borderRadius: 'full',
  cursor: 'pointer',
  transition: 'width 200ms, background-color 200ms',
})

const dotIdle = css({
  bg: 'gray.300',
  _hover: { bg: 'gray.400' },
  _dark: { bg: 'gray.700', _hover: { bg: 'gray.600' } },
})

const dotActive = css({ width: '5r', bg: 'gray.700', _dark: { bg: 'gray.200' } })

const caption = css({
  marginTop: '4r',
  fontSize: '3.5r',
  lineHeight: '1.5',
  textAlign: 'center',
  color: 'diagramMuted',
})

/* The docs code chip, borderless, as in the library kinds diagram. */
const chip = css({
  fontFamily: 'mono',
  fontSize: '3.25r',
  color: 'docsText',
  bg: 'diagramChip',
  border: 'none',
  borderRadius: 'sm',
  paddingX: '1.5r',
  paddingY: '0.5r',
  whiteSpace: 'nowrap',
})

/** One blank slide at a time; the buttons and dots scroll the snap track by slide widths. */
export function CarouselDemo() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (target: number) => {
    const el = trackRef.current
    if (el) el.scrollTo({ left: target * el.clientWidth })
  }

  return (
    <Figure className={frame}>
      <Div className={viewport}>
        <Div ref={trackRef} className={track} aria-label="Carousel demo" role="region" tabIndex={0}>
          {icons.map((Icon, i) => (
            <Div key={i} className={`${slide} ${shades[i]}`} aria-hidden={i !== index}>
              <Div className={slideIcon}>
                <Icon size="16r" />
              </Div>
            </Div>
          ))}
        </Div>
        <Button
          type="button"
          className={`${navButton} ${prevButton}`}
          aria-label="Previous slide"
          disabled={index === 0}
          onClick={() => goTo(index - 1)}
        >
          <ChevronLeftIcon size="sm" />
        </Button>
        <Button
          type="button"
          className={`${navButton} ${nextButton}`}
          aria-label="Next slide"
          disabled={index === SLIDES - 1}
          onClick={() => goTo(index + 1)}
        >
          <ChevronRightIcon size="sm" />
        </Button>
      </Div>
      <Div className={dots}>
        {Array.from({ length: SLIDES }, (_, i) => (
          <Button
            key={i}
            type="button"
            className={`${dot} ${i === index ? dotActive : dotIdle}`}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => goTo(i)}
          />
        ))}
      </Div>
      <Figcaption className={caption}>
        A <Code className={chip}>Carousel</Code> can be built from primitives.
      </Figcaption>
    </Figure>
  )
}
