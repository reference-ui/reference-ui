# Atomic crate tests

Unit coverage grouped by compiler seam. Each module pins one contract with hermetic scratch trees plus the live sync root as a canary (canary tests return early when the gitignored output is absent): gates, packages, panic behavior, the empty-request seed, slots, streams, and the public surface.
