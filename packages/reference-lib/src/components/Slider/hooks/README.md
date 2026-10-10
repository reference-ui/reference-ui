# hooks

React bindings over the slider's sessions: one hook per behavior, data
and handlers out, no JSX. Direction reads inherited RTL after every
render; the registry owns mount-id identity and DOM-order rank; the
value request is the single choke point for snapped, clamped emission;
pointer-drag owns the one-pointer window session with its exactly-once
end report; keyboard owns arrows, paging, and the silent key-session
reset the root's disable and blur paths share. The root only composes
them, wires unregistration to session cancel, and subscribes the window
listeners in their original effect order.
