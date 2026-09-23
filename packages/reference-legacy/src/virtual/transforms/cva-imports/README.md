# CVA Imports

This transform retargets recipe/cva imports to the generated Panda-visible system path.

The Rust pass handles the author-surface rewrite. This wrapper normalizes the import to `src/system/css` so downstream responsive lowering and Panda extraction both operate on the canonical cva runtime.