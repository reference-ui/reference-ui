// Tokens for the CORE-BOUND-01 world: a colors group that holds itself. The `self` key closes the cycle.
// It takes the core fragment collector and emits one fragment that sync must refuse by name, never by stack overflow.
import { tokens } from '@reference-ui/core'

const colors: Record<string, unknown> = { brand: { value: '#7c3aed' } }
colors.self = colors

tokens({ colors } as Parameters<typeof tokens>[0])
