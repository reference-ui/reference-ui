/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/generated/TastySymbolIndexEntry.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

import type { TastySymbolKind } from "./TastySymbolKind.js";
export type TastySymbolIndexEntry = {
    id: string;
    name: string;
    kind: TastySymbolKind;
    chunk: string;
    library: string;
};
