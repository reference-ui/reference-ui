# CSS Imports

This transform retargets `css` imports to the generated Panda-visible system path.

The Rust pass does the heavy lifting. This wrapper normalizes the final import to `src/system/css` so Panda scans the same runtime surface the generated system exposes.