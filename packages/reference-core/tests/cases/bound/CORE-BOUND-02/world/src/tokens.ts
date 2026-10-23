// Tokens for the CORE-BOUND-02 world: a group nested 150 levels deep. That is past the 100-level limit.
// It takes the core fragment collector and emits one fragment that sync must refuse by name, never by recursion limit.
import { tokens } from '@reference-ui/core'

let deep: Record<string, unknown> = { value: '#7c3aed' }
for (let level = 0; level < 150; level += 1) deep = { n: deep }

tokens({ deep } as Parameters<typeof tokens>[0])
