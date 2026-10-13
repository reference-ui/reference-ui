# Tasty Station Cases

Each direct subfolder of this directory is a standardized `TST-*` test station. A station owns its local
TypeScript input, its declarative specification (`spec.ts`), documentation (`README.md`), and generated output.
Folders are named by the raw station id (`TST-<AREA>-NN`); the descriptive slug lives in the first line of the station README.

When you run the Tasty test suite:

- Stations are discovered matching `/^(TST-[A-Z]+-\d{2})$/`.
- On-demand compilation runs via `compileTastyCase` in `../harness/helpers.ts` scanning `cases/{station}/input/**/*.{ts,tsx}`.
- Runtime artifacts go to `modules/tasty/.scratch/run-<pid>-<id>/{station}/`, a root private to the test file that wrote it, so the API can load them. `disposeTastyScratch` removes that root in `afterAll`. Nothing under `.scratch` is committed.
- Committed goldens under `output/` are `manifest.js` (full emit) and `chunks.json` (sorted module and declaration keys).
- Each station executes `spec.ts`, standing gauges, and golden diffs. Rewrite goldens with `pnpm agentrs v tasty --update-goldens`.
