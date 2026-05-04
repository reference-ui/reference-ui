# system/runtime

Owns Reference UI's runtime adapter layer over Panda's generated runtime APIs.

## Why This Exists

Reference UI exposes runtime authoring surfaces like `css()` and `recipe()`,
but Panda's generated runtime does not understand Reference-owned sugar such as
responsive `r` inside style objects.

These modules keep runtime behavior aligned with the virtual/build-time lowering
path without changing Panda's underlying class generation.

## Scope

- `index.ts` — single runtime barrel for `css()` and `cva()` entrypoints
- `css/` — explicit runtime extension seam for `css()` and shared style lowering
- `recipe/` — runtime adapter seam for `recipe()` / `cva()`

## Boundary

- Panda still owns class generation and recipe resolution
- virtual lowering still owns the build-time normalization path
- runtime adapters only keep runtime inputs aligned with that lowered shape