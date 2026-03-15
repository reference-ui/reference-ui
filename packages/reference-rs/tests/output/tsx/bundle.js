export const _eba256af489576a9 = {
  id: "_eba256af489576a9",
  name: "ButtonProps",
  library: "user",
  description: "TSX scenario: ensure .tsx files are scanned and interfaces/types are extracted.\nJSX in the file is irrelevant for the type scanner; we only care about exported types.\n/\n\n/** Props for a React-like button component (type-only; no JSX usage required).",
  members: [
  {
    name: "label",
    optional: false,
    readonly: false,
    kind: "property",
    description: "Button label.",
    type: {
    kind: "intrinsic",
    name: "string",
  }
  },
  {
    name: "onClick",
    optional: true,
    readonly: false,
    kind: "property",
    description: "Optional click handler.",
    type: {
    kind: "function",
    params: [
  
    ],
    returnType:   {
      kind: "intrinsic",
      name: "void",
    },
  }
  },
  {
    name: "disabled",
    optional: true,
    readonly: false,
    kind: "property",
    description: "Optional disabled state.",
    type: {
    kind: "intrinsic",
    name: "boolean",
  }
  }
],
  extends: [],
  types: [],
};

export const _90c7ca95ccfc3bc8 = {
  id: "_90c7ca95ccfc3bc8",
  name: "ButtonVariant",
  library: "user",
  description: "Variant type used by ButtonProps.",
  definition: {
  kind: "union",
  types: [
  {
    kind: "literal",
    value: "'default'",
  },
  {
    kind: "literal",
    value: "'primary'",
  },
  {
    kind: "literal",
    value: "'danger'",
  }
  ],
},
};

export const interfaces = [
  {
    id: "_eba256af489576a9",
    name: "ButtonProps",
    library: "user",
  }
];
export const types = [
  {
    id: "_90c7ca95ccfc3bc8",
    name: "ButtonVariant",
    library: "user",
  }
];
export const libraries = [
  "user"
];

