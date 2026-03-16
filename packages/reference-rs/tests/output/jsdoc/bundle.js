export const _1c09c75ea78c11d3 = {
  id: "_1c09c75ea78c11d3",
  name: "ButtonProps",
  library: "user",
  description: "Props for a button.\n\nIncludes common sizing options.",
  descriptionRaw: "Props for a button.\n\nIncludes common sizing options.\n@deprecated Use NewButtonProps instead.\n@remarks This interface is kept for backward compatibility.",
  jsdoc: {
  summary: "Props for a button.\n\nIncludes common sizing options.",
  tags: [
  {
    name: "deprecated",
    value: "Use NewButtonProps instead."
  },
  {
    name: "remarks",
    value: "This interface is kept for backward compatibility."
  }
]
},
  members: [
  {
    name: "size",
    optional: true,
    readonly: false,
    kind: "property",
    description: "Preferred size variant.",
    descriptionRaw: "Preferred size variant.\n@default \"sm\"\n@example\n<Button size=\"sm\" />",
    jsdoc: {
    summary: "Preferred size variant.",
    tags: [
    {
      name: "default",
      value: "\"sm\""
    },
    {
      name: "example",
      value: "<Button size=\"sm\" />"
    }
  ]
  },
    type: {
    kind: "union",
    types: [
    {
      kind: "literal",
      value: "'sm'",
    },
    {
      kind: "literal",
      value: "'lg'",
    }
    ],
  }
  },
  {
    name: "disabled",
    optional: true,
    readonly: false,
    kind: "property",
    description: "Plain comment fallback.",
    descriptionRaw: "Plain comment fallback.",
    type: {
    kind: "intrinsic",
    name: "boolean",
  }
  }
],
  extends: [],
  types: [],
};

export const _06291281f3b81a5f = {
  id: "_06291281f3b81a5f",
  name: "CreateButton",
  library: "user",
  description: "Create a button definition.",
  descriptionRaw: "Create a button definition.\n@returns A normalized button props object.",
  jsdoc: {
  summary: "Create a button definition.",
  tags: [
  {
    name: "returns",
    value: "A normalized button props object."
  }
]
},
  definition: {
  kind: "function",
  params: [
  {
    name: "props",
    optional: false,
    typeRef:   {
      id: "_1c09c75ea78c11d3",
      name: "ButtonProps",
      library: "user",
    },
  }
  ],
  returnType:   {
    id: "_1c09c75ea78c11d3",
    name: "ButtonProps",
    library: "user",
  },
},
};

export const interfaces = [
  {
    id: "_1c09c75ea78c11d3",
    name: "ButtonProps",
    library: "user",
  }
];
export const types = [
  {
    id: "_06291281f3b81a5f",
    name: "CreateButton",
    library: "user",
  }
];
export const libraries = [
  "user"
];

