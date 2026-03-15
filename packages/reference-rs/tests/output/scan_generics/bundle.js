export const _1581e925a676a5e5 = {
  id: "_1581e925a676a5e5",
  name: "Box",
  library: "user",
  description: "A generic box wrapping a value of type T.",
  typeParameters: [
  {
    name: "T"
  }
],
  definition: {
  kind: "object",
  members: [
  {
    name: "value",
    optional: false,
    type: {
    id: "T",
    name: "T",
    library: "user",
  }
  }
  ],
},
};

export const _83c6e08e8a0e8a45 = {
  id: "_83c6e08e8a0e8a45",
  name: "ComponentProps",
  library: "user",
  description: "Component props type alias – extracts props from a component type.",
  typeParameters: [
  {
    name: "T"
  }
],
  definition: {
  id: "T",
  name: "T",
  library: "user",
},
};

export const _0d88b9154bc485c2 = {
  id: "_0d88b9154bc485c2",
  name: "UsesGenericRef",
  library: "user",
  description: "Uses a type reference with type arguments: Props<Box<string>>.",
  members: [
  {
    name: "item",
    optional: false,
    description: "The wrapped Props<Box<string>> instance.",
    type: {
    id: "_e8366d69bb3a474b",
    name: "Props",
    library: "user",
    typeArguments: [
    {
      id: "_1581e925a676a5e5",
      name: "Box",
      library: "user",
      typeArguments: [
      {
        kind: "intrinsic",
        name: "string",
      }
      ],
    }
    ],
  }
  }
],
  extends: [],
  types: [
  {
    id: "_1581e925a676a5e5",
    name: "Box",
    library: "user",
  }
],
};

export const _40cce056badfd48a = {
  id: "_40cce056badfd48a",
  name: "WithGenerics",
  library: "user",
  description: "Interface with multiple type parameters.",
  typeParameters: [
  {
    name: "T"
  },
  {
    name: "U"
  }
],
  members: [
  {
    name: "a",
    optional: false,
    description: "First generic field.",
    type: {
    id: "T",
    name: "T",
    library: "user",
  }
  },
  {
    name: "b",
    optional: false,
    description: "Second generic field.",
    type: {
    id: "U",
    name: "U",
    library: "user",
  }
  }
],
  extends: [],
  types: [],
};

export const _e8366d69bb3a474b = {
  id: "_e8366d69bb3a474b",
  name: "Props",
  library: "user",
  description: "Generic props interface with a constraint.",
  typeParameters: [
  {
    name: "T",
    constraint:   {
      kind: "intrinsic",
      name: "object",
    }
  }
],
  members: [
  {
    name: "data",
    optional: false,
    description: "The payload.",
    type: {
    id: "T",
    name: "T",
    library: "user",
  }
  }
],
  extends: [],
  types: [],
};

export const interfaces = [
  {
    id: "_0d88b9154bc485c2",
    name: "UsesGenericRef",
    library: "user",
  },
  {
    id: "_40cce056badfd48a",
    name: "WithGenerics",
    library: "user",
  },
  {
    id: "_e8366d69bb3a474b",
    name: "Props",
    library: "user",
  }
];
export const types = [
  {
    id: "_1581e925a676a5e5",
    name: "Box",
    library: "user",
  },
  {
    id: "_83c6e08e8a0e8a45",
    name: "ComponentProps",
    library: "user",
  }
];
export const libraries = [
  "user"
];

