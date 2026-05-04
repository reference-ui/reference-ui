# Virtual Style

The `style` module owns the reserved Panda-visible style collection under `__reference__ui`.

## Purpose

This is where Reference UI gathers authored `css()` / `recipe()` / `cva()` surfaces into a synthetic virtual subtree that Panda scans directly.

## Files

- `collection.ts`: scans style-bearing source files, microbundles them with selected externals preserved, runs the normal virtual transforms, and writes the result under `virtual/__reference__ui`

## Contract

- non-reserved virtual files are neutralized so Panda does not double-extract
- reserved `__reference__ui` files keep raw Panda-readable `css()` / `cva()` calls
- local constants can be inlined by the bundle step without erasing the authored style surface Panda needs to see