//! Test file.
//! This file provides coverage for the respective domain.
//! It inputs test cases and emits test results.

use super::{breakpoints, no_breakpoints, VIRTUAL_PATH};
use crate::{apply_responsive_styles, rewrite_css_imports, rewrite_cva_imports};

#[test]
fn lowers_responsive_css_styles() {
    let source = concat!(
        "import { css } from 'src/system/runtime';\n",
        "const x = css({\n",
        "  color: 'red.500',\n",
        "  r: {\n",
        "    320: { padding: '2' },\n",
        "    768: {\n",
        "      padding: '4',\n",
        "      '&:hover': { r: { 960: { color: 'blue.500' } } },\n",
        "    },\n",
        "  },\n",
        "});\n",
    );

    let rewritten = apply_responsive_styles(source, VIRTUAL_PATH, &no_breakpoints());

    assert_eq!(
        rewritten,
        concat!(
            "import { css } from 'src/system/runtime';\n",
            "const x = css({\n",
            "  color: 'red.500',\n",
            "  '@container (min-width: 320px)': { padding: '2' },\n",
            "  '@container (min-width: 768px)': {\n",
            "      padding: '4',\n",
            "      '&:hover': { '@container (min-width: 960px)': { color: 'blue.500' } },\n",
            "    },\n",
            "});\n",
        )
    );
}

#[test]
fn lowers_responsive_css_after_import_normalization() {
    let source = concat!(
        "import { css as sx } from '@reference-ui/react';\n",
        "const x = sx({ r: { 420: { padding: '3' } } } as unknown as CssStyles);\n",
    );

    let rewritten = apply_responsive_styles(&rewrite_css_imports(source, VIRTUAL_PATH), VIRTUAL_PATH, &no_breakpoints());

    assert_eq!(
        rewritten,
        concat!(
            "import { css } from 'src/system/runtime';\n",
            "\n",
            "const x = css({ '@container (min-width: 420px)': { padding: '3' } } as unknown as CssStyles);\n",
        )
    );
}

#[test]
fn lowers_responsive_cva_base_after_recipe_normalization() {
    let source = concat!(
        "import { recipe as cardRecipe } from '@reference-ui/react';\n",
        "const x = cardRecipe({ base: { r: { 480: { padding: '4' } } } });\n",
    );

    let rewritten = apply_responsive_styles(&rewrite_cva_imports(source, VIRTUAL_PATH), VIRTUAL_PATH, &no_breakpoints());

    assert_eq!(
        rewritten,
        concat!(
            "import { cva } from 'src/system/css';\n",
            "\n",
            "const x = cva({ base: { '@container (min-width: 480px)': { padding: '4' } } });\n",
        )
    );
}

#[test]
fn lowers_responsive_cva_variants_and_compound_variants() {
    let source = concat!(
        "import { cva } from 'src/system/runtime';\n",
        "const x = cva({\n",
        "  variants: {\n",
        "    size: {\n",
        "      md: { r: { 600: { padding: '5' } } },\n",
        "    },\n",
        "  },\n",
        "  compoundVariants: [\n",
        "    { size: 'md', css: { r: { 720: { marginTop: '2' } } } },\n",
        "  ],\n",
        "});\n",
    );

    let rewritten = apply_responsive_styles(source, VIRTUAL_PATH, &no_breakpoints());

    assert_eq!(
        rewritten,
        concat!(
            "import { cva } from 'src/system/runtime';\n",
            "const x = cva({\n",
            "  variants: {\n",
            "    size: {\n",
            "      md: { '@container (min-width: 600px)': { padding: '5' } },\n",
            "    },\n",
            "  },\n",
            "  compoundVariants: [\n",
            "    { size: 'md', css: { '@container (min-width: 720px)': { marginTop: '2' } } },\n",
            "  ],\n",
            "});\n",
        )
    );
}

#[test]
fn leaves_unrelated_r_objects_unchanged() {
    let source = concat!(
        "const x = { r: { 420: { padding: '3' } } };\n",
        "const y = cssVar({ r: { 560: { padding: '4' } } });\n",
    );

    assert_eq!(apply_responsive_styles(source, VIRTUAL_PATH, &no_breakpoints()), source);
}

#[test]
fn leaves_existing_container_rules_unchanged() {
    let source = concat!(
        "import { css } from 'src/system/runtime';\n",
        "const x = css({ '@container sidebar (min-width: 420px)': { padding: '3' } });\n",
    );

    assert_eq!(apply_responsive_styles(source, VIRTUAL_PATH, &no_breakpoints()), source);
}

