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
  kind: "unknown",
  summary: "{\n  [P in keyof T]?: T[P];\n}",
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
  kind: "unknown",
  summary: "T extends object\n  ? { [K in keyof T as K extends string ? K : never]: T[K] }\n  : never",
},
};

export const _f724b00f1a7d9d24 = {
  id: "_f724b00f1a7d9d24",
  name: "User",
  library: "user",
  description: "Unknown/complex scenario: mapped types and conditional types become Unknown with summary.\nWe do not fully model these; the scanner should emit kind: \"unknown\" with a summary string.\n/\n\n/** Simple interface for testing reference from complex type.",
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

export const _d997f0f1502f7bad = {
  id: "_d997f0f1502f7bad",
  name: "UsesOptionalKeys",
  library: "user",
  description: "Type alias that references the mapped type (so we see Unknown in a member).",
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
  }
];
export const libraries = [
  "user"
];

