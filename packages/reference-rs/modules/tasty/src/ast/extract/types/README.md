# Type lowering

Annotations into TypeRef values with enclosing binders bound. Keywords and literals become leaves; composites, tuples with their optional, rest, and labeled elements, and references with indexed access and heritage each own a lowering; infer names collect from conditional extends types without crossing into nested conditionals.
