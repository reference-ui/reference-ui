import postcss from 'postcss'

/**
 * Pattern that matches an unresolved `_private.*` token reference left in the
 * CSS value by Panda when a downstream consumer authors against an upstream
 * `_private` token that was stripped from its config. The reference always
 * starts with `_private.` followed by one or more dot-segmented identifiers.
 */
const UNRESOLVED_PRIVATE_TOKEN_PATTERN = /(?:^|[^a-zA-Z0-9_-])_private\.[a-zA-Z0-9_][a-zA-Z0-9_.-]*/

/**
 * Drop CSS declarations whose value contains an unresolved upstream
 * `_private.*` token reference.
 *
 * Panda emits the literal token name (e.g. `color: _private.brand`) when a
 * `css({ color: '_private.brand' })` call references an upstream private token
 * that is not part of the consumer's token config. The class hash collides
 * with the upstream-resolved class (`.c__private\.brand`), and because the
 * consumer's layer is declared after the upstream layer, the consumer's
 * invalid declaration shadows the resolved one and the whole declaration is
 * dropped by the browser, leaving the element unstyled.
 *
 * Removing the offending declarations during postprocessing prevents the
 * downstream rule from shadowing upstream's correct rule. Empty rules are
 * also removed.
 */
export function dropUnresolvedPrivateTokenDeclarations(rawCss: string): string {
  const root = postcss.parse(rawCss)
  let mutated = false

  root.walkDecls((decl) => {
    if (UNRESOLVED_PRIVATE_TOKEN_PATTERN.test(decl.value)) {
      decl.remove()
      mutated = true
    }
  })

  if (!mutated) return rawCss

  root.walkRules((rule) => {
    if (rule.nodes && rule.nodes.length === 0) {
      rule.remove()
    }
  })

  root.walkAtRules((atRule) => {
    if (atRule.nodes && atRule.nodes.length === 0) {
      atRule.remove()
    }
  })

  return root.toString()
}
