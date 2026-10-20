# Diagnostics template tests

Cargo proof for frames, batch caps, and determinism. Asserts structural contains rather than golden-pinning pretty output, pins byte-identical determinism through double-render equality, and mirrors the TypeScript render vectors input-for-input so both sides of the boundary stay identical.
