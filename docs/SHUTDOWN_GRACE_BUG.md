ef → sync Built 3 package(s) in 0.01s
[docs] ref → sync Ready in 0.12s
[docs] ref → sync Built 3 package(s) in 0.01s
^C[core] /Users/ryn/Developer/reference-ui/packages/reference-core:
[core]  ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @reference-ui/core@0.0.4 dev: `tsup --watch`
[core] Command failed with signal "SIGINT"
[core] pnpm --filter @reference-ui/core run dev exited with code SIGINT
[docs] /Users/ryn/Developer/reference-ui/packages/reference-docs:
[docs]  ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL  @reference-ui/reference-docs@0.0.0 dev: `ref sync && (ref sync --watch & vite)`
[docs] Command failed with signal "SIGINT"
[docs] ref → packager:ts Failed Error: packager-ts-child terminated by SIGINT (interrupted or sync shut down)
[docs]     at spawnPackagerTsDtsChild (file:///Users/ryn/Developer/reference-ui/packages/reference-core/dist/cli/packager-ts/worker.mjs:736:11)
[docs]     at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
[docs]     at async runDtsGeneration (file:///Users/ryn/Developer/reference-ui/packages/reference-core/dist/cli/packager-ts/worker.mjs:747:5)
^C ELIFECYCLE  Command failed.
zsh: terminated  pnpm dev
ryn@Ryns-iMac-Pro reference-ui % [docs] pnpm --filter @reference-ui/reference-docs run dev exited with code SIGINT
^C
ryn@Ryns-iMac-Pro reference-ui % 
ryn@Ryns-iMac-Pro reference-ui % 
--

Can we shut down a touch more gracefully then this?
