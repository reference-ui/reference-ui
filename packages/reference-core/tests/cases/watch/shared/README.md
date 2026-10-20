# CORE-WATCH commit harness

Temp worlds, a spawned ref CLI with its exit and output, the driver for the commit's test-only pause point, and folder snapshots for the commit specs. Each spec makes its own world under the OS temp dir so a committed case world never changes; disposeWorld in a finally kills any child still running and removes the world.
