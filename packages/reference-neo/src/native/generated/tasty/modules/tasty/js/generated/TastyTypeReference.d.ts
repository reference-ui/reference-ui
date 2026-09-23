/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/generated/TastyTypeReference.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-tasty-dts.mjs
 */

import type { TastyTypeRef } from "./TastyTypeRef.js";
export type TastyTypeReference = {
    id: string;
    name: string;
    library: string;
    typeArguments?: Array<TastyTypeRef>;
};
