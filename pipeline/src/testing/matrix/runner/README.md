# Matrix runner

Turns a test invocation into container jobs. Validates fixtures, stages artifacts, establishes container runtime access, and fans out per-package runs across the selected entries; flags shrink a run to one React version or expand it to the full bundler-by-runtime fanout.

Execution reporting, the Playwright reporter, and the ref-sync strategy ride beside the orchestration: the staged sync helpers own one watch process inside generated consumers while the runner attributes setup and phase time from their markers.
