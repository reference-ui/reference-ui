# stack

Document-scoped layer store: the registry every popup shares, with
registration, cascade teardown, and a two-frame removed tombstone. Pure
queries answer the top live layer, descendants, and pointer-events
enablement; a handler map holds each layer's dismiss, escape, and
outside callbacks.
