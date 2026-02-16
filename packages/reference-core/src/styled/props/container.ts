/**
 * Container query prop: Set up container context
 */

import { patterns } from '../api/patterns'
import { PRIMITIVE_JSX_NAMES } from '../../primitives/tags'

// --- Type ---

/**
 * Container prop: boolean to enable container queries, or string to name the container.
 * 
 * @example
 * ```tsx
 * <Box container>        // Unnamed container
 * <Box container="card"> // Named container "card"
 * ```
 */
export type ContainerProp = string | boolean

export interface ContainerPropDefinition {
  container?: ContainerProp
}

// --- Pattern ---

patterns({
  containerSetup: {
    jsx: [...PRIMITIVE_JSX_NAMES],
    properties: {
      container: { type: 'string' as const },
    },
    blocklist: ['container'],
    transform(props: Record<string, any>) {
      const { container, ...rest } = props

      if (container === undefined) return rest

      return {
        ...rest,
        containerType: 'inline-size',
        ...(typeof container === 'string' && container && { containerName: container }),
      }
    },
  },
})
