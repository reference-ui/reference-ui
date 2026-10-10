# Collapsible

One disclosure, fully owned: the trigger requests toggles and exposes
panel state, the content gates mounting through Presence, and the panel
lives the mounted life — measured collapse motion, focus evacuation,
browser-find reveals, and closed isolation. The root renders no node;
it builds the session and provides it to the parts.

Contract: [Collapsible.md](./Collapsible.md). Cases: [TESTS.md](./TESTS.md).

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

| Folder | Role |
| :--- | :--- |
| [`parts/`](./parts) | Trigger, Content gate, Content panel |
| [`hooks/`](./hooks) | Session, registration, presence, evacuation, reveal, motion, isolation |
| [`linkage/`](./linkage) | Trigger/content addressing and border collapse |
| [`mount/`](./mount) | Stay-mounted policies and find reveals |
| [`collapse/`](./collapse) | Height-tween skip decisions |
| [`isolation/`](./isolation) | Closed-content inert/hidden lockdown |
| [`shared/`](./shared) | Ref assignment |

Accordion owns this component's collection mode: an `id` inside an
Accordion hands openness to the Accordion value through the deep context
import, with both sides in this refactor. There is no `store.ts`: the
disclosure store is the session hook, not a substrate.
