/**
 * Vendored atlas declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/diagnostics/js/generated/Label.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-atlas-dts.mjs
 */

import type { ByteSpan } from "./ByteSpan.js";
/**
 * One labeled underline inside a rendered frame: the byte range plus the note beneath it.
 */
export type Label = {
    /**
     * The underlined byte range.
     */
    span: ByteSpan;
    /**
     * The note under the underline; non-blank like every diagnostic message.
     */
    message: string;
};
