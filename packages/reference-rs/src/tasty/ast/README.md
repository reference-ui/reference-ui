# AST Layer

The `ast` module owns the Oxc-facing part of the TypeScript pipeline.

Its job is to take scanned source files, parse them with Oxc, and normalize that
parser output into a cleaner internal model that the rest of the system can use
without depending directly on raw AST nodes.

## Responsibilities

- parse TypeScript and TSX source with Oxc
- collect import bindings
- extract exported declarations
- resolve symbol and type references across scanned files
- normalize interface members, type aliases, and references into an AST-adjacent
  internal model

## Boundaries

- `scanner` discovers and reads files
- `ast` understands Oxc and builds internal parser-derived structures, including
  reference resolution
- `generator` turns resolved data into output artifacts

## Files

- `model.rs`: parser-adjacent internal model
- `extract.rs`: Oxc parsing and declaration extraction
- `resolve.rs`: cross-file symbol and reference resolution
