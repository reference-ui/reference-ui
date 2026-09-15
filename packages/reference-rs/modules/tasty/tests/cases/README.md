# Tasty Station Cases

Each direct subfolder of this directory is a standardized `TST-*` test station. A station owns its local
TypeScript input, its declarative specification (`spec.ts`), documentation (`README.md`), and generated output.

When you run the Tasty test suite:

- Stations are discovered matching `/^(TST-[A-Z]+-\d{2})-.+$/`.
- On-demand compilation runs via `compileTastyCase` in `helpers.ts` scanning `cases/{station}/input/**/*.{ts,tsx}`.
- Runtime artifacts go to `tests/.scratch/{station}/` so the API can load them. That directory is not committed.
- Committed goldens under `output/` are `manifest.js` (full emit) and `chunks.json` (sorted module and declaration keys).
- Each station executes `spec.ts`, standing gauges, and golden diffs. Rewrite goldens with `pnpm agentrs v tasty --update-goldens`.