#[test]
fn lowers_multiple_calls_in_one_file_and_preserves_untargeted_sections() {
    let source = concat!(
        "import { css, cva } from 'src/system/runtime';\n",
        "const card = css({\n",
        "  '@container (min-width: 640px)': { padding: '4' },\n",
        "  r: { 320: { padding: '2' } },\n",
        "});\n",
        "const button = cva({\n",
        "  base: { r: { 480: { gap: '3' } } },\n",
        "  defaultVariants: { r: 'keep-me', size: 'sm' },\n",
        "  compoundVariants: [{ size: 'sm', css: { r: { 720: { marginTop: '2' } } } }],\n",
        "});\n",
        "const config = { r: { 900: { padding: '9' } } };\n",
    );

    let rewritten = apply_responsive_styles(source, VIRTUAL_PATH, &no_breakpoints());

    assert_eq!(
        rewritten,
        concat!(
            "import { css, cva } from 'src/system/runtime';\n",
            "const card = css({\n",
            "  '@container (min-width: 640px)': { padding: '4' },\n",
            "  '@container (min-width: 320px)': { padding: '2' },\n",
            "});\n",
            "const button = cva({\n",
            "  base: { '@container (min-width: 480px)': { gap: '3' } },\n",
            "  defaultVariants: { r: 'keep-me', size: 'sm' },\n",
            "  compoundVariants: [{ size: 'sm', css: { '@container (min-width: 720px)': { marginTop: '2' } } }],\n",
            "});\n",
            "const config = { r: { 900: { padding: '9' } } };\n",
        )
    );
}

#[test]
fn leaves_dynamic_responsive_payloads_unchanged() {
    let source = concat!(
        "import { css } from 'src/system/runtime';\n",
        "const styles = css({ color: 'red.500', r: responsiveStyles });\n",
    );

    assert_eq!(apply_responsive_styles(source, VIRTUAL_PATH, &no_breakpoints()), source);
}

#[test]
fn lowers_cast_compound_variant_entries() {
    let source = concat!(
        "import { cva } from 'src/system/runtime';\n",
        "const button = cva({\n",
        "  compoundVariants: [\n",
        "    ({ size: 'md', css: { r: { 840: { padding: '6' } } } }) as const,\n",
        "  ],\n",
        "});\n",
    );

    let rewritten = apply_responsive_styles(source, VIRTUAL_PATH, &no_breakpoints());

    assert_eq!(
        rewritten,
        concat!(
            "import { cva } from 'src/system/runtime';\n",
            "const button = cva({\n",
            "  compoundVariants: [\n",
            "    ({ size: 'md', css: { '@container (min-width: 840px)': { padding: '6' } } }) as const,\n",
            "  ],\n",
            "});\n",
        )
    );
}

#[test]
fn lowers_named_breakpoint_keys_using_breakpoint_table() {
    let source = concat!(
        "import { css } from 'src/system/runtime';\n",
        "const x = css({ r: { md: { padding: '4' } } });\n",
    );

    let table = breakpoints(&[("sm", "640"), ("md", "768"), ("lg", "1024")]);
    let rewritten = apply_responsive_styles(source, VIRTUAL_PATH, &table);

    assert_eq!(
        rewritten,
        concat!(
            "import { css } from 'src/system/runtime';\n",
            "const x = css({ '@container (min-width: 768px)': { padding: '4' } });\n",
        )
    );
}

#[test]
fn lowers_mixed_named_and_numeric_breakpoint_keys() {
    let source = concat!(
        "import { css } from 'src/system/runtime';\n",
        "const x = css({\n",
        "  r: {\n",
        "    320: { padding: '2' },\n",
        "    md: { padding: '3' },\n",
        "    xl: { padding: '4' },\n",
        "  },\n",
        "});\n",
    );

    let table = breakpoints(&[("md", "768"), ("xl", "1280")]);
    let rewritten = apply_responsive_styles(source, VIRTUAL_PATH, &table);

    assert_eq!(
        rewritten,
        concat!(
            "import { css } from 'src/system/runtime';\n",
            "const x = css({\n",
            "  '@container (min-width: 320px)': { padding: '2' },\n",
            "  '@container (min-width: 768px)': { padding: '3' },\n",
            "  '@container (min-width: 1280px)': { padding: '4' },\n",
            "});\n",
        )
    );
}

#[test]
fn leaves_unknown_named_breakpoint_keys_unchanged() {
    let source = concat!(
        "import { css } from 'src/system/runtime';\n",
        "const x = css({ r: { md: { padding: '4' } } });\n",
    );

    // Empty table - `md` is unknown, transform should bail (leave source as-is).
    let rewritten = apply_responsive_styles(source, VIRTUAL_PATH, &no_breakpoints());

    assert_eq!(rewritten, source);
}

#[test]
fn lowers_named_breakpoint_keys_in_cva_variants() {
    let source = concat!(
        "import { cva } from 'src/system/runtime';\n",
        "const button = cva({\n",
        "  base: { r: { md: { padding: '3' } } },\n",
        "  variants: { size: { lg: { r: { xl: { padding: '5' } } } } },\n",
        "});\n",
    );

    let table = breakpoints(&[("md", "768"), ("xl", "1280")]);
    let rewritten = apply_responsive_styles(source, VIRTUAL_PATH, &table);

    assert_eq!(
        rewritten,
        concat!(
            "import { cva } from 'src/system/runtime';\n",
            "const button = cva({\n",
            "  base: { '@container (min-width: 768px)': { padding: '3' } },\n",
            "  variants: { size: { lg: { '@container (min-width: 1280px)': { padding: '5' } } } },\n",
            "});\n",
        )
    );
}