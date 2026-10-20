# NumberField

Fully controlled locale-aware number field: Group owns the direct
anatomy and focus tracking, Input renders the verbatim draft while
dirty and the Intl-formatted value when clean, and the steppers share
one press-and-hold engine. The root composes the formatting, session,
action, handler, guard, identity, and form hooks and publishes them as
context — parts invoke session handlers but never own them.

Contract: the NumberField contract. Cases: the NumberField test catalog.

The root is composition only: formatting validates props and derives
the Intl layer, the edit session owns the draft buffer plus every
generation and effect that can end it, step actions request lattice
advances, edit handlers stage text and flush commits, the insert guard
validates paste natively, identity pins the shared Input id, and form
wiring observes submit and reset. Beneath the hooks, each problem owns
a folder. Draft parses locale text and maps carets by logical digit.
Step snaps, advances, and decides commits on the zero-anchored lattice.
Shared holds anatomy, DOM plumbing, naming text, and the dev channel.
Pure decisions carry colocated unit tests; browser behavior proves out
in CT.
