# ATM-LAYER-14

Keyframe bodies run props through the canon alias table and values through
the `css()` unit chain, so `h: '4'` lowers to `height` plus the sizes token
(or `px` when the token is absent) instead of printing verbatim `h: 4`.
Mirrors the Panda `roll` keyframes test. Contract: [SPEC.md](../../../SPEC.md).
