# parts

One file per public part: Track, Range, Thumb. Each part reads geometry
and session handlers from context, registers itself with the root, and
renders its own chrome — Track resolves clicks to thumbs, Range paints
the filled span with no interaction of its own, and Thumb publishes
clamped ARIA plus the focus-visible ring. Parts invoke sessions; they
never own them.
