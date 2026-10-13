export const manifest = {
  "version": "2",
  "warnings": [
    {
      "severity": "warning",
      "code": "TST-W-UNRESOLVED-IMPORT",
      "message": "unresolved import `./missing-named` in `cases/TST-IMP-03/input/index.ts`: no file matches it, so the names it provides stay unresolved",
      "file": "cases/TST-IMP-03/input/index.ts",
      "help": [
        "create the file for `./missing-named` or correct the specifier in `cases/TST-IMP-03/input/index.ts`"
      ]
    },
    {
      "severity": "warning",
      "code": "TST-W-UNRESOLVED-IMPORT",
      "message": "unresolved import `./missing-star` in `cases/TST-IMP-03/input/index.ts`: no file matches it, so the names it provides stay unresolved",
      "file": "cases/TST-IMP-03/input/index.ts",
      "help": [
        "create the file for `./missing-star` or correct the specifier in `cases/TST-IMP-03/input/index.ts`"
      ]
    }
  ],
  "symbolsByName": {
    "Local": [
      "_402c9684e23d9019"
    ]
  },
  "symbolsById": {
    "_402c9684e23d9019": {
      "id": "_402c9684e23d9019",
      "name": "Local",
      "kind": "interface",
      "chunk": "./chunks/_402c9684e23d9019.js",
      "library": "user"
    }
  }
};
export default manifest;
