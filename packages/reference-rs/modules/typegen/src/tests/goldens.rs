//! Committed `.d.ts` goldens for `emit_dts`. Equality is the contract; refresh
//! is opt-in via `TYPEGEN_UPDATE_GOLDENS=1`. The token catalog stays
//! token-only. `styles.d.ts` is StyleProps without dump fonts (`FontRegistry
//! {}` plus the FontProps string fallback) plus recursive SystemStyleObject.
//! `styles-fonts.d.ts` is the same StyleProps dump with populated FontRegistry
//! dump keys, not CSS numbers. `styles-strict.d.ts` is `emit_dts_with` for
//! `strict: ['colors', 'radii', 'spacing']`. Open goldens keep the hatch.

use super::{
    assert_matches_golden, catalog_dts, compound_dts, font_dts, font_style_dts, recipe_dts,
    style_dts, style_strict_dts,
};

/// Committed `tests/goldens/tokens.d.ts` matches `emit_dts` for the catalog dump.
#[test]
fn catalog_matches_committed_golden() {
    let actual = catalog_dts();
    assert!(
        !actual.contains("VariantProps")
            && !actual.contains("FontRegistry")
            && !actual.contains("StyleProps")
            && !actual.contains("StyleConditionKey")
            && !actual.contains("SystemStyleObject"),
        "token catalog golden must stay token-only:\n{actual}"
    );
    assert_matches_golden("tokens.d.ts", &actual);
}

/// Committed `tests/goldens/recipes.d.ts` matches `emit_dts` for the recipe dump.
#[test]
fn recipe_matches_committed_golden() {
    assert_matches_golden("recipes.d.ts", &recipe_dts());
}

/// Committed `tests/goldens/compound.d.ts` matches `emit_dts` for the compound dump.
#[test]
fn compound_matches_committed_golden() {
    assert_matches_golden("compound.d.ts", &compound_dts());
}

/// Committed `tests/goldens/fonts.d.ts` matches `emit_dts` for the font dump.
#[test]
fn font_matches_committed_golden() {
    assert_matches_golden("fonts.d.ts", &font_dts());
}

/// Committed `tests/goldens/styles.d.ts` matches `emit_dts` for the style dump.
#[test]
fn style_matches_committed_golden() {
    let actual = style_dts();
    assert!(
        actual.contains("export type StyleProps = FontProps & {")
            && actual.contains("export type SystemStyleObject = StyleProps & {"),
        "style golden must include StyleProps and SystemStyleObject:\n{actual}"
    );
    assert!(
        !actual.contains("'sans'") && actual.contains("export interface FontRegistry {}"),
        "style golden is the empty-font StyleProps dump:\n{actual}"
    );
    assert_matches_golden("styles.d.ts", &actual);
}

/// Committed `tests/goldens/styles-fonts.d.ts` matches StyleProps plus dump fonts.
#[test]
fn font_style_matches_committed_golden() {
    let actual = font_style_dts();
    assert!(
        actual.contains("export type StyleProps = FontProps & {")
            && actual.contains("'sans': { 'bold': true; 'normal': true }")
            && actual.contains("export type SystemStyleObject = StyleProps & {"),
        "font-style golden must include StyleProps, SystemStyleObject, and dump-key FontRegistry:\n{actual}"
    );
    assert!(
        !actual.contains("'700': true") && !actual.contains("'400': true"),
        "font-style golden must not use CSS weight numbers as FontProps keys:\n{actual}"
    );
    assert_matches_golden("styles-fonts.d.ts", &actual);
}

/// Committed `tests/goldens/styles-strict.d.ts` matches colors+radii+spacing wrappers.
#[test]
fn style_strict_matches_committed_golden() {
    let actual = style_strict_dts();
    assert!(
        actual.contains(
            "export type SystemStyleObject = StrictSpacingProps<StrictRadiiProps<StrictColorProps<BaseSystemStyleObject>>> & {"
        ),
        "strict golden must wrap BaseSystemStyleObject in declaration order:\n{actual}"
    );
    assert!(
        actual.contains("color?: StylePropValue<ColorToken | (string & {})>")
            && actual.contains("p?: StylePropValue<SpacingToken | (string & {})>"),
        "strict golden still prints the open hatch on StyleProps:\n{actual}"
    );
    assert_matches_golden("styles-strict.d.ts", &actual);
}
