# Tooltip

Hover intent over Overlay: the tip opens after a delay on hover-capable
pointers or immediately on keyboard focus, then closes when intent
leaves. The root renders no node of its own — it provides the intent
value and wires open state into a non-isolating, presence-free Overlay
anchored to the trigger.

Contract: the Tooltip contract.

The root is composition only: one intent hook owns open state, pending
timers, and the warm-group handoff, returning the context value the
Trigger and Content consume. The document-level skip-delay store
(`tooltipGroup`) stays at root because ReferenceLibrary's warmup
imports that path directly — moving it would break an importer outside
this folder. The nested-trigger guard lives in `shared/` where every
layer can ask it. Pure decisions carry colocated unit tests; hover,
focus, and group timing prove out in CT.

Up: Components.
