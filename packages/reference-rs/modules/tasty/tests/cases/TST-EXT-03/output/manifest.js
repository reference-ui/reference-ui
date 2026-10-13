export const manifest = {
  "version": "2",
  "warnings": [
    {
      "severity": "warning",
      "code": "TST-W-UNSUPPORTED-AUGMENTATION",
      "message": "module augmentation of `./base` in `cases/TST-EXT-03/input/augment.ts` is not merged; its declarations are not added to `./base`",
      "file": "cases/TST-EXT-03/input/augment.ts",
      "help": [
        "declare the members in `./base` itself instead of augmenting it"
      ]
    }
  ],
  "symbolsByName": {
    "Base": [
      "_febb05de9658309b"
    ]
  },
  "symbolsById": {
    "_febb05de9658309b": {
      "id": "_febb05de9658309b",
      "name": "Base",
      "kind": "interface",
      "chunk": "./chunks/_febb05de9658309b.js",
      "library": "user"
    }
  }
};
export default manifest;
