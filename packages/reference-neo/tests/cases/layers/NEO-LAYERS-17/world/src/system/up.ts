// up.ts — the owner's theming module for the NEO-LAYERS-17 world. It takes the layered upstream's published base
// system and emits the same system branded by one extendSystem call: upInk gets a light and a dark value, and
// upSoft gets a light-only value over a token the upstream darkens. The consumer config imports brandUp, applies
// it to the upstream's baseSystem, and lists the result under layers.

import { extendSystem, type BaseSystem } from '@reference-ui/neo'

/** The upstream's base system with the brand's token overrides applied, ready to list under layers. */
export function brandUp(upBaseSystem: BaseSystem): BaseSystem {
  return extendSystem(upBaseSystem, {
    tokens: {
      colors: {
        upInk: { value: '#0f766e', dark: '#5eead4' },
        upSoft: { value: '#0d9488' },
      },
    },
  })
}
