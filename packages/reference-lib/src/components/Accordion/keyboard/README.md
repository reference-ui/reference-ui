# keyboard

"Where arrows land" — header traversal without roving tabindex: every
enabled header stays in the native Tab sequence while arrows wrap,
Home lands first, and End lands last. Traversal computes the indices
over enabled stops; scope decides which buttons belong to this root
(its own expanded-state buttons, never content-bound or nested ones)
and which key sources to ignore.
