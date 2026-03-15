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
      kind: "intrinsic",
      name: "string",
    },
    {
      kind: "intrinsic",
      name: "number",
    }
    ],
  },
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
    kind: "intrinsic",
    name: "string",
  },
  {
    kind: "intrinsic",
    name: "number",
  }
  ],
},
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

export const interfaces = [
  {
    id: "_e465cbb273371f30",
    name: "Callable",
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
    id: "_3ad186f5e93cfb4b",
    name: "WithMethod",
    library: "user",
  }
];
export const types = [
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
  }
];
export const libraries = [
  "user"
];

