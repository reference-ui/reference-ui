// Entry for the PGEN-05 world. It takes the bound media primitives and emits
// one probe per html-media family member with native wiring: dimensioned
// images, canvas, and video, controlled audio, a titled iframe, a picture
// nesting its source, an embed, a caption track, and an svg host with a
// native circle child. Every probe paints brand through a sibling style prop.
import { createRoot } from 'react-dom/client'
import { Audio, Canvas, Embed, Iframe, Img, Picture, Source, Svg, Track, Video } from '@reference-ui/react'

const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

export function PgenMedia() {
  return (
    <div id="media-root">
      <Audio id="media-audio" controls color="brand" />
      <Canvas id="media-canvas" color="brand" />
      <Embed id="media-embed" src="about:blank" type="text/html" color="brand" />
      <Iframe id="media-iframe" src="about:blank" title="frame" color="brand" />
      <Img id="media-img" src={PIXEL} alt="pixel" color="brand" />
      <Picture id="media-picture" color="brand">
        <Source id="media-source" srcSet={PIXEL} media="(min-width: 1px)" color="brand" />
        <Img id="media-img2" src={PIXEL} alt="pixel2" color="brand" />
      </Picture>
      <Svg id="media-svg" color="brand">
        <circle cx="5" cy="5" r="4" />
      </Svg>
      <Track id="media-track" kind="captions" srcLang="en" src="about:blank" color="brand" />
      <Video id="media-video" controls color="brand" />
    </div>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('missing #root')
createRoot(root).render(<PgenMedia />)
