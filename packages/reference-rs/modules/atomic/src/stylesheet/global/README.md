# Global CSS emission

Lowers structured global-style AST fragments into the reset and global layers. Only the exact normalize reset fragment prints in reset; every other fragment — even a user file whose path mentions reset — prints in global. The walker module traverses nodes; the value module lowers scalars, macros, shorthands, rhythm, and tokens into declarations.
