# parts

One file per public part: Panel, Handle, Thumb. Each part registers with
the nearest root and renders its own chrome — Panel sizes from its own
variable, Handle forwards gestures to the root sessions while staying
focusable-but-inert when blocked, and Thumb paints the grip pill from
the Handle's published state. Parts invoke sessions; they never own
them.
