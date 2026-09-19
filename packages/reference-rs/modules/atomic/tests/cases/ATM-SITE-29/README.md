# ATM-SITE-29 — member depth, alias chains, nested conditions

Overmatch Ph3 (SPEC-V2-24, SPEC-V2-31, SPEC-V2-34 chains). Multi-hop
member reads (`tokens.colors.red`), member-hop spreads
(`...styles.hover`), and `!` unwrapping (`tokens!.color`) resolve
through nested const entries; scalar and object alias chains
(`const b = a`) resolve transitively in declaration order with
whole-binding provenance; nested conditions and responsive maps lower
through const spreads exactly like inline objects. Misses keep today's
`DynamicMember`/spread vocabulary, cycles and forward refs stay
valueless (runtime TDZ), and identifier values plus spreads inside
const objects ride the SPEC-V2-34 object half pinned at ATM-SITE-28.

`member.ts` pins multi-hop reads, member-hop spreads over branch
members, and `!` unwrapping; `alias.ts` pins transitive scalar and
object chains; `nested.ts` pins conditional-spread unions under
conditions and responsive maps in consts; `flat.tsx` pins JSX parity
including member-valued inits.

Both walkers call the shared `extract/fold/member` node, so want/plan
parity is structural. Panda: `scope.rs:286` (member init),
`conditional_output.rs:655` (nested spread), `:707` (member hop),
`calls.rs:2024` (non-null unwrap), `scope.rs:1349`/`:1369` (inner scope
wins).
