# system/runtime/recipe

Owns Reference UI's runtime recipe extension seam over Panda's generated `cva()`.

## Why This Exists

Reference UI exposes `recipe()` as a public API, but Panda's generated runtime
does not understand Reference-owned props like `r` inside recipe style objects.

Virtual lowering handles the build-time extraction path.

This module keeps the runtime path aligned by preprocessing recipe config
objects before delegating to Panda's generated `cva()`.

## Scope

- lower `r` in `base`
- lower `r` in variant branches
- lower `r` in `compoundVariants[].css`
- leave unsupported shapes untouched rather than partially rewriting them

## Boundary

This is an internal runtime adapter.

- Panda still owns recipe resolution and class generation
- `css/lowerResponsiveStyles` owns the shared object-shape rewrite
- `customCvaFn` is the explicit Reference UI extension point for `recipe()`