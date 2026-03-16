export const _5bdbc3234d9d3678 = {
  id: "_5bdbc3234d9d3678",
  name: "BigintAlias",
  library: "user",
  description: "Oxc coverage: intrinsic keywords we handle explicitly.",
  descriptionRaw: "Oxc coverage: intrinsic keywords we handle explicitly.",
  jsdoc: {
  summary: "Oxc coverage: intrinsic keywords we handle explicitly.",
  tags: []
},
  definition: {
  kind: "intrinsic",
  name: "bigint",
},
};

export const _97e64045b2d2504c = {
  id: "_97e64045b2d2504c",
  name: "ButtonVariant",
  library: "user",
  description: "Type alias that is a union of object types.",
  descriptionRaw: "Type alias that is a union of object types.",
  jsdoc: {
  summary: "Type alias that is a union of object types.",
  tags: []
},
  definition: {
  kind: "union",
  types: [
  {
    kind: "object",
    members: [
    {
      name: "type",
      optional: false,
      readonly: false,
      kind: "property",
      type: {
      kind: "literal",
      value: "'primary'",
    }
    }
    ],
  },
  {
    kind: "object",
    members: [
    {
      name: "type",
      optional: false,
      readonly: false,
      kind: "property",
      type: {
      kind: "literal",
      value: "'secondary'",
    }
    },
    {
      name: "outline",
      optional: false,
      readonly: false,
      kind: "property",
      type: {
      kind: "intrinsic",
      name: "boolean",
    }
    }
    ],
  }
  ],
},
};

export const _0c04e3580c41b419 = {
  id: "_0c04e3580c41b419",
  name: "LogLevel",
  library: "user",
  description: "Numeric literal union.",
  descriptionRaw: "Numeric literal union.",
  jsdoc: {
  summary: "Numeric literal union.",
  tags: []
},
  definition: {
  kind: "union",
  types: [
  {
    kind: "literal",
    value: "0",
  },
  {
    kind: "literal",
    value: "1",
  },
  {
    kind: "literal",
    value: "2",
  },
  {
    kind: "literal",
    value: "3",
  }
  ],
},
};

export const _c105c6e2851ff804 = {
  id: "_c105c6e2851ff804",
  name: "MaybeId",
  library: "user",
  description: "Union with literal and intrinsic.",
  descriptionRaw: "Union with literal and intrinsic.",
  jsdoc: {
  summary: "Union with literal and intrinsic.",
  tags: []
},
  definition: {
  kind: "union",
  types: [
  {
    kind: "intrinsic",
    name: "string",
  },
  {
    kind: "intrinsic",
    name: "null",
  }
  ],
},
};

export const _919098afeeceb483 = {
  id: "_919098afeeceb483",
  name: "NeverAlias",
  library: "user",
  description: "Oxc coverage: intrinsic keywords we handle explicitly.",
  descriptionRaw: "Oxc coverage: intrinsic keywords we handle explicitly.",
  jsdoc: {
  summary: "Oxc coverage: intrinsic keywords we handle explicitly.",
  tags: []
},
  definition: {
  kind: "intrinsic",
  name: "never",
},
};

export const _fdbc3396a3bc9575 = {
  id: "_fdbc3396a3bc9575",
  name: "OptionalProps",
  library: "user",
  description: "Interface with optional and required members.",
  descriptionRaw: "Interface with optional and required members.",
  jsdoc: {
  summary: "Interface with optional and required members.",
  tags: []
},
  members: [
  {
    name: "name",
    optional: false,
    readonly: false,
    kind: "property",
    description: "Required name.",
    descriptionRaw: "Required name.",
    jsdoc: {
    summary: "Required name.",
    tags: []
  },
    type: {
    kind: "intrinsic",
    name: "string",
  }
  },
  {
    name: "description",
    optional: true,
    readonly: false,
    kind: "property",
    description: "Optional description.",
    descriptionRaw: "Optional description.",
    jsdoc: {
    summary: "Optional description.",
    tags: []
  },
    type: {
    kind: "intrinsic",
    name: "string",
  }
  },
  {
    name: "count",
    optional: true,
    readonly: false,
    kind: "property",
    description: "Optional count (number).",
    descriptionRaw: "Optional count (number).",
    jsdoc: {
    summary: "Optional count (number).",
    tags: []
  },
    type: {
    kind: "intrinsic",
    name: "number",
  }
  }
],
  extends: [],
  types: [],
};

