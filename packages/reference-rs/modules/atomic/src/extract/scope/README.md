# Scope-aware resolution

Identifier resolution through per-file scope tables. Each file collects its bindings once, and uses resolve outward from the use-site scope: params and inner declarators shadow outer and cross-file consts, imported names answer from the module graph. Collection, destructuring, lookup, and type submodules split the binding, pattern, query, and annotation work.
