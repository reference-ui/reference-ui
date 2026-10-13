export const manifest = {
  "version": "2",
  "warnings": [
    {
      "severity": "warning",
      "code": "TST-W-STAR-AMBIGUITY",
      "message": "export * ambiguity: `StarWidget` in `cases/TST-RXP-02/input/star-ambiguity-barrel.ts` is provided by both `cases/TST-RXP-02/input/star-ambiguity-a.ts` and `cases/TST-RXP-02/input/star-ambiguity-b.ts`; excluding from barrel exports",
      "file": "cases/TST-RXP-02/input/star-ambiguity-barrel.ts",
      "help": [
        "re-export `StarWidget` explicitly from `cases/TST-RXP-02/input/star-ambiguity-barrel.ts`"
      ]
    },
    {
      "severity": "warning",
      "code": "TST-W-DUPLICATE-SYMBOL-NAME",
      "message": "Duplicate symbol name `NSType` matched 2 entries: _a7e2de3a6a78fde0 (user), _0ba57dc17653bf88 (user). Use symbol id or scoped lookup to disambiguate.",
      "help": [
        "look up `NSType` by symbol id (_a7e2de3a6a78fde0 (user), _0ba57dc17653bf88 (user)) or a scoped lookup"
      ]
    },
    {
      "severity": "warning",
      "code": "TST-W-DUPLICATE-SYMBOL-NAME",
      "message": "Duplicate symbol name `StarWidget` matched 2 entries: _ba7d042bb43bf8b5 (user), _7a819100a71c3ace (user). Use symbol id or scoped lookup to disambiguate.",
      "help": [
        "look up `StarWidget` by symbol id (_ba7d042bb43bf8b5 (user), _7a819100a71c3ace (user)) or a scoped lookup"
      ]
    },
    {
      "severity": "warning",
      "code": "TST-W-DUPLICATE-SYMBOL-NAME",
      "message": "Duplicate symbol name `TypeA` matched 2 entries: _7ad06ddba91578e6 (user), _29b4a3c4b38d3269 (user). Use symbol id or scoped lookup to disambiguate.",
      "help": [
        "look up `TypeA` by symbol id (_7ad06ddba91578e6 (user), _29b4a3c4b38d3269 (user)) or a scoped lookup"
      ]
    },
    {
      "severity": "warning",
      "code": "TST-W-DUPLICATE-SYMBOL-NAME",
      "message": "Duplicate symbol name `TypeB` matched 2 entries: _7ad06ddba91578e5 (user), _29b4a3c4b38d326a (user). Use symbol id or scoped lookup to disambiguate.",
      "help": [
        "look up `TypeB` by symbol id (_7ad06ddba91578e5 (user), _29b4a3c4b38d326a (user)) or a scoped lookup"
      ]
    }
  ],
  "symbolsByName": {
    "AmbientModule": [
      "_54ac9654e930e842"
    ],
    "BarrelDeepItem": [
      "_4a5c1d91c4b67516"
    ],
    "CircularItem": [
      "_7ed4b5150ddb9e87"
    ],
    "CircularUse": [
      "_4dea4040254039db"
    ],
    "DefaultAsUse": [
      "_bbd60cb6c538004c"
    ],
    "DefaultAsWidget": [
      "_e7e132cd82a09e07"
    ],
    "ExplicitDefaultUse": [
      "_48cfe112bdd9dfbd"
    ],
    "ExplicitDefaultWidget": [
      "_8159d0d78d2a38cb"
    ],
    "Foo": [
      "_f7a6e1720ff2a133"
    ],
    "NSType": [
      "_a7e2de3a6a78fde0",
      "_0ba57dc17653bf88"
    ],
    "ReexportMixed": [
      "_f4b2d455cf7039fc"
    ],
    "ReexportMixedType": [
      "_650cc837627f1b04"
    ],
    "ReexportTypeOnly": [
      "_f3dfe9257d7492ab"
    ],
    "StarAmbiguityUse": [
      "_ef41c28ae8e9045c"
    ],
    "StarDefaultNamed": [
      "_b36b2dd458d9af10"
    ],
    "StarDefaultPhantomUse": [
      "_7ded8f41059643d7"
    ],
    "StarDefaultWidget": [
      "_e3c8d13e98593305"
    ],
    "StarSourceItem": [
      "_e17aa89ee3de80fd"
    ],
    "StarWidget": [
      "_ba7d042bb43bf8b5",
      "_7a819100a71c3ace"
    ],
    "TwoHopUse": [
      "_4854cbfd5ebd09d6"
    ],
    "TwoHopWidget": [
      "_8dac2596f7dfce0e"
    ],
    "TypeA": [
      "_7ad06ddba91578e6",
      "_29b4a3c4b38d3269"
    ],
    "TypeB": [
      "_7ad06ddba91578e5",
      "_29b4a3c4b38d326a"
    ]
  },
  "symbolsById": {
    "_0ba57dc17653bf88": {
      "id": "_0ba57dc17653bf88",
      "name": "NSType",
      "kind": "interface",
      "chunk": "./chunks/_0ba57dc17653bf88.js",
      "library": "user"
    },
    "_29b4a3c4b38d3269": {
      "id": "_29b4a3c4b38d3269",
      "name": "TypeA",
      "kind": "interface",
      "chunk": "./chunks/_29b4a3c4b38d3269.js",
      "library": "user"
    },
    "_29b4a3c4b38d326a": {
      "id": "_29b4a3c4b38d326a",
      "name": "TypeB",
      "kind": "interface",
      "chunk": "./chunks/_29b4a3c4b38d326a.js",
      "library": "user"
    },
    "_4854cbfd5ebd09d6": {
      "id": "_4854cbfd5ebd09d6",
      "name": "TwoHopUse",
      "kind": "interface",
      "chunk": "./chunks/_4854cbfd5ebd09d6.js",
      "library": "user"
    },
    "_48cfe112bdd9dfbd": {
      "id": "_48cfe112bdd9dfbd",
      "name": "ExplicitDefaultUse",
      "kind": "interface",
      "chunk": "./chunks/_48cfe112bdd9dfbd.js",
      "library": "user"
    },
    "_4a5c1d91c4b67516": {
      "id": "_4a5c1d91c4b67516",
      "name": "BarrelDeepItem",
      "kind": "interface",
      "chunk": "./chunks/_4a5c1d91c4b67516.js",
      "library": "user"
    },
    "_4dea4040254039db": {
      "id": "_4dea4040254039db",
      "name": "CircularUse",
      "kind": "interface",
      "chunk": "./chunks/_4dea4040254039db.js",
      "library": "user"
    },
    "_54ac9654e930e842": {
      "id": "_54ac9654e930e842",
      "name": "AmbientModule",
      "kind": "typeAlias",
      "chunk": "./chunks/_54ac9654e930e842.js",
      "library": "user"
    },
    "_650cc837627f1b04": {
      "id": "_650cc837627f1b04",
      "name": "ReexportMixedType",
      "kind": "interface",
      "chunk": "./chunks/_650cc837627f1b04.js",
      "library": "user"
    },
    "_7a819100a71c3ace": {
      "id": "_7a819100a71c3ace",
      "name": "StarWidget",
      "kind": "interface",
      "chunk": "./chunks/_7a819100a71c3ace.js",
      "library": "user"
    },
    "_7ad06ddba91578e5": {
      "id": "_7ad06ddba91578e5",
      "name": "TypeB",
      "kind": "interface",
      "chunk": "./chunks/_7ad06ddba91578e5.js",
      "library": "user"
    },
    "_7ad06ddba91578e6": {
      "id": "_7ad06ddba91578e6",
      "name": "TypeA",
      "kind": "interface",
      "chunk": "./chunks/_7ad06ddba91578e6.js",
      "library": "user"
    },
    "_7ded8f41059643d7": {
      "id": "_7ded8f41059643d7",
      "name": "StarDefaultPhantomUse",
      "kind": "interface",
      "chunk": "./chunks/_7ded8f41059643d7.js",
      "library": "user"
    },
    "_7ed4b5150ddb9e87": {
      "id": "_7ed4b5150ddb9e87",
      "name": "CircularItem",
      "kind": "interface",
      "chunk": "./chunks/_7ed4b5150ddb9e87.js",
      "library": "user"
    },
    "_8159d0d78d2a38cb": {
      "id": "_8159d0d78d2a38cb",
      "name": "ExplicitDefaultWidget",
      "kind": "interface",
      "chunk": "./chunks/_8159d0d78d2a38cb.js",
      "library": "user"
    },
    "_8dac2596f7dfce0e": {
      "id": "_8dac2596f7dfce0e",
      "name": "TwoHopWidget",
      "kind": "interface",
      "chunk": "./chunks/_8dac2596f7dfce0e.js",
      "library": "user"
    },
    "_a7e2de3a6a78fde0": {
      "id": "_a7e2de3a6a78fde0",
      "name": "NSType",
      "kind": "interface",
      "chunk": "./chunks/_a7e2de3a6a78fde0.js",
      "library": "user"
    },
    "_b36b2dd458d9af10": {
      "id": "_b36b2dd458d9af10",
      "name": "StarDefaultNamed",
      "kind": "interface",
      "chunk": "./chunks/_b36b2dd458d9af10.js",
      "library": "user"
    },
    "_ba7d042bb43bf8b5": {
      "id": "_ba7d042bb43bf8b5",
      "name": "StarWidget",
      "kind": "interface",
      "chunk": "./chunks/_ba7d042bb43bf8b5.js",
      "library": "user"
    },
    "_bbd60cb6c538004c": {
      "id": "_bbd60cb6c538004c",
      "name": "DefaultAsUse",
      "kind": "interface",
      "chunk": "./chunks/_bbd60cb6c538004c.js",
      "library": "user"
    },
    "_e17aa89ee3de80fd": {
      "id": "_e17aa89ee3de80fd",
      "name": "StarSourceItem",
      "kind": "interface",
      "chunk": "./chunks/_e17aa89ee3de80fd.js",
      "library": "user"
    },
    "_e3c8d13e98593305": {
      "id": "_e3c8d13e98593305",
      "name": "StarDefaultWidget",
      "kind": "interface",
      "chunk": "./chunks/_e3c8d13e98593305.js",
      "library": "user"
    },
    "_e7e132cd82a09e07": {
      "id": "_e7e132cd82a09e07",
      "name": "DefaultAsWidget",
      "kind": "interface",
      "chunk": "./chunks/_e7e132cd82a09e07.js",
      "library": "user"
    },
    "_ef41c28ae8e9045c": {
      "id": "_ef41c28ae8e9045c",
      "name": "StarAmbiguityUse",
      "kind": "interface",
      "chunk": "./chunks/_ef41c28ae8e9045c.js",
      "library": "user"
    },
    "_f3dfe9257d7492ab": {
      "id": "_f3dfe9257d7492ab",
      "name": "ReexportTypeOnly",
      "kind": "interface",
      "chunk": "./chunks/_f3dfe9257d7492ab.js",
      "library": "user"
    },
    "_f4b2d455cf7039fc": {
      "id": "_f4b2d455cf7039fc",
      "name": "ReexportMixed",
      "kind": "interface",
      "chunk": "./chunks/_f4b2d455cf7039fc.js",
      "library": "user"
    },
    "_f7a6e1720ff2a133": {
      "id": "_f7a6e1720ff2a133",
      "name": "Foo",
      "kind": "interface",
      "chunk": "./chunks/_f7a6e1720ff2a133.js",
      "library": "user"
    }
  }
};
export default manifest;
