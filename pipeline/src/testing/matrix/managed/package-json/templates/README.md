# Package JSON Templates

This folder contains the Liquid templates used by the managed matrix package-json module.

- `fixture-package.json.liquid` renders the pipeline-managed `package.json` written into each local `matrix/*` fixture.
  It defines the managed scripts, dependency surface, and local latest-bundler development contract.
- `consumer-package.json.liquid` renders the synthetic consumer `package.json` generated inside Dagger.
  It strips scripts, rewrites workspace protocol dependencies to staged tarballs, and injects the active bundler dev dependencies for the current matrix run.