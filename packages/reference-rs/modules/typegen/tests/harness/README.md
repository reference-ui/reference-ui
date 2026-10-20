# Typegen tsc harness

Shared consumer typecheck helper. Writes a temp tsconfig plus declaration and consumer files, runs the TypeScript compiler in no-emit mode, and reports pass or rejection, so every suite proves emitted declarations typecheck for real instead of scanning strings.
