/**
 * Vendored typegen declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/diagnostics/js/generated/ByteSpan.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-typegen-dts.mjs
 */

/**
 * Byte offsets into one source file: `start` inclusive, `end` exclusive, both in UTF-8 bytes.
 * Zero-width spans (`start == end`) point at one caret position, e.g. a parse error's label offset.
 */
export type ByteSpan = {
    /**
     * Inclusive start offset in UTF-8 bytes.
     */
    start: number;
    /**
     * Exclusive end offset in UTF-8 bytes, never below `start`.
     */
    end: number;
};