export const _d18d41faa3b4342f = {
  id: "_d18d41faa3b4342f",
  name: "Status",
  library: "user",
  description: "Unions and literals scenario: union types, literal types, optional properties.\nUsed to test TypeRef::Union, TypeRef::Literal, and member optional: true.\n/\n\n/** String literal union (discriminated union style).",
  descriptionRaw: "Unions and literals scenario: union types, literal types, optional properties.\nUsed to test TypeRef::Union, TypeRef::Literal, and member optional: true.\n/\n\n/** String literal union (discriminated union style).",
  jsdoc: {
  summary: "Unions and literals scenario: union types, literal types, optional properties.\nUsed to test TypeRef::Union, TypeRef::Literal, and member optional: true.\n/\n\n/** String literal union (discriminated union style).",
  tags: []
},
  definition: {
  kind: "union",
  types: [
  {
    kind: "literal",
    value: "'pending'",
  },
  {
    kind: "literal",
    value: "'success'",
  },
  {
    kind: "literal",
    value: "'error'",
  }
  ],
},
};

export const _c6576ce6ab61aca6 = {
  id: "_c6576ce6ab61aca6",
  name: "StringOrNumber",
  library: "user",
  description: "Union of intrinsic types.",
  descriptionRaw: "Union of intrinsic types.",
  jsdoc: {
  summary: "Union of intrinsic types.",
  tags: []
},
  definition: {
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
},
};

export const _f4624ee562742d67 = {
  id: "_f4624ee562742d67",
  name: "SymbolAlias",
  library: "user",
  description: "Oxc coverage: intrinsic keywords we handle explicitly.",
  descriptionRaw: "Oxc coverage: intrinsic keywords we handle explicitly.",
  jsdoc: {
  summary: "Oxc coverage: intrinsic keywords we handle explicitly.",
  tags: []
},
  definition: {
  kind: "intrinsic",
  name: "symbol",
},
};

export const _f40fb2fc7a8048ed = {
  id: "_f40fb2fc7a8048ed",
  name: "VoidAlias",
  library: "user",
  description: "Oxc coverage: intrinsic keywords we handle explicitly.",
  descriptionRaw: "Oxc coverage: intrinsic keywords we handle explicitly.",
  jsdoc: {
  summary: "Oxc coverage: intrinsic keywords we handle explicitly.",
  tags: []
},
  definition: {
  kind: "intrinsic",
  name: "void",
},
};

export const interfaces = [
  {
    id: "_fdbc3396a3bc9575",
    name: "OptionalProps",
    library: "user",
  }
];
export const types = [
  {
    id: "_5bdbc3234d9d3678",
    name: "BigintAlias",
    library: "user",
  },
  {
    id: "_97e64045b2d2504c",
    name: "ButtonVariant",
    library: "user",
  },
  {
    id: "_0c04e3580c41b419",
    name: "LogLevel",
    library: "user",
  },
  {
    id: "_c105c6e2851ff804",
    name: "MaybeId",
    library: "user",
  },
  {
    id: "_919098afeeceb483",
    name: "NeverAlias",
    library: "user",
  },
  {
    id: "_d18d41faa3b4342f",
    name: "Status",
    library: "user",
  },
  {
    id: "_c6576ce6ab61aca6",
    name: "StringOrNumber",
    library: "user",
  },
  {
    id: "_f4624ee562742d67",
    name: "SymbolAlias",
    library: "user",
  },
  {
    id: "_f40fb2fc7a8048ed",
    name: "VoidAlias",
    library: "user",
  }
];
export const libraries = [
  "user"
];

