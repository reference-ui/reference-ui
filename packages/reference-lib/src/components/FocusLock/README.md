# FocusLock

Containment solver: Tab cycles, programmatic focus is reclaimed, and focus
restores where it came from when the lock releases. The root renders no node
of its own — it slots behavior onto one authored child — while Overlay owns
when locks activate and what counts as a shard.

Contract: the FocusLock contract. Cases: the FocusLock test catalog.

The root is composition only: a session hook owns every ref, memory and
restore wrap pure decisions into stable callbacks, and two effects run in
their original order — activation captures the origin, registers the stack
entry, and performs the initial move; containment keeps the lock closed
through Tab, focus events, and mutation repair. Beneath the hooks, each
problem owns a folder. The catalog answers what Tab lands on. The stack
arbitrates nesting so only the top lock per document reclaims. Containment
decides each Tab step and reclaim landing. Restore decides where deactivation
returns focus. Shared holds the nameless element plumbing all of them ask.
Pure decisions carry colocated unit tests; browser behavior proves out in CT.

There is no `parts/` — the lock has one transparent rendering, owned by the
root — and no `context`: with no compound parts, there is no subtree to
scope. Cross-component consumers (Toast's focus restore) import the domain
folders directly; no compatibility re-exports live at root.
