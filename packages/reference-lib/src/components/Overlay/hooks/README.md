# hooks

Root and Content lifecycle, composed by `Overlay.tsx` and `parts/Content`.
One hook owns controlled/uncontrolled open state, one enforces the
single-instance part registry (mixed edge-plus-anchor is a dev
diagnostic), one pushes and pops the document layer stack, one publishes
Content's node to its layer (dropping only at real close, since Presence
keeps Content mounted through exit), and one collects live child-layer
nodes for FocusLock sharding.
