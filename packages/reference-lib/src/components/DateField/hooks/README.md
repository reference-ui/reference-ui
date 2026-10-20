# hooks

React bindings over the engine: one hook per behavior, data and
handlers out, no JSX. The edit session owns the single field's dirty
buffer, commit boundary, live typing, stepping, and composition; the
range draft owns both buffers and the bound pane while the commit core
owns the draft-to-committed verbs and the endpoint handlers own the
per-endpoint events; the form observers watch submit and reset for
both; and caret restoration replays each step's caret request before
paint. The roots call their machine and render the slotted hosts.
