export const manifest = {
  "version": "2",
  "warnings": [
    {
      "severity": "warning",
      "code": "TST-W-DUPLICATE-SYMBOL-NAME",
      "message": "Duplicate symbol name `Shared` matched 2 entries: _494c7f5d67a28826 (user), _9d5234320993175a (user). Use symbol id or scoped lookup to disambiguate.",
      "help": [
        "look up `Shared` by symbol id (_494c7f5d67a28826 (user), _9d5234320993175a (user)) or a scoped lookup"
      ]
    }
  ],
  "symbolsByName": {
    "Shared": [
      "_494c7f5d67a28826",
      "_9d5234320993175a"
    ]
  },
  "symbolsById": {
    "_494c7f5d67a28826": {
      "id": "_494c7f5d67a28826",
      "name": "Shared",
      "kind": "interface",
      "chunk": "./chunks/_494c7f5d67a28826.js",
      "library": "user"
    },
    "_9d5234320993175a": {
      "id": "_9d5234320993175a",
      "name": "Shared",
      "kind": "typeAlias",
      "chunk": "./chunks/_9d5234320993175a.js",
      "library": "user"
    }
  }
};
export default manifest;
