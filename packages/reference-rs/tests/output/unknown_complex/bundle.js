export const _9906dd2bd9a95dcd = {
  id: "_9906dd2bd9a95dcd",
  name: "OptionalKeys",
  library: "user",
  description: "Mapped type: all keys of T become optional. Partial<T> style.",
  typeParameters: [
  {
    name: "T"
  }
],
  definition: {
  kind: "mapped",
  typeParam: "P",
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
      id: "P",
      name: "P",
      library: "user",
    },
  }
},
};

export const _f0631b896d577312 = {
  id: "_f0631b896d577312",
  name: "StringKeys",
  library: "user",
  description: "Conditional type: picks string keys from T.",
  typeParameters: [
  {
    name: "T"
  }
],
  definition: {
  kind: "conditional",
  checkType:   {
    id: "T",
    name: "T",
    library: "user",
  },
  extendsType:   {
    kind: "intrinsic",
    name: "object",
  },
  trueType:   {
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
    readonlyModifier: "preserve",
    nameType:   {
      kind: "conditional",
      checkType:   {
        id: "K",
        name: "K",
        library: "user",
      },
      extendsType:   {
        kind: "intrinsic",
        name: "string",
      },
      trueType:   {
        id: "K",
        name: "K",
        library: "user",
      },
      falseType:   {
        kind: "intrinsic",
        name: "never",
      },
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
  falseType:   {
    kind: "intrinsic",
    name: "never",
  },
},
};

export const _e6a653180c040998 = {
  id: "_e6a653180c040998",
  name: "TemplateLiteralAlias",
  library: "user",
  description: "Template literal type → structured TemplateLiteral with parts.",
  definition: {
  kind: "template_literal",
  parts: [
  {
    kind: "text",
    value: "foo-",
  },
  {
    kind: "type",
    value:   {
      kind: "intrinsic",
      name: "string",
    },
  },
  {
    kind: "text",
    value: "",
  }
  ],
},
};

export const _4b619f9ef2ff1695 = {
  id: "_4b619f9ef2ff1695",
  name: "TypeQueryAlias",
  library: "user",
  description: "Type query (typeof) → structured TypeQuery with expression.",
  definition: {
  kind: "type_query",
  expression: "Array.prototype.map",
},
};

export const _f724b00f1a7d9d24 = {
  id: "_f724b00f1a7d9d24",
  name: "User",
  library: "user",
  description: "Complex scenario: mapped and conditional types are structural.\nWe still preserve unsupported nested pieces as raw summaries when needed.\n/\n\n/** Simple interface for testing reference from complex type.",
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
  }
],
  extends: [],
  types: [],
};

export const _52cc92eeeb08e45d = {
  id: "_52cc92eeeb08e45d",
  name: "UserName",
  library: "user",
  description: "Indexed access type: property key from another type.",
  definition: {
  kind: "indexed_access",
  object:   {
    id: "_f724b00f1a7d9d24",
    name: "User",
    library: "user",
  },
  index:   {
    kind: "literal",
    value: "'name'",
  },
},
};

export const _d997f0f1502f7bad = {
  id: "_d997f0f1502f7bad",
  name: "UsesOptionalKeys",
  library: "user",
  description: "Type alias that references the mapped type.",
  members: [
  {
    name: "partialUser",
    optional: false,
    readonly: false,
    kind: "property",
    description: "User with all keys optional (mapped type).",
    type: {
    id: "_9906dd2bd9a95dcd",
    name: "OptionalKeys",
    library: "user",
    typeArguments: [
    {
      id: "_f724b00f1a7d9d24",
      name: "User",
      library: "user",
    }
    ],
  }
  }
],
  extends: [],
  types: [
  {
    id: "_9906dd2bd9a95dcd",
    name: "OptionalKeys",
    library: "user",
  }
],
};

export const _9e73920757acf05a = {
  id: "_9e73920757acf05a",
  name: "WithIndexedAccess",
  library: "user",
  description: "Interface member with indexed access type.",
  members: [
  {
    name: "nameType",
    optional: false,
    readonly: false,
    kind: "property",
    description: "Type of the name property from User.",
    type: {
    kind: "indexed_access",
    object:   {
      id: "_f724b00f1a7d9d24",
      name: "User",
      library: "user",
    },
    index:   {
      kind: "literal",
      value: "'name'",
    },
  }
  }
],
  extends: [],
  types: [],
};

export const interfaces = [
  {
    id: "_f724b00f1a7d9d24",
    name: "User",
    library: "user",
  },
  {
    id: "_d997f0f1502f7bad",
    name: "UsesOptionalKeys",
    library: "user",
  },
  {
    id: "_9e73920757acf05a",
    name: "WithIndexedAccess",
    library: "user",
  }
];
export const types = [
  {
    id: "_9906dd2bd9a95dcd",
    name: "OptionalKeys",
    library: "user",
  },
  {
    id: "_f0631b896d577312",
    name: "StringKeys",
    library: "user",
  },
  {
    id: "_e6a653180c040998",
    name: "TemplateLiteralAlias",
    library: "user",
  },
  {
    id: "_4b619f9ef2ff1695",
    name: "TypeQueryAlias",
    library: "user",
  },
  {
    id: "_52cc92eeeb08e45d",
    name: "UserName",
    library: "user",
  }
];
export const libraries = [
  "user"
];

