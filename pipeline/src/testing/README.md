# Testing Pipeline

Dagger-owned test orchestration. The pipeline owns environments — containers, installs, matrix entries, startup, logs — while the packages under test keep their test files, fixtures, and assertions.

Today this is the matrix runner in matrix testing: per-entry sandboxes across React × bundler combinations, install flows against the pipeline-local registry, and log/artifact collection under `.pipeline/testing/matrix`.

Parent: the src index.
