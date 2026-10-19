/** Single owner of the Material Symbols weight (400) behind the outline/filled exports.
 *  generate.mjs reads this declaration to pick the W{weight}/FillW{weight} icon modules,
 *  so a weight change is one edit here plus a rebuild. */
export const MATERIAL_SYMBOLS_ICON_WEIGHT = 400 as const
