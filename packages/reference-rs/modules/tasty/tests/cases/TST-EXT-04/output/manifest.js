export const manifest = {
  "version": "2",
  "warnings": [
    {
      "severity": "warning",
      "code": "TST-W-UNSUPPORTED-SYNTAX",
      "message": "unsupported syntax `export =` in `cases/TST-EXT-04/input/assign.ts`: tasty does not model this statement and skips it",
      "file": "cases/TST-EXT-04/input/assign.ts",
      "help": [
        "re-declare what `export =` provides as named exports of `cases/TST-EXT-04/input/assign.ts`"
      ]
    },
    {
      "severity": "warning",
      "code": "TST-W-UNSUPPORTED-SYNTAX",
      "message": "unsupported syntax `declare global` in `cases/TST-EXT-04/input/globals.ts`: tasty does not model this statement and skips it",
      "file": "cases/TST-EXT-04/input/globals.ts",
      "help": [
        "re-declare what `declare global` provides as named exports of `cases/TST-EXT-04/input/globals.ts`"
      ]
    },
    {
      "severity": "warning",
      "code": "TST-W-UNSUPPORTED-SYNTAX",
      "message": "unsupported syntax `import x = require()` in `cases/TST-EXT-04/input/requires.ts`: tasty does not model this statement and skips it",
      "file": "cases/TST-EXT-04/input/requires.ts",
      "help": [
        "re-declare what `import x = require()` provides as named exports of `cases/TST-EXT-04/input/requires.ts`"
      ]
    }
  ],
  "symbolsByName": {
    "Local": [
      "_65061d23e269f7df"
    ],
    "Shape": [
      "_488a1896a50959f8"
    ],
    "Sided": [
      "_ede71833b54265a1"
    ]
  },
  "symbolsById": {
    "_488a1896a50959f8": {
      "id": "_488a1896a50959f8",
      "name": "Shape",
      "kind": "interface",
      "chunk": "./chunks/_488a1896a50959f8.js",
      "library": "user"
    },
    "_65061d23e269f7df": {
      "id": "_65061d23e269f7df",
      "name": "Local",
      "kind": "interface",
      "chunk": "./chunks/_65061d23e269f7df.js",
      "library": "user"
    },
    "_ede71833b54265a1": {
      "id": "_ede71833b54265a1",
      "name": "Sided",
      "kind": "interface",
      "chunk": "./chunks/_ede71833b54265a1.js",
      "library": "user"
    }
  }
};
export default manifest;
