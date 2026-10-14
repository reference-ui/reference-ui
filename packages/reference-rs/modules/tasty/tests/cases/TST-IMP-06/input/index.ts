import type { ButtonProps } from './button.js'
import type { IconProps } from './icon.js'
import type { ChunkShape } from './chunk.mjs'
import type { LegacyShape } from './legacy.cjs'

export interface UsesRuntimeSpecifiers {
  button: ButtonProps
  icon: IconProps
  chunk: ChunkShape
  legacy: LegacyShape
}
