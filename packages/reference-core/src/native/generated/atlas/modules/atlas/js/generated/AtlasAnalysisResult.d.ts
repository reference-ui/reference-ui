/**
 * Vendored atlas declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/atlas/js/generated/AtlasAnalysisResult.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-atlas-dts.mjs
 */

import type { Component } from "./Component.js";
import type { ObservedElement } from "./ObservedElement.js";
export type AtlasAnalysisResult = {
    components: Array<Component>;
    diagnostics: Array<import("../../../diagnostics/js/generated/Diagnostic.js").Diagnostic>;
    observed?: Array<ObservedElement>;
};
