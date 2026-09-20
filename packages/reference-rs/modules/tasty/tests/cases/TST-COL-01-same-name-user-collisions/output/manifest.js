export const manifest = {
  "version": "2",
  "warnings": [
    "Duplicate symbol name \"SharedProps\" matched 2 entries: _abf8121639bd9db0 (user), _acff3a1253d8ece4 (user). Use symbol id or scoped lookup to disambiguate."
  ],
  "symbolsByName": {
    "SharedProps": [
      "_abf8121639bd9db0",
      "_acff3a1253d8ece4"
    ],
    "UsesAliasedSharedProps": [
      "_af9b378b6f395c0f"
    ]
  },
  "symbolsById": {
    "_abf8121639bd9db0": {
      "id": "_abf8121639bd9db0",
      "name": "SharedProps",
      "kind": "interface",
      "chunk": "./chunks/_abf8121639bd9db0.js",
      "library": "user"
    },
    "_acff3a1253d8ece4": {
      "id": "_acff3a1253d8ece4",
      "name": "SharedProps",
      "kind": "interface",
      "chunk": "./chunks/_acff3a1253d8ece4.js",
      "library": "user"
    },
    "_af9b378b6f395c0f": {
      "id": "_af9b378b6f395c0f",
      "name": "UsesAliasedSharedProps",
      "kind": "typeAlias",
      "chunk": "./chunks/_af9b378b6f395c0f.js",
      "library": "user"
    }
  }
};
export default manifest;
