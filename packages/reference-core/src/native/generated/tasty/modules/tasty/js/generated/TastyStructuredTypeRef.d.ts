/**
 * Vendored tasty declaration file, mechanically copied from the reference-rs dist output.
 * It carries the exact upstream bytes with explicit NodeNext specifiers, so neo typechecks without touching reference-rs.
 * Do not edit this copy; regenerate it with the vendor tool after an RS rebuild.
 * @generated from @reference-ui/rust@0.0.42 dist/modules/tasty/js/generated/TastyStructuredTypeRef.d.ts
 * Regen: cd packages/reference-neo && node tools/vendor-rust-tasty-dts.mjs
 */

import type { TastyFnParam } from "./TastyFnParam.js";
import type { TastyMappedModifierKind } from "./TastyMappedModifierKind.js";
import type { TastyMember } from "./TastyMember.js";
import type { TastyTemplateLiteralPart } from "./TastyTemplateLiteralPart.js";
import type { TastyTupleElement } from "./TastyTupleElement.js";
import type { TastyTypeOperatorKind } from "./TastyTypeOperatorKind.js";
import type { TastyTypeParameter } from "./TastyTypeParameter.js";
import type { TastyTypeRef } from "./TastyTypeRef.js";
export type TastyStructuredTypeRef = {
    "kind": "intrinsic";
    name: string;
} | {
    "kind": "literal";
    value: string;
} | {
    "kind": "object";
    members: Array<TastyMember>;
} | {
    "kind": "union";
    types: Array<TastyTypeRef>;
} | {
    "kind": "array";
    element: TastyTypeRef;
} | {
    "kind": "tuple";
    elements: Array<TastyTupleElement>;
} | {
    "kind": "intersection";
    types: Array<TastyTypeRef>;
} | {
    "kind": "indexed_access";
    object: TastyTypeRef;
    index: TastyTypeRef;
    resolved?: TastyTypeRef;
} | {
    "kind": "function";
    params: Array<TastyFnParam>;
    returnType: TastyTypeRef;
} | {
    "kind": "constructor";
    abstract: boolean;
    typeParameters?: Array<TastyTypeParameter>;
    params: Array<TastyFnParam>;
    returnType: TastyTypeRef;
} | {
    "kind": "type_operator";
    operator: TastyTypeOperatorKind;
    target: TastyTypeRef;
    resolved?: TastyTypeRef;
} | {
    "kind": "type_query";
    expression: string;
    resolved?: TastyTypeRef;
} | {
    "kind": "conditional";
    checkType: TastyTypeRef;
    extendsType: TastyTypeRef;
    trueType: TastyTypeRef;
    falseType: TastyTypeRef;
    resolved?: TastyTypeRef;
} | {
    "kind": "mapped";
    typeParam: string;
    sourceType: TastyTypeRef;
    nameType?: TastyTypeRef;
    optionalModifier: TastyMappedModifierKind;
    readonlyModifier: TastyMappedModifierKind;
    valueType: TastyTypeRef | null;
} | {
    "kind": "template_literal";
    parts: Array<TastyTemplateLiteralPart>;
    resolved?: TastyTypeRef;
} | {
    "kind": "raw";
    summary: string;
};
