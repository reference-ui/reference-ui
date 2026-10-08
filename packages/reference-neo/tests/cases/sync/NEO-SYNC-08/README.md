# NEO-SYNC-08 — config errors are loud and named

Evidence: `[core]` validate tests (`packages/reference-core/src/config/validate.test.ts`), `[panda-v1]` `config/__tests__/validate-config.test.ts` (contrast: Panda validates the whole theme object; Neo validates only the surviving surface and passes unknown keys through).

The runner syncs this world's valid config fresh, then the spec builds
seven bad worlds in temp dirs and asserts `sync()` rejects each with the
documented message: missing `include`, missing `name`, unsafe `name`
(double-quote and newline — unsafe for `@layer`), bad `jsxElements`
(non-array and non-string entries), and an `extends` entry without synced
data. The bad configs live as spec strings because world files typecheck;
each rejection also leaves no `.reference-ui/` behind.

> Search terms: validation, fail-fast, fail-loud, guard-rails, invalid septet, rejection catalog, sync/config-validation, sync/error-messages, NEO-SYNC-10, NEO-SYNC-11
