/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/generated/TastyInterfaceSymbol.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-tasty-dts.mjs
 */

import type { TastyJsDoc } from "./TastyJsDoc.js";
import type { TastyMember } from "./TastyMember.js";
import type { TastySymbolRef } from "./TastySymbolRef.js";
import type { TastyTypeParameter } from "./TastyTypeParameter.js";
export type TastyInterfaceSymbol = {
    id: string;
    name: string;
    library: string;
    description?: string;
    descriptionRaw?: string;
    jsdoc?: TastyJsDoc;
    typeParameters?: Array<TastyTypeParameter>;
    members: Array<TastyMember>;
    extends: Array<TastySymbolRef>;
    types: Array<TastySymbolRef>;
};
