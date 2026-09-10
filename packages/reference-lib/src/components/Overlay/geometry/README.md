# geometry

Unbound writes no coordinates. Anchored uses Trigger only when isolation focus is off. `edge` binds to a viewport side. `start`/`end` follow RTL; physical `left`/`right` edges do not.

- `reference` — resolve the floating reference
- `floating` — computePosition, RTL start/end
- `auto-update` — living position: event-driven default, opt-in sleeping rAF
- `observe-move` — IntersectionObserver layout-shift (Floating UI `observeMove`)
- `clipping` — hide flags from overflow ancestors, including ShadowRoot hosts
- `edge` — sheet insets and `--reference-overlay-index`
- `use-position` — Content layout effect
