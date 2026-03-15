export const _d72dafd30b57674f = {
  id: "_d72dafd30b57674f",
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
    readonly: false,
    kind: "property",
    type: {
    id: "T",
    name: "T",
    library: "user",
  }
  }
  ],
},
};

export const _baac0abc322c453f = {
  id: "_baac0abc322c453f",
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

export const _475818659ca3200c = {
  id: "_475818659ca3200c",
  name: "UsesGenericRef",
  library: "user",
  description: "Uses a type reference with type arguments: Props<Box<string>>.",
  members: [
  {
    name: "item",
    optional: false,
    readonly: false,
    kind: "property",
    description: "The wrapped Props<Box<string>> instance.",
    type: {
    id: "_412f5cd6920b373d",
    name: "Props",
    library: "user",
    typeArguments: [
    {
      id: "_d72dafd30b57674f",
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
    id: "_d72dafd30b57674f",
    name: "Box",
    library: "user",
  }
],
};

export const _0ff4e4f4f8ad760c = {
  id: "_0ff4e4f4f8ad760c",
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
    readonly: false,
    kind: "property",
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
    readonly: false,
    kind: "property",
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

export const _412f5cd6920b373d = {
  id: "_412f5cd6920b373d",
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
    readonly: false,
    kind: "property",
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
    id: "_475818659ca3200c",
    name: "UsesGenericRef",
    library: "user",
  },
  {
    id: "_0ff4e4f4f8ad760c",
    name: "WithGenerics",
    library: "user",
  },
  {
    id: "_412f5cd6920b373d",
    name: "Props",
    library: "user",
  }
];
export const types = [
  {
    id: "_d72dafd30b57674f",
    name: "Box",
    library: "user",
  },
  {
    id: "_baac0abc322c453f",
    name: "ComponentProps",
    library: "user",
  }
];
export const libraries = [
  "user"
];

