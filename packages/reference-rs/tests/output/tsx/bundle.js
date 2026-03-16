export const _eba256af489576a9 = {
  id: "_eba256af489576a9",
  name: "ButtonProps",
  library: "user",
  description: "TSX scenario: ensure .tsx files are scanned and interfaces/types are extracted.\nJSX in the file is irrelevant for the type scanner; we only care about exported types.\n/\n\n/** Props for a React-like button component (type-only; no JSX usage required).",
  descriptionRaw: "TSX scenario: ensure .tsx files are scanned and interfaces/types are extracted.\nJSX in the file is irrelevant for the type scanner; we only care about exported types.\n/\n\n/** Props for a React-like button component (type-only; no JSX usage required).",
  jsdoc: {
  summary: "TSX scenario: ensure .tsx files are scanned and interfaces/types are extracted.\nJSX in the file is irrelevant for the type scanner; we only care about exported types.\n/\n\n/** Props for a React-like button component (type-only; no JSX usage required).",
  tags: []
},
  members: [
  {
    name: "label",
    optional: false,
    readonly: false,
    kind: "property",
    description: "Button label.",
    descriptionRaw: "Button label.",
    jsdoc: {
    summary: "Button label.",
    tags: []
  },
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
    descriptionRaw: "Optional click handler.",
    jsdoc: {
    summary: "Optional click handler.",
    tags: []
  },
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
    descriptionRaw: "Optional disabled state.",
    jsdoc: {
    summary: "Optional disabled state.",
    tags: []
  },
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
  descriptionRaw: "Variant type used by ButtonProps.",
  jsdoc: {
  summary: "Variant type used by ButtonProps.",
  tags: []
},
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

