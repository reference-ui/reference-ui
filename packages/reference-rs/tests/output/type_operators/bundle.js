export const _1528b9f2eb9b6286 = {
  id: "_1528b9f2eb9b6286",
  name: "KeysOfUser",
  library: "user",
  description: "Type operator alias using keyof.",
  definition: {
  kind: "type_operator",
  operator: "keyof",
  target:   {
    id: "_88a3913fe13c8181",
    name: "User",
    library: "user",
  },
},
};

export const _3d3fcad8e01a9a82 = {
  id: "_3d3fcad8e01a9a82",
  name: "ReadonlyUsers",
  library: "user",
  description: "Type operator alias using readonly on an array type.",
  definition: {
  kind: "type_operator",
  operator: "readonly",
  target:   {
    kind: "array",
    element:   {
      id: "_88a3913fe13c8181",
      name: "User",
      library: "user",
    },
  },
},
};

export const _88a3913fe13c8181 = {
  id: "_88a3913fe13c8181",
  name: "User",
  library: "user",
  description: "Type-operator scenario: keyof, readonly, and unique symbol.\nUsed to verify structural TypeRef emission for TS type operators.\n/\n\n/** Base shape used by keyof and readonly operator tests.",
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

export const _f8b65fb925a092eb = {
  id: "_f8b65fb925a092eb",
  name: "WithOperators",
  library: "user",
  description: "Interface members that use type operators directly.",
  members: [
  {
    name: "key",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    kind: "type_operator",
    operator: "keyof",
    target:   {
      id: "_88a3913fe13c8181",
      name: "User",
      library: "user",
    },
  }
  },
  {
    name: "frozenUsers",
    optional: false,
    readonly: false,
    kind: "property",
    type: {
    kind: "type_operator",
    operator: "readonly",
    target:   {
      kind: "array",
      element:   {
        id: "_88a3913fe13c8181",
        name: "User",
        library: "user",
      },
    },
  }
  },
  {
    name: "token",
    optional: false,
    readonly: true,
    kind: "property",
    type: {
    kind: "type_operator",
    operator: "unique",
    target:   {
      kind: "intrinsic",
      name: "symbol",
    },
  }
  }
],
  extends: [],
  types: [],
};

export const interfaces = [
  {
    id: "_88a3913fe13c8181",
    name: "User",
    library: "user",
  },
  {
    id: "_f8b65fb925a092eb",
    name: "WithOperators",
    library: "user",
  }
];
export const types = [
  {
    id: "_1528b9f2eb9b6286",
    name: "KeysOfUser",
    library: "user",
  },
  {
    id: "_3d3fcad8e01a9a82",
    name: "ReadonlyUsers",
    library: "user",
  }
];
export const libraries = [
  "user"
];

