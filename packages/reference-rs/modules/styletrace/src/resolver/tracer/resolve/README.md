# Tracer passes

Declaration expansion and literal-key collection. Interfaces and aliases walk into the names they contribute with their type arguments bound; union literals, keyof targets, mapped key sources, and indexed access contribute reachable literal names while object members never count as keys.
