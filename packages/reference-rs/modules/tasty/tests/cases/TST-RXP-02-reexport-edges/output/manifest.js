export const manifest = {
  "version": "2",
  "warnings": [
    "cases/TST-RXP-02-reexport-edges/input/star-ambiguity-barrel.ts: export * ambiguity: \"StarWidget\" in \"cases/TST-RXP-02-reexport-edges/input/star-ambiguity-barrel.ts\" is provided by both \"cases/TST-RXP-02-reexport-edges/input/star-ambiguity-a.ts\" and \"cases/TST-RXP-02-reexport-edges/input/star-ambiguity-b.ts\"; excluding from barrel exports",
    "Duplicate symbol name \"NSType\" matched 2 entries: _e6d501ddf7d22889 (user), _45f08cb8c10e7e77 (user). Use symbol id or scoped lookup to disambiguate.",
    "Duplicate symbol name \"StarWidget\" matched 2 entries: _6fe5ab8f90e7b714 (user), _529f5b3ebcfda767 (user). Use symbol id or scoped lookup to disambiguate.",
    "Duplicate symbol name \"TypeA\" matched 2 entries: _e0b5072be48655db (user), _85adc4e320b7f6b0 (user). Use symbol id or scoped lookup to disambiguate.",
    "Duplicate symbol name \"TypeB\" matched 2 entries: _e0b5072be48655d8 (user), _85adc4e320b7f6b3 (user). Use symbol id or scoped lookup to disambiguate."
  ],
  "symbolsByName": {
    "AmbientModule": [
      "_11fcd9cf6c7a6eef"
    ],
    "BarrelDeepItem": [
      "_7962065f1a764505"
    ],
    "CircularItem": [
      "_c3c9421facace66a"
    ],
    "Foo": [
      "_0bb90e90cb7e460e"
    ],
    "NSType": [
      "_e6d501ddf7d22889",
      "_45f08cb8c10e7e77"
    ],
    "ReexportMixed": [
      "_9559cde828d1a49d"
    ],
    "ReexportMixedType": [
      "_a9c328ac09453687"
    ],
    "ReexportTypeOnly": [
      "_b94c60c04ce4c2ae"
    ],
    "StarAmbiguityUse": [
      "_56d1acdc1816fdc3"
    ],
    "StarSourceItem": [
      "_4240eb08ea24aa06"
    ],
    "StarWidget": [
      "_6fe5ab8f90e7b714",
      "_529f5b3ebcfda767"
    ],
    "TypeA": [
      "_e0b5072be48655db",
      "_85adc4e320b7f6b0"
    ],
    "TypeB": [
      "_e0b5072be48655d8",
      "_85adc4e320b7f6b3"
    ]
  },
  "symbolsById": {
    "_0bb90e90cb7e460e": {
      "id": "_0bb90e90cb7e460e",
      "name": "Foo",
      "kind": "interface",
      "chunk": "./chunks/_0bb90e90cb7e460e.js",
      "library": "user"
    },
    "_11fcd9cf6c7a6eef": {
      "id": "_11fcd9cf6c7a6eef",
      "name": "AmbientModule",
      "kind": "typeAlias",
      "chunk": "./chunks/_11fcd9cf6c7a6eef.js",
      "library": "user"
    },
    "_4240eb08ea24aa06": {
      "id": "_4240eb08ea24aa06",
      "name": "StarSourceItem",
      "kind": "interface",
      "chunk": "./chunks/_4240eb08ea24aa06.js",
      "library": "user"
    },
    "_45f08cb8c10e7e77": {
      "id": "_45f08cb8c10e7e77",
      "name": "NSType",
      "kind": "interface",
      "chunk": "./chunks/_45f08cb8c10e7e77.js",
      "library": "user"
    },
    "_529f5b3ebcfda767": {
      "id": "_529f5b3ebcfda767",
      "name": "StarWidget",
      "kind": "interface",
      "chunk": "./chunks/_529f5b3ebcfda767.js",
      "library": "user"
    },
    "_56d1acdc1816fdc3": {
      "id": "_56d1acdc1816fdc3",
      "name": "StarAmbiguityUse",
      "kind": "interface",
      "chunk": "./chunks/_56d1acdc1816fdc3.js",
      "library": "user"
    },
    "_6fe5ab8f90e7b714": {
      "id": "_6fe5ab8f90e7b714",
      "name": "StarWidget",
      "kind": "interface",
      "chunk": "./chunks/_6fe5ab8f90e7b714.js",
      "library": "user"
    },
    "_7962065f1a764505": {
      "id": "_7962065f1a764505",
      "name": "BarrelDeepItem",
      "kind": "interface",
      "chunk": "./chunks/_7962065f1a764505.js",
      "library": "user"
    },
    "_85adc4e320b7f6b0": {
      "id": "_85adc4e320b7f6b0",
      "name": "TypeA",
      "kind": "interface",
      "chunk": "./chunks/_85adc4e320b7f6b0.js",
      "library": "user"
    },
    "_85adc4e320b7f6b3": {
      "id": "_85adc4e320b7f6b3",
      "name": "TypeB",
      "kind": "interface",
      "chunk": "./chunks/_85adc4e320b7f6b3.js",
      "library": "user"
    },
    "_9559cde828d1a49d": {
      "id": "_9559cde828d1a49d",
      "name": "ReexportMixed",
      "kind": "interface",
      "chunk": "./chunks/_9559cde828d1a49d.js",
      "library": "user"
    },
    "_a9c328ac09453687": {
      "id": "_a9c328ac09453687",
      "name": "ReexportMixedType",
      "kind": "interface",
      "chunk": "./chunks/_a9c328ac09453687.js",
      "library": "user"
    },
    "_b94c60c04ce4c2ae": {
      "id": "_b94c60c04ce4c2ae",
      "name": "ReexportTypeOnly",
      "kind": "interface",
      "chunk": "./chunks/_b94c60c04ce4c2ae.js",
      "library": "user"
    },
    "_c3c9421facace66a": {
      "id": "_c3c9421facace66a",
      "name": "CircularItem",
      "kind": "interface",
      "chunk": "./chunks/_c3c9421facace66a.js",
      "library": "user"
    },
    "_e0b5072be48655d8": {
      "id": "_e0b5072be48655d8",
      "name": "TypeB",
      "kind": "interface",
      "chunk": "./chunks/_e0b5072be48655d8.js",
      "library": "user"
    },
    "_e0b5072be48655db": {
      "id": "_e0b5072be48655db",
      "name": "TypeA",
      "kind": "interface",
      "chunk": "./chunks/_e0b5072be48655db.js",
      "library": "user"
    },
    "_e6d501ddf7d22889": {
      "id": "_e6d501ddf7d22889",
      "name": "NSType",
      "kind": "interface",
      "chunk": "./chunks/_e6d501ddf7d22889.js",
      "library": "user"
    }
  }
};
export default manifest;
