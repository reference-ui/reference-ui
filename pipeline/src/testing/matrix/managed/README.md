# Managed Matrix Config

Pipeline-owned generated config shapes for matrix execution: manifests, bundler configs, React entrypoints, and shared test-runner configs. Each leaf module renders its files from Liquid templates and owns the centrally pinned versions behind them, keeping generated contracts isolated from orchestration code.

Consumed by fixture setup locally and by the Dagger runner inside containers.
