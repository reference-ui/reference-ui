# Tasty Case Cases

Each direct subfolder of this directory is a standardized `TST-*` test case. A case owns its local
TypeScript input, its declarative specification (`spec.ts`), documentation (`README.md`), and generated output.
Folders are named by the raw case id (`TST-<AREA>-NN`); the descriptive slug lives in the first line of the case README.

When you run the Tasty test suite:

- Cases are discovered matching `/^(TST-[A-Z]+-\d{2})$/`.
- On-demand compilation runs via `compileTastyCase` in `../harness/helpers.ts` scanning `cases/{case}/input/**/*.{ts,tsx}`.
- Runtime artifacts go to `modules/tasty/.scratch/run-<pid>-<id>/{case}/`, a root private to the test file that wrote it, so the API can load them. `disposeTastyScratch` removes that root in `afterAll`. Nothing under `.scratch` is committed.
- Committed goldens under `output/` are `manifest.js` (full emit) and `chunks.json` (sorted module and declaration keys).
- Each case executes `spec.ts`, standing gauges, and golden diffs. Rewrite goldens with `pnpm agentrs v tasty --update-goldens`.
