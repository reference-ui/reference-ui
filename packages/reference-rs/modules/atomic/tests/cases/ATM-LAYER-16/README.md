# ATM-LAYER-16 — Global CSS from a user file whose path mentions reset or preset stays in @layer global; only the normalizeCss reset prints in @layer reset

Classification is by exact source, not by path substring. The `normalizeCss/reset`
fragment prints in `@layer reset`. `theme/presets.ts` and `styles/reset-buttons.ts`
mention reset or preset in their paths, yet their rules print in `@layer global`.
Contract: [SPEC.md](../../../SPEC.md).
