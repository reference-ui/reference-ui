export const _d72dafd30b57674f = {
  id: "_d72dafd30b57674f",
  name: "Box",
  library: "user",
  description: "A generic box wrapping a value of type T.",
  descriptionRaw: "A generic box wrapping a value of type T.",
  jsdoc: {
  summary: "A generic box wrapping a value of type T.",
  tags: []
},
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
  descriptionRaw: "Component props type alias – extracts props from a component type.",
  jsdoc: {
  summary: "Component props type alias – extracts props from a component type.",
  tags: []
},
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
  descriptionRaw: "Uses a type reference with type arguments: Props<Box<string>>.",
  jsdoc: {
  summary: "Uses a type reference with type arguments: Props<Box<string>>.",
  tags: []
},
  members: [
  {
    name: "item",
    optional: false,
    readonly: false,
    kind: "property",
    description: "The wrapped Props<Box<string>> instance.",
    descriptionRaw: "The wrapped Props<Box<string>> instance.",
    jsdoc: {
    summary: "The wrapped Props<Box<string>> instance.",
    tags: []
  },
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
  descriptionRaw: "Interface with multiple type parameters.",
  jsdoc: {
  summary: "Interface with multiple type parameters.",
  tags: []
},
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
    descriptionRaw: "First generic field.",
    jsdoc: {
    summary: "First generic field.",
    tags: []
  },
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
    descriptionRaw: "Second generic field.",
    jsdoc: {
    summary: "Second generic field.",
    tags: []
  },
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
  descriptionRaw: "Generic props interface with a constraint.",
  jsdoc: {
  summary: "Generic props interface with a constraint.",
  tags: []
},
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
    descriptionRaw: "The payload.",
    jsdoc: {
    summary: "The payload.",
    tags: []
  },
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

