/**
 * Vendored atlas declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/atlas/js/generated/ComponentProp.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-atlas-dts.mjs
 */

import type { Usage } from "./Usage.js";
export type ComponentProp = {
    name: string;
    count: number;
    usage: Usage;
    values?: {
        [key in string]: Usage;
    };
};
