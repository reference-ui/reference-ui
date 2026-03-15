export const _97e64045b2d2504c = {
  id: "_97e64045b2d2504c",
  name: "ButtonVariant",
  library: "user",
  description: "Type alias that is a union of object types.",
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

export const _fdbc3396a3bc9575 = {
  id: "_fdbc3396a3bc9575",
  name: "OptionalProps",
  library: "user",
  description: "Interface with optional and required members.",
  members: [
  {
    name: "name",
    optional: false,
    readonly: false,
    kind: "property",
    description: "Required name.",
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

export const interfaces = [
  {
    id: "_fdbc3396a3bc9575",
    name: "OptionalProps",
    library: "user",
  }
];
export const types = [
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
    id: "_d18d41faa3b4342f",
    name: "Status",
    library: "user",
  },
  {
    id: "_c6576ce6ab61aca6",
    name: "StringOrNumber",
    library: "user",
  }
];
export const libraries = [
  "user"
];

