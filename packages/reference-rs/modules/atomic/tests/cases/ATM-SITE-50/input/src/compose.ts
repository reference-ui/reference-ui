import { css } from '@reference-ui/react'

// SPEC-V2-65 tail: whole-object args through an alias chain (v2
// scope.rs:669 `object_alias_chain_resolves_whole_object`) and over a
// destructured rest (v2 scope.rs:587 `object_destructure_rest_resolves`).
const chainBase = { color: 'gold', padding: '11px' }
const chainButton = chainBase
const primary = chainButton
export const aliasChainArg = css(primary)

const restTokens = { color: 'khaki', padding: '12px', margin: '13px' }
const { color: _dropped, ...space } = restTokens
export const restArg = css(space)

void _dropped
