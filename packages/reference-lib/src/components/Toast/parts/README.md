# parts

One file per chrome piece: the card shell, title, description, action,
cancel, close, loader, and the default card that composes them with the
crossfading status icon and type glyphs. Every part reads the item
context instead of taking chrome props, so custom toast trees stay
terse. The root assigns these onto the Toast compound; the icon resolver
and action renderers stay private to the default card that needs them.
