export const _ea914f06121bc9ff = {
  id: "_ea914f06121bc9ff",
  name: "SizeVariant",
  library: "user",
  description: "Template literal alias using a union interpolation.",
  descriptionRaw: "Template literal alias using a union interpolation.",
  jsdoc: {
  summary: "Template literal alias using a union interpolation.",
  tags: []
},
  definition: {
  kind: "template_literal",
  parts: [
  {
    kind: "text",
    value: "size-",
  },
  {
    kind: "type",
    value:   {
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
    },
  },
  {
    kind: "text",
    value: "",
  }
  ],
},
};

export const _33bd5473c267675b = {
  id: "_33bd5473c267675b",
  name: "TokenKeyLabel",
  library: "user",
  description: "Template literal alias using a nested type operator interpolation.",
  descriptionRaw: "Template literal alias using a nested type operator interpolation.",
  jsdoc: {
  summary: "Template literal alias using a nested type operator interpolation.",
  tags: []
},
  definition: {
  kind: "template_literal",
  parts: [
  {
    kind: "text",
    value: "token-",
  },
  {
    kind: "type",
    value:   {
      kind: "type_operator",
      operator: "keyof",
      target:   {
        id: "_11b1360b226ecf31",
        name: "Tokens",
        library: "user",
      },
    },
  },
  {
    kind: "text",
    value: "",
  }
  ],
},
};

export const _11b1360b226ecf31 = {
  id: "_11b1360b226ecf31",
  name: "Tokens",
  library: "user",
  description: "Template-literal scenario: text and interpolated type parts.\nUsed to verify structural TypeRef emission for template literal types.",
  descriptionRaw: "Template-literal scenario: text and interpolated type parts.\nUsed to verify structural TypeRef emission for template literal types.",
  jsdoc: {
  summary: "Template-literal scenario: text and interpolated type parts.\nUsed to verify structural TypeRef emission for template literal types.",
  tags: []
},
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

export const _7b7d01145e871065 = {
  id: "_7b7d01145e871065",
  name: "WithTemplateLiterals",
  library: "user",
  description: "Interface members that use template literal types directly.",
  descriptionRaw: "Interface members that use template literal types directly.",
  jsdoc: {
  summary: "Interface members that use template literal types directly.",
  tags: []
},
  members: [
  {
    name: "size",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    kind: "template_literal",
    parts: [
    {
      kind: "text",
      value: "size-",
    },
    {
      kind: "type",
      value:   {
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
      },
    },
    {
      kind: "text",
      value: "",
    }
    ],
  }
  },
  {
    name: "label",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    kind: "template_literal",
    parts: [
    {
      kind: "text",
      value: "token-",
    },
    {
      kind: "type",
      value:   {
        kind: "type_operator",
        operator: "keyof",
        target:   {
          id: "_11b1360b226ecf31",
          name: "Tokens",
          library: "user",
        },
      },
    },
    {
      kind: "text",
      value: "",
    }
    ],
  }
  }
],
  extends: [],
  types: [],
};

export const interfaces = [
  {
    id: "_11b1360b226ecf31",
    name: "Tokens",
    library: "user",
  },
  {
    id: "_7b7d01145e871065",
    name: "WithTemplateLiterals",
    library: "user",
  }
];
export const types = [
  {
    id: "_ea914f06121bc9ff",
    name: "SizeVariant",
    library: "user",
  },
  {
    id: "_33bd5473c267675b",
    name: "TokenKeyLabel",
    library: "user",
  }
];
export const libraries = [
  "user"
];

