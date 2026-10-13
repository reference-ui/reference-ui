export const manifest = {
  "version": "2",
  "warnings": [
    {
      "severity": "warning",
      "code": "TST-W-UNRESOLVED-IMPORT",
      "message": "unresolved import `./missing` in `cases/TST-IMP-02/input/index.ts`: no file matches it, so the names it provides stay unresolved",
      "file": "cases/TST-IMP-02/input/index.ts",
      "help": [
        "create the file for `./missing` or correct the specifier in `cases/TST-IMP-02/input/index.ts`"
      ]
    }
  ],
  "symbolsByName": {
    "Holder": [
      "_24c09313d23c9d23"
    ]
  },
  "symbolsById": {
    "_24c09313d23c9d23": {
      "id": "_24c09313d23c9d23",
      "name": "Holder",
      "kind": "interface",
      "chunk": "./chunks/_24c09313d23c9d23.js",
      "library": "user"
    }
  }
};
export default manifest;
