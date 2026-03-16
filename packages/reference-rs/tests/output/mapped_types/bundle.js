export const _47008842910ac067 = {
  id: "_47008842910ac067",
  name: "OptionalTokens",
  library: "user",
  description: "Basic optional mapped type.",
  typeParameters: [
  {
    name: "T"
  }
],
  definition: {
  kind: "mapped",
  typeParam: "K",
  sourceType:   {
    kind: "type_operator",
    operator: "keyof",
    target:   {
      id: "T",
      name: "T",
      library: "user",
    },
  },
  optionalModifier: "add",
  readonlyModifier: "preserve",
  valueType:   {
    kind: "indexed_access",
    object:   {
      id: "T",
      name: "T",
      library: "user",
    },
    index:   {
      id: "K",
      name: "K",
      library: "user",
    },
  }
},
};

export const _28df340f7b9f8a79 = {
  id: "_28df340f7b9f8a79",
  name: "TokenLabels",
  library: "user",
  description: "Readonly mapped type with key remapping.",
  typeParameters: [
  {
    name: "T"
  }
],
  definition: {
  kind: "mapped",
  typeParam: "K",
  sourceType:   {
    kind: "type_operator",
    operator: "keyof",
    target:   {
      id: "T",
      name: "T",
      library: "user",
    },
  },
  optionalModifier: "preserve",
  readonlyModifier: "add",
  nameType:   {
    kind: "template_literal",
    parts: [
    {
      kind: "text",
      value: "token-",
    },
    {
      kind: "type",
      value:   {
        id: "K",
        name: "K",
        library: "user",
      },
    },
    {
      kind: "text",
      value: "",
    }
    ],
  },
  valueType:   {
    kind: "indexed_access",
    object:   {
      id: "T",
      name: "T",
      library: "user",
    },
    index:   {
      id: "K",
      name: "K",
      library: "user",
    },
  }
},
};

export const _dad5c7c05a60c36f = {
  id: "_dad5c7c05a60c36f",
  name: "Tokens",
  library: "user",
  description: "Mapped-type scenario: key binding, modifiers, remapping, and value type.\nUsed to verify structural TypeRef emission for mapped types.",
  members: [
  {
    name: "sm",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    kind: "intrinsic",
    name: "string",
  }
  },
  {
    name: "lg",
    optional: false,
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

export const _1178349df458d16f = {
  id: "_1178349df458d16f",
  name: "WithMappedTypes",
  library: "user",
  description: "Interface members that use mapped types directly.",
  typeParameters: [
  {
    name: "T"
  }
],
  members: [
  {
    name: "optional",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    kind: "mapped",
    typeParam: "K",
    sourceType:   {
      kind: "type_operator",
      operator: "keyof",
      target:   {
        id: "T",
        name: "T",
        library: "user",
      },
    },
    optionalModifier: "add",
    readonlyModifier: "preserve",
    valueType:   {
      kind: "indexed_access",
      object:   {
        id: "T",
        name: "T",
        library: "user",
      },
      index:   {
        id: "K",
        name: "K",
        library: "user",
      },
    }
  }
  },
  {
    name: "labels",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    kind: "mapped",
    typeParam: "K",
    sourceType:   {
      kind: "type_operator",
      operator: "keyof",
      target:   {
        id: "T",
        name: "T",
        library: "user",
      },
    },
    optionalModifier: "preserve",
    readonlyModifier: "add",
    nameType:   {
      kind: "template_literal",
      parts: [
      {
        kind: "text",
        value: "token-",
      },
      {
        kind: "type",
        value:   {
          id: "K",
          name: "K",
          library: "user",
        },
      },
      {
        kind: "text",
        value: "",
      }
      ],
    },
    valueType:   {
      kind: "indexed_access",
      object:   {
        id: "T",
        name: "T",
        library: "user",
      },
      index:   {
        id: "K",
        name: "K",
        library: "user",
      },
    }
  }
  }
],
  extends: [],
  types: [],
};

export const interfaces = [
  {
    id: "_dad5c7c05a60c36f",
    name: "Tokens",
    library: "user",
  },
  {
    id: "_1178349df458d16f",
    name: "WithMappedTypes",
    library: "user",
  }
];
export const types = [
  {
    id: "_47008842910ac067",
    name: "OptionalTokens",
    library: "user",
  },
  {
    id: "_28df340f7b9f8a79",
    name: "TokenLabels",
    library: "user",
  }
];
export const libraries = [
  "user"
];

