# parts

The public RovingFocus subcomponents. Root lives in `RovingFocus.tsx`
because it is the composition root; Item lives here because it is the one
repeating part. Item slots kernel behavior onto its single authored child:
authoritative tabIndex, collection registration, and the focus, keydown,
and pointer handlers chained last behind child and part handlers. Currentness
is conferred by focus and by primary-button pointer press alike, but pointer
handling never moves DOM focus — composed focus policies keep authority.
