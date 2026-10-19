# Popover

Non-isolating floating content over Overlay: click to open by default,
hover-card mode on request. The root renders no node of its own — it
provides the intent value and wires open state into Overlay, mounting
the document-level hover bridge only when `openOnHover` is set.

Contract: [Popover.md](./Popover.md).

The root is composition only: one hover-intent hook owns open state,
the hover session, and the trigger/content/focus handlers, returning
the context value the parts consume. The `hover/` folder answers
whether a pointer counts and where it may travel — pure, tested
geometry the intent hook and the bridge both compose. Content identity
lives in `shared/` where trigger and content agree on one id. Pure
decisions carry colocated unit tests; open/close, grace travel, and
nesting prove out in CT.

Up: [Components](../components.md).
