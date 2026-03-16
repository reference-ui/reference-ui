export const _4447d38db6695546 = {
  id: "_4447d38db6695546",
  name: "KeyValue",
  library: "user",
  description: "Interface with default type parameter.",
  descriptionRaw: "Interface with default type parameter.",
  jsdoc: {
  summary: "Interface with default type parameter.",
  tags: []
},
  typeParameters: [
  {
    name: "K",
    default:   {
      kind: "intrinsic",
      name: "string",
    }
  },
  {
    name: "V",
    default:   {
      kind: "intrinsic",
      name: "unknown",
    }
  }
],
  members: [
  {
    name: "key",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    id: "K",
    name: "K",
    library: "user",
  }
  },
  {
    name: "value",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    id: "V",
    name: "V",
    library: "user",
  }
  }
],
  extends: [],
  types: [],
};

export const _b04c8ef1ce6337f8 = {
  id: "_b04c8ef1ce6337f8",
  name: "PartialDefault",
  library: "user",
  description: "Multiple params, only some with defaults.",
  descriptionRaw: "Multiple params, only some with defaults.",
  jsdoc: {
  summary: "Multiple params, only some with defaults.",
  tags: []
},
  typeParameters: [
  {
    name: "T"
  },
  {
    name: "U",
    default:   {
      kind: "intrinsic",
      name: "number",
    }
  }
],
  definition: {
  kind: "object",
  members: [
  {
    name: "a",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    id: "T",
    name: "T",
    library: "user",
  }
  },
  {
    name: "b",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    id: "U",
    name: "U",
    library: "user",
  }
  }
  ],
},
};

export const _90f9b9f634348a25 = {
  id: "_90f9b9f634348a25",
  name: "WithDefault",
  library: "user",
  description: "Default type parameters scenario.\nType parameters with default (e.g. T = string) are emitted in the bundle.\n/\n\n/** Type alias with default type parameter.",
  descriptionRaw: "Default type parameters scenario.\nType parameters with default (e.g. T = string) are emitted in the bundle.\n/\n\n/** Type alias with default type parameter.",
  jsdoc: {
  summary: "Default type parameters scenario.\nType parameters with default (e.g. T = string) are emitted in the bundle.\n/\n\n/** Type alias with default type parameter.",
  tags: []
},
  typeParameters: [
  {
    name: "T",
    default:   {
      kind: "intrinsic",
      name: "string",
    }
  }
],
  definition: {
  kind: "object",
  members: [
  {
    name: "value",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    id: "T",
    name: "T",
    library: "user",
  }
  }
  ],
},
};

export const interfaces = [
  {
    id: "_4447d38db6695546",
    name: "KeyValue",
    library: "user",
  }
];
export const types = [
  {
    id: "_b04c8ef1ce6337f8",
    name: "PartialDefault",
    library: "user",
  },
  {
    id: "_90f9b9f634348a25",
    name: "WithDefault",
    library: "user",
  }
];
export const libraries = [
  "user"
];

