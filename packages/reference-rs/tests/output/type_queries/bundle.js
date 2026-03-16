export const _68f1b80940f5c7c8 = {
  id: "_68f1b80940f5c7c8",
  name: "SpacingScale",
  library: "user",
  description: "Type query alias using a qualified expression.",
  descriptionRaw: "Type query alias using a qualified expression.",
  jsdoc: {
  summary: "Type query alias using a qualified expression.",
  tags: []
},
  definition: {
  kind: "type_query",
  expression: "tokens.spacing",
},
};

export const _762a204d0bff1340 = {
  id: "_762a204d0bff1340",
  name: "ThemeConfig",
  library: "user",
  description: "Type query alias using a local identifier.",
  descriptionRaw: "Type query alias using a local identifier.",
  jsdoc: {
  summary: "Type query alias using a local identifier.",
  tags: []
},
  definition: {
  kind: "type_query",
  expression: "themeConfig",
},
};

export const _b1023963eded33c9 = {
  id: "_b1023963eded33c9",
  name: "WithTypeQueries",
  library: "user",
  description: "Interface members that use type queries directly.",
  descriptionRaw: "Interface members that use type queries directly.",
  jsdoc: {
  summary: "Interface members that use type queries directly.",
  tags: []
},
  members: [
  {
    name: "config",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    kind: "type_query",
    expression: "themeConfig",
  }
  },
  {
    name: "spacing",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    kind: "type_query",
    expression: "tokens.spacing",
  }
  }
],
  extends: [],
  types: [],
};

export const interfaces = [
  {
    id: "_b1023963eded33c9",
    name: "WithTypeQueries",
    library: "user",
  }
];
export const types = [
  {
    id: "_68f1b80940f5c7c8",
    name: "SpacingScale",
    library: "user",
  },
  {
    id: "_762a204d0bff1340",
    name: "ThemeConfig",
    library: "user",
  }
];
export const libraries = [
  "user"
];

