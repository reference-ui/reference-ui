# CORE-PRIM-14 — a dark island portaled outside the light host keeps dark resolution

The world renders a light host (plain `data-color-mode="light"` scope)
with a light token probe and an in-tree dark island, plus a second root
into a body-level host — the Core portal shape, since the generated entry
exports no `createPortal` (PARITY-01 P1 precedent). The portaled island
carries `colorMode="dark"` and its child inherits the mode through island
context while sitting outside the light host's DOM. The spec checks the
host detaches at `body`, the island stamps `data-layer` and
`data-color-mode="dark"`, the child stamps `data-color-mode="dark"` with
no dark DOM ancestor, both dark probes paint the dark leaf while the host
paints light, and no `data-panda-theme` spelling appears in the document
or the sheet. The island/child split mirrors the matrix portal test;
every Panda-chrome assertion is re-targeted to `data-color-mode`.

Matrix source: the color-mode system contract spec
"portaled island preserves dark colorMode and token resolution outside
light host DOM" + the color-mode probe
(`color-mode-portal-light-host`).

> Search terms: portal, island, out-of-tree, second root, dark mode, colorMode inherit, data-color-mode, no panda theme, CORE-PRIM-14
