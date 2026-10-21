/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so core typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/callables.d.ts
 * Regen: cd packages/reference-core && node tools/vendor-rust-tasty-dts.mjs
 */

/**
 * Callable parameter extraction for tasty types.
 * Returns the name, described type, and optionality of each parameter, or an empty list when the type is not callable.
 */
import type { TastyTypeRef } from './api-types.js';
export declare function getTastyCallableParameters(type: TastyTypeRef | undefined): Array<{
    name: string;
    type?: string;
    optional?: boolean;
}>;
