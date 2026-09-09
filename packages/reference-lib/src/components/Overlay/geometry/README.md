# geometry

Unbound writes no coordinates. Anchored uses Trigger only when isolation focus is off. `edge` binds to a viewport side. `start`/`end` follow RTL; physical `left`/`right` edges do not.

- `reference` — resolve the floating reference
- `floating` — computePosition, autoUpdate, RTL start/end
- `clipping` — hide flags from overflow ancestors, including ShadowRoot hosts
- `edge` — sheet insets and `--reference-overlay-index`
- `use-position` — Content layout effect
