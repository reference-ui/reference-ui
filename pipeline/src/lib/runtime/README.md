# Container-runtime preflight

Verifies the container runtime responds before Dagger-backed commands run. Matrix-sized gates additionally assert CPU, memory, and disk minimums, starting or resizing the local runtime on macOS when needed; failures throw with remediation guidance instead of failing obscurely later.
