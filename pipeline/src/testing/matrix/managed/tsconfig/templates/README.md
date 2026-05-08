# Tsconfig Templates

This folder contains the Liquid templates used by the managed matrix tsconfig module.

- `consumer-tsconfig.json.liquid` renders the synthetic consumer `tsconfig.json` used inside Dagger.
  It defines the minimal downstream TypeScript contract the matrix runner needs.