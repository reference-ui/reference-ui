export const manifest = {
  "version": "2",
  "warnings": [
    {
      "severity": "warning",
      "code": "TST-W-DUPLICATE-SYMBOL-NAME",
      "message": "Duplicate symbol name `SharedProps` matched 2 entries: _255119e309fe9e49 (user), _eeba0b1ccc4b90bf (user). Use symbol id or scoped lookup to disambiguate.",
      "help": [
        "look up `SharedProps` by symbol id (_255119e309fe9e49 (user), _eeba0b1ccc4b90bf (user)) or a scoped lookup"
      ]
    }
  ],
  "symbolsByName": {
    "SharedProps": [
      "_255119e309fe9e49",
      "_eeba0b1ccc4b90bf"
    ],
    "UsesAliasedSharedProps": [
      "_507743c824677fb8"
    ]
  },
  "symbolsById": {
    "_255119e309fe9e49": {
      "id": "_255119e309fe9e49",
      "name": "SharedProps",
      "kind": "interface",
      "chunk": "./chunks/_255119e309fe9e49.js",
      "library": "user"
    },
    "_507743c824677fb8": {
      "id": "_507743c824677fb8",
      "name": "UsesAliasedSharedProps",
      "kind": "typeAlias",
      "chunk": "./chunks/_507743c824677fb8.js",
      "library": "user"
    },
    "_eeba0b1ccc4b90bf": {
      "id": "_eeba0b1ccc4b90bf",
      "name": "SharedProps",
      "kind": "interface",
      "chunk": "./chunks/_eeba0b1ccc4b90bf.js",
      "library": "user"
    }
  }
};
export default manifest;
