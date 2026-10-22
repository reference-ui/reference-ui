# Agent-RS runner scripts

The compiler workflow runner plus its evidence tooling. The runner drives build, test, and quality gates with CPU-gate coordination; allocation, counter, flame, phase, and complexity helpers capture memory, hardware-counter, profile, and census evidence for perf hunts.

`complexity.test.mjs` pins the cognitive-complexity metric that the quality gate uses (`complexity.mjs`) with hand-scored Rust and TypeScript cases. Run it with `node --test .agents/skills/agent-rs/scripts/complexity.test.mjs`.
