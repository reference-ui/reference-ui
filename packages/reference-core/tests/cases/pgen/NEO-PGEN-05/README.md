# NEO-PGEN-05 — the 10 html-media probes carry native attrs and void elements render childless

The world renders one probe per html-media family member with native
wiring: images with src and alt, audio and video with controls, a
titled iframe, a canvas, a picture nesting its
source, an embed, a caption track, and an svg host carrying a native
circle child. Every probe paints `color="brand"`. The spec asserts each
probe's element name, marker, layer stamp, brand paint, and styling-key
absence, then proves the native surface: media attrs land, the style class
lands on the svg host while its child stays a native circle, and the void
probes render childless. Related: NEO-PGEN-11 (the remaining voids),
NEO-PGEN-01 (the flow slice).
