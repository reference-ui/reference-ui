/**
 * Vendored atlas declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/diagnostics/js/render.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-atlas-dts.mjs
 */

/**
 * Deterministic code-frame renderer for human presentation of typed diagnostics.
 * Takes a validated diagnostic plus the source text it was recorded against and emits a rustc-grade
 * frame: a `severity[CODE]: subject` header, a `file:line:col` arrow, guttered source lines with caret
 * underlines, labeled notes, and `= help:` lines. Rendering mirrors the Rust template byte-for-byte —
 * the same diagnostic plus the same source yields the same text on both sides of napi — and anything
 * unresolvable (no file, no spans, dangling offsets) reports undefined so the caller falls back to a
 * one-liner instead of guessing. Columns count UTF-16 code units to match editor carets.
 */
import type { Diagnostic } from './generated/Diagnostic.js';
/**
 * Default cap for `renderBatch`: the first eight diagnostics get full frames while the rest stay
 * one-liners, so a pathological run with thousands of warnings still prints a screenful plus a tight list.
 */
export declare const MAX_FRAMES = 8;
/**
 * Render one diagnostic as a full code frame, or undefined when no frame is honest.
 * Needs the file plus at least one span (the primary span or a label), with every offset inside
 * `source` and on a character boundary; anything else falls back to `renderOneLine`.
 */
export declare function renderFrame(diagnostic: Diagnostic, source: string): string | undefined;
/**
 * Render a batch with capped frames: the first `maxFrames` frameable diagnostics get full frames
 * while the rest stay one-liners. Reads each presented file lazily through `sourceFor` and only
 * while frames remain; missing sources and unresolvable spans fall back to one-liners. Blocks join
 * with one newline.
 */
export declare function renderBatch(diagnostics: Diagnostic[], sourceFor: (path: string) => string | undefined, maxFrames?: number): string;
