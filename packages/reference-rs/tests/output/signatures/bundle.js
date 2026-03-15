export const _e465cbb273371f30 = {
  id: "_e465cbb273371f30",
  name: "Callable",
  library: "user",
  description: "Callable interface: () => number",
  members: [
  {
    name: "[call]",
    optional: false,
    readonly: false,
    kind: "call",
    type: {
    kind: "intrinsic",
    name: "number",
  }
  }
],
  extends: [],
  types: [],
};

export const _ebfaaf9e244444a7 = {
  id: "_ebfaaf9e244444a7",
  name: "Constructible",
  library: "user",
  description: "Interface with construct signature.",
  members: [
  {
    name: "[new]",
    optional: false,
    readonly: false,
    kind: "construct",
    description: "Construct with a number.",
    type: {
    kind: "object",
    members: [
    {
      name: "value",
      optional: false,
      readonly: false,
      kind: "property",
      type: {
      kind: "intrinsic",
      name: "number",
    }
    }
    ],
  }
  }
],
  extends: [],
  types: [],
};

export const _b677c97a9d5e706e = {
  id: "_b677c97a9d5e706e",
  name: "MixedMembers",
  library: "user",
  description: "Mix of property, readonly, and index.",
  members: [
  {
    name: "version",
    optional: false,
    readonly: true,
    kind: "property",
    type: {
    kind: "intrinsic",
    name: "number",
  }
  },
  {
    name: "name",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    kind: "intrinsic",
    name: "string",
  }
  },
  {
    name: "[index]",
    optional: false,
    readonly: false,
    kind: "index",
    type: {
    kind: "union",
    types: [
    {
      kind: "intrinsic",
      name: "string",
    },
    {
      kind: "intrinsic",
      name: "number",
    }
    ],
  }
  }
],
  extends: [],
  types: [],
};

export const _8ed205096007e4eb = {
  id: "_8ed205096007e4eb",
  name: "MouseEvent",
  library: "user",
  description: "Simple event-like type for callback tests.",
  definition: {
  kind: "object",
  members: [
  {
    name: "target",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    kind: "intrinsic",
    name: "unknown",
  }
  }
  ],
},
};

export const _7b3b52c30a1cb1f3 = {
  id: "_7b3b52c30a1cb1f3",
  name: "NamedPair",
  library: "user",
  description: "Named tuple (labels on elements).",
  definition: {
  kind: "tuple",
  elements: [
{
  label: "name",
  optional: false,
  rest: false,
  element:   {
    kind: "intrinsic",
    name: "string",
  }
},
{
  label: "age",
  optional: false,
  rest: false,
  element:   {
    kind: "intrinsic",
    name: "number",
  }
}
  ],
},
};

export const _1d9db75ec3ed2f66 = {
  id: "_1d9db75ec3ed2f66",
  name: "NumberArray",
  library: "user",
  description: "Type alias using Array<T>.",
  definition: {
  kind: "array",
  element:   {
    kind: "intrinsic",
    name: "number",
  },
},
};

export const _f305cc1e7199217f = {
  id: "_f305cc1e7199217f",
  name: "Pairs",
  library: "user",
  description: "Nested: array of tuples.",
  definition: {
  kind: "array",
  element:   {
    kind: "tuple",
    elements: [
  {
    optional: false,
    rest: false,
    element:   {
      kind: "intrinsic",
      name: "string",
    }
  },
  {
    optional: false,
    rest: false,
    element:   {
      kind: "intrinsic",
      name: "number",
    }
  }
    ],
  },
},
};

export const _50eb8f1095b4faac = {
  id: "_50eb8f1095b4faac",
  name: "ParenType",
  library: "user",
  description: "Parenthesized type (should unwrap to string).",
  definition: {
  kind: "intrinsic",
  name: "string",
},
};

export const _b652e9a4954e7214 = {
  id: "_b652e9a4954e7214",
  name: "ReadonlyProps",
  library: "user",
  description: "Signatures scenario: readonly, method/call/index signatures, array/tuple/intersection types.\nUsed to test §4.2 (richer type refs) and §4.3 (member metadata).\n/\n\n/** Props with a readonly id and optional mutable label.",
  members: [
  {
    name: "id",
    optional: false,
    readonly: true,
    kind: "property",
    type: {
    kind: "intrinsic",
    name: "string",
  }
  },
  {
    name: "label",
    optional: true,
    readonly: false,
    kind: "property",
    type: {
    kind: "intrinsic",
    name: "string",
  }
  }
],
  extends: [],
  types: [],
};

export const _87dbded5077a394e = {
  id: "_87dbded5077a394e",
  name: "StringArray",
  library: "user",
  description: "Type alias using array (T[]).",
  definition: {
  kind: "array",
  element:   {
    kind: "intrinsic",
    name: "string",
  },
},
};

export const _dd32241cd00dc40f = {
  id: "_dd32241cd00dc40f",
  name: "StringMap",
  library: "user",
  description: "Object with an index signature for string keys.",
  members: [
  {
    name: "[index]",
    optional: false,
    readonly: false,
    kind: "index",
    type: {
    kind: "intrinsic",
    name: "number",
  }
  }
],
  extends: [],
  types: [],
};

