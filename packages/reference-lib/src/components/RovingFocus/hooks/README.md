# hooks

Root lifecycle, used only by `RovingFocus.tsx`. Four hooks, one per kernel
behavior: the registry owns the entry map and the registration bump;
currentness owns the sole tab stop, the SSR first-claim handshake,
post-commit settlement, and the focus-moving path; the typeahead session
owns the search buffer's lifetime; keyboard dispatch routes each keydown to
linear movement, grid geometry, or typeahead. Each returns data, handlers,
and refs — the isolated domain modules do the deciding, the hooks do the
wiring.
