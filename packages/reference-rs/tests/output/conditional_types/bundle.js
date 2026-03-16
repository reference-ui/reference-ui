export const _f23ea0bad2076793 = {
  id: "_f23ea0bad2076793",
  name: "IsString",
  library: "user",
  description: "Simple conditional alias.",
  descriptionRaw: "Simple conditional alias.",
  jsdoc: {
  summary: "Simple conditional alias.",
  tags: []
},
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
    name: "string",
  },
  trueType:   {
    kind: "literal",
    value: "'yes'",
  },
  falseType:   {
    kind: "literal",
    value: "'no'",
  },
},
};

export const _e2f8f4d1f45f11da = {
  id: "_e2f8f4d1f45f11da",
  name: "ToUser",
  library: "user",
  description: "Conditional alias using a reference branch.",
  descriptionRaw: "Conditional alias using a reference branch.",
  jsdoc: {
  summary: "Conditional alias using a reference branch.",
  tags: []
},
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
    id: "_8ed8b3dd1575a049",
    name: "User",
    library: "user",
  },
  falseType:   {
    kind: "intrinsic",
    name: "never",
  },
},
};

export const _8ed8b3dd1575a049 = {
  id: "_8ed8b3dd1575a049",
  name: "User",
  library: "user",
  description: "Conditional-type scenario: structural conditional TypeRefs without evaluation.\nUsed to verify check/extends/true/false branches and member usage.",
  descriptionRaw: "Conditional-type scenario: structural conditional TypeRefs without evaluation.\nUsed to verify check/extends/true/false branches and member usage.",
  jsdoc: {
  summary: "Conditional-type scenario: structural conditional TypeRefs without evaluation.\nUsed to verify check/extends/true/false branches and member usage.",
  tags: []
},
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
  }
],
  extends: [],
  types: [],
};

export const _79b21da36c668663 = {
  id: "_79b21da36c668663",
  name: "WithConditionals",
  library: "user",
  description: "Interface members that use conditional types directly.",
  descriptionRaw: "Interface members that use conditional types directly.",
  jsdoc: {
  summary: "Interface members that use conditional types directly.",
  tags: []
},
  typeParameters: [
  {
    name: "T"
  }
],
  members: [
  {
    name: "result",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    kind: "conditional",
    checkType:   {
      id: "T",
      name: "T",
      library: "user",
    },
    extendsType:   {
      kind: "intrinsic",
      name: "string",
    },
    trueType:   {
      kind: "literal",
      value: "'yes'",
    },
    falseType:   {
      kind: "literal",
      value: "'no'",
    },
  }
  },
  {
    name: "userish",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
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
      id: "_8ed8b3dd1575a049",
      name: "User",
      library: "user",
    },
    falseType:   {
      kind: "intrinsic",
      name: "never",
    },
  }
  }
],
  extends: [],
  types: [],
};

export const interfaces = [
  {
    id: "_8ed8b3dd1575a049",
    name: "User",
    library: "user",
  },
  {
    id: "_79b21da36c668663",
    name: "WithConditionals",
    library: "user",
  }
];
export const types = [
  {
    id: "_f23ea0bad2076793",
    name: "IsString",
    library: "user",
  },
  {
    id: "_e2f8f4d1f45f11da",
    name: "ToUser",
    library: "user",
  }
];
export const libraries = [
  "user"
];

