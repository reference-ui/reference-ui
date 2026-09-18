# MERGE ledger

Source: PLAN.md §8.7 rows NEO-MERGE-01..08, verbatim. No existing cases in
this group, so no `done` rows. All engine stations confirmed present
(`packages/reference-rs/modules/atomic/tests/cases/<id>` + README);
no RS rows added.

| id | claim | status | engine | host | proof | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| NEO-MERGE-01 | Two `css()` args: later wins per slot; both atoms exist in the sheet | done | ATM-MERGE-01 | `plans.ts` | computed colour = second arg | `[atm]` P0 #7 |
| NEO-MERGE-02 | Alias vs longhand (`bg` then `background`) resolve to one slot; last wins | done | ATM-MERGE-02 | `plans.ts` | computed | `[atm]` MERGE-02 |
| NEO-MERGE-03 | Shorthand then longhand (`padding` then `paddingTop`) cascade correctly regardless of sheet order | done | ATM-SHORT-01/06, ATM-ORDER-04 | — | computed four sides | `[atm]` P0 #4; `[panda-v1]` `rule-processor.test.ts` border example |
| NEO-MERGE-04 | `borderBottom: '1px solid'` does not clobber `borderColor` with `currentColor` | done | ATM-SHORT-01 | — | computed border-bottom-color | `[atm]` P0 #4 |
| NEO-MERGE-05 | A conditional object arg (`{ _hover: … }`) merges with a base arg at the condition slot | done | ATM-MERGE-03 | `plans.ts` | hover paints merged value | Neo `plans.test.ts` |
| NEO-MERGE-06 | Runtime value with no compiled atom yields no class and exactly one dev diagnostic — never a ghost class | done | ATM-GHOST-02 | `css.ts` | class string empty for that prop; console captured once | `[atm]` GHOST; `[decision D11]` |
| NEO-MERGE-07 | An `!important` atom beats a later plain atom in the same slot | done | ATM-LEAF-09 | `plans.ts` | computed | `[panda-v1]` `global-css.test.ts` important |
| NEO-MERGE-08 | Shorthand remap with an `undefined` longhand keeps only the defined value (`flexDir` + `flexDirection: undefined`) | done | ATM-LEAF-* | `css.ts` | computed flex-direction; one utility | `[panda-v1]` `shared/__tests__/walk-object.test.ts` |
