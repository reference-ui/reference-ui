//! TYP-TOKEN-01–06: category-relative unions plus the aggregate `Tokens` index.
//! Fixtures come from the catalog dump in the parent module. Unions are
//! lexicographic string literals; empty categories are covered by the parent
//! omit test, not here.

use super::{assert_alias, catalog_dts};

/// TYP-TOKEN-01 — ColorToken from nested color keys, category prefix stripped.
#[test]
fn typ_token_01_emits_color_token_union() {
    let dts = catalog_dts();
    assert!(!dts.is_empty(), "TYP-TOKEN-01: colors must not emit empty");
    assert_alias(&dts, "ColorToken", "'brand.primary' | 'n100' | 'n300'");
    assert!(
        !dts.contains("colors.n100"),
        "TYP-TOKEN-01: unions are category-relative"
    );
}

/// TYP-TOKEN-02 — SpacingToken keeps rhythm slash-fraction literals.
#[test]
fn typ_token_02_emits_spacing_and_rhythm_union() {
    assert_alias(
        &catalog_dts(),
        "SpacingToken",
        "'1' | '1/2r' | '1r' | '2' | '2r' | '4'",
    );
}

/// TYP-TOKEN-03 — RadiusToken quotes every declared radii key, including none.
#[test]
fn typ_token_03_emits_radius_token_union() {
    assert_alias(
        &catalog_dts(),
        "RadiusToken",
        "'full' | 'lg' | 'md' | 'none' | 'sm'",
    );
}

/// TYP-TOKEN-04 — discrete typography unions from fontSizes / fontWeights / lineHeights.
#[test]
fn typ_token_04_emits_typography_token_unions() {
    let dts = catalog_dts();
    assert_alias(&dts, "FontSizeToken", "'base' | 'lg' | 'sm' | 'xs'");
    assert_alias(&dts, "FontWeightToken", "'bold' | 'medium' | 'regular'");
    assert_alias(&dts, "LineHeightToken", "'normal' | 'tight'");
}

/// TYP-TOKEN-05 — ShadowToken and ZIndexToken are keys, not CSS values.
#[test]
fn typ_token_05_emits_shadow_and_z_index_unions() {
    let dts = catalog_dts();
    assert_alias(&dts, "ShadowToken", "'md' | 'overlay' | 'sm'");
    assert_alias(&dts, "ZIndexToken", "'modal' | 'toast' | 'tooltip'");
    assert!(
        !dts.contains("0 1px 2px"),
        "TYP-TOKEN-05: must not leak box-shadow values"
    );
}

/// TYP-TOKEN-06 — Tokens indexes dump category names onto the unions.
#[test]
fn typ_token_06_emits_aggregate_tokens_interface() {
    let dts = catalog_dts();
    assert!(
        dts.contains("export interface Tokens {"),
        "TYP-TOKEN-06: missing Tokens interface in:\n{dts}"
    );
    for field in [
        "colors: ColorToken;",
        "spacing: SpacingToken;",
        "radii: RadiusToken;",
        "fontSizes: FontSizeToken;",
        "fontWeights: FontWeightToken;",
        "lineHeights: LineHeightToken;",
        "shadows: ShadowToken;",
        "zIndex: ZIndexToken;",
    ] {
        assert!(dts.contains(field), "TYP-TOKEN-06: missing `{field}`");
    }
}
