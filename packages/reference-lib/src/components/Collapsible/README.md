# Collapsible

One disclosure, fully owned: the trigger requests toggles and exposes
panel state, the content gates mounting through Presence, and the panel
lives the mounted life — measured collapse motion, focus evacuation,
browser-find reveals, and closed isolation. The root renders no node;
it builds the session and provides it to the parts.

Contract: the Collapsible contract. Cases: the Collapsible test catalog.

The root is composition only: a session hook owns every ref and mirror,
parts consume it, and each behavior owns a folder. Linkage wires
trigger-to-content addressing. Mount decides which closed content stays
in the tree and which `beforematch` opens it. Collapse decides when the
height tween runs and when it jumps. Isolation decides how exiting
content hides. Hooks wrap those decisions plus the DOM effects —
registration, presence, evacuation, reveal, motion, attributes — into
the parts' vocabulary. Shared holds the ref assignment. Pure decisions
carry colocated unit tests; mounted behavior proves out in the existing
suites and CT.

Accordion owns this component's collection mode: an `id` inside an
Accordion hands openness to the Accordion value through the deep context
import. There is no `store`: the
disclosure store is the session hook, not a substrate.

Closed panels stay findable via `hiddenUntilFound` on the root or the
Content, with the Content prop winning over the root; server markup
renders plain `hidden` and upgrades to `until-found` in a layout effect.
`forceMount` is pure author CSS — closed mounted Content carries no
`hidden`, no inert, and no collapse inline styles, and focus evacuation
does not run when nothing unmounts.
