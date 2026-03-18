# Module Bindings

This folder handles the import/export binding bookkeeping used during AST
extraction.

It answers the narrow question "what local name refers to what imported or
exported symbol?" so the rest of extraction can build symbol shells without
re-parsing module-binding logic everywhere.

## Responsibilities

- collect imported bindings from `import` declarations
- collect named export bindings
- collect default export declarations that should become symbol shells

## Boundaries

- this layer does not resolve references across files
- it only records binding information local to one parsed source file
