/**
 * Vendored atlas declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/atlas/js/generated/Component.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-atlas-dts.mjs
 */

import type { ComponentInterface } from "./ComponentInterface.js";
import type { ComponentProp } from "./ComponentProp.js";
import type { Usage } from "./Usage.js";
export type Component = {
    name: string;
    interface: ComponentInterface | null;
    source: string;
    count: number;
    props: Array<ComponentProp>;
    usage: Usage;
    examples: Array<string>;
    usedWith: {
        [key in string]: Usage;
    };
};
