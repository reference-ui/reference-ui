# Multi-leaf AST conversion

Every value an expression's wants can take at runtime. Mirrors the want walker leaf for leaf: ternary arms and non-guard logical operands each become their own authored value, and folded unary, binary, template, member, and call forms fan out over their leaves.