export const _3da1bee03f34a580 = {
  id: "_3da1bee03f34a580",
  name: "StringNumberPair",
  library: "user",
  description: "Tuple type.",
  definition: {
  kind: "tuple",
  elements: [
{
  optional: false,
  rest: false,
  element:   {
    kind: "intrinsic",
    name: "string",
  }
},
{
  optional: false,
  rest: false,
  element:   {
    kind: "intrinsic",
    name: "number",
  }
}
  ],
},
};

export const _59a2ab269a56f209 = {
  id: "_59a2ab269a56f209",
  name: "WithCallback",
  library: "user",
  description: "Interface with a callback property: we document the function signature (params + return type).",
  members: [
  {
    name: "onClick",
    optional: false,
    readonly: false,
    kind: "property",
    description: "Called when the element is clicked.",
    type: {
    kind: "function",
    params: [
    {
      name: "event",
      optional: false,
      typeRef:   {
        id: "_8ed205096007e4eb",
        name: "MouseEvent",
        library: "user",
      },
    }
    ],
    returnType:   {
      kind: "intrinsic",
      name: "void",
    },
  }
  }
],
  extends: [],
  types: [
  {
    id: "_8ed205096007e4eb",
    name: "MouseEvent",
    library: "user",
  }
],
};

export const _6bab5b18975daebf = {
  id: "_6bab5b18975daebf",
  name: "WithIdAndName",
  library: "user",
  description: "Intersection type.",
  definition: {
  kind: "intersection",
  types: [
  {
    kind: "object",
    members: [
    {
      name: "id",
      optional: false,
      readonly: false,
      kind: "property",
      type: {
      kind: "intrinsic",
      name: "string",
    }
    }
    ],
  },
  {
    kind: "object",
    members: [
    {
      name: "name",
      optional: false,
      readonly: false,
      kind: "property",
      type: {
      kind: "intrinsic",
      name: "string",
    }
    }
    ],
  }
  ],
},
};

export const _3ad186f5e93cfb4b = {
  id: "_3ad186f5e93cfb4b",
  name: "WithMethod",
  library: "user",
  description: "Interface with a method signature (no implementation).",
  members: [
  {
    name: "getName",
    optional: false,
    readonly: false,
    kind: "method",
    description: "Returns the display name.",
    type: {
    kind: "intrinsic",
    name: "string",
  }
  }
],
  extends: [],
  types: [],
};

export const _da23b67f682e846c = {
  id: "_da23b67f682e846c",
  name: "WithOptionalElement",
  library: "user",
  description: "Tuple with optional trailing element.",
  definition: {
  kind: "tuple",
  elements: [
{
  optional: false,
  rest: false,
  element:   {
    kind: "intrinsic",
    name: "string",
  }
},
{
  optional: true,
  rest: false,
  element:   {
    kind: "intrinsic",
    name: "number",
  }
}
  ],
},
};

export const _63db840b5bad946a = {
  id: "_63db840b5bad946a",
  name: "WithRest",
  library: "user",
  description: "Tuple with rest element.",
  definition: {
  kind: "tuple",
  elements: [
{
  optional: false,
  rest: false,
  element:   {
    kind: "intrinsic",
    name: "string",
  }
},
{
  optional: false,
  rest: true,
  element:   {
    kind: "array",
    element:   {
      kind: "intrinsic",
      name: "number",
    },
  }
}
  ],
},
};

export const interfaces = [
  {
    id: "_e465cbb273371f30",
    name: "Callable",
    library: "user",
  },
  {
    id: "_ebfaaf9e244444a7",
    name: "Constructible",
    library: "user",
  },
  {
    id: "_b677c97a9d5e706e",
    name: "MixedMembers",
    library: "user",
  },
  {
    id: "_b652e9a4954e7214",
    name: "ReadonlyProps",
    library: "user",
  },
  {
    id: "_dd32241cd00dc40f",
    name: "StringMap",
    library: "user",
  },
  {
    id: "_59a2ab269a56f209",
    name: "WithCallback",
    library: "user",
  },
  {
    id: "_3ad186f5e93cfb4b",
    name: "WithMethod",
    library: "user",
  }
];
export const types = [
  {
    id: "_8ed205096007e4eb",
    name: "MouseEvent",
    library: "user",
  },
  {
    id: "_7b3b52c30a1cb1f3",
    name: "NamedPair",
    library: "user",
  },
  {
    id: "_1d9db75ec3ed2f66",
    name: "NumberArray",
    library: "user",
  },
  {
    id: "_f305cc1e7199217f",
    name: "Pairs",
    library: "user",
  },
  {
    id: "_50eb8f1095b4faac",
    name: "ParenType",
    library: "user",
  },
  {
    id: "_87dbded5077a394e",
    name: "StringArray",
    library: "user",
  },
  {
    id: "_3da1bee03f34a580",
    name: "StringNumberPair",
    library: "user",
  },
  {
    id: "_6bab5b18975daebf",
    name: "WithIdAndName",
    library: "user",
  },
  {
    id: "_da23b67f682e846c",
    name: "WithOptionalElement",
    library: "user",
  },
  {
    id: "_63db840b5bad946a",
    name: "WithRest",
    library: "user",
  }
];
export const libraries = [
  "user"
];

