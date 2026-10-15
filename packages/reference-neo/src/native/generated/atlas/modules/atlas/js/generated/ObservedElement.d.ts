/**
 * Vendored atlas declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/atlas/js/generated/ObservedElement.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-atlas-dts.mjs
 */

import type { ComponentProp } from "./ComponentProp.js";
import type { Usage } from "./Usage.js";
/**
 * One configured element (for example a library primitive) counted at its JSX call sites.
 * Unlike a `Component` it has no declared interface, so `props` lists the props actually passed.
 */
export type ObservedElement = {
    name: string;
    source: string;
    count: number;
    usage: Usage;
    examples: Array<string>;
    filePresence: number;
    props: Array<ComponentProp>;
    usedWith: {
        [key in string]: Usage;
    };
};
