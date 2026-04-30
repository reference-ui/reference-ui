use super::{
    apply_responsive_styles, replace_function_name, rewrite_css_imports, rewrite_cva_imports,
};

const VIRTUAL_PATH: &str = "src/virtualrs/example.tsx";

#[test]
fn rewrites_css_import_and_preserves_other_bindings() {
    let source = "import { css, Box } from '@reference-ui/react';\nconst x = css({});\n";

    let rewritten = rewrite_css_imports(source, VIRTUAL_PATH);

    assert_eq!(
        rewritten,
        "import { css } from 'src/system/runtime';\nimport { Box } from '@reference-ui/react';\n\nconst x = css({});\n"
    );
}

#[test]
fn rewrites_css_with_default_and_aliased_named_imports() {
    let source =
        "import React, { css, Box as Card } from '@reference-ui/react';\nexport { React, Card };\n";

    let rewritten = rewrite_css_imports(source, VIRTUAL_PATH);

    assert_eq!(
        rewritten,
        "import { css } from 'src/system/runtime';\nimport React, { Box as Card } from '@reference-ui/react';\n\nexport { React, Card };\n"
    );
}

#[test]
fn rewrites_aliased_css_import_to_canonical_css_call() {
    let source =
        "import { css as sx, Box } from '@reference-ui/react';\nconst x = sx({});\n";

    let rewritten = rewrite_css_imports(source, VIRTUAL_PATH);

    assert_eq!(
        rewritten,
        "import { css } from 'src/system/runtime';\nimport { Box } from '@reference-ui/react';\n\nconst x = css({});\n"
    );
}

#[test]
fn replaces_direct_function_calls_without_touching_member_calls_or_refs() {
    let source = concat!(
        "const card = css({ color: 'red.500' });\n",
        "const keepRef = css;\n",
        "const nested = theme.css({ color: 'blue.500' });\n",
    );

    let rewritten = replace_function_name(source, VIRTUAL_PATH, "css", "__reference_ui_css", None);

    assert_eq!(
        rewritten,
        concat!(
            "const card = __reference_ui_css({ color: 'red.500' });\n",
            "const keepRef = css;\n",
            "const nested = theme.css({ color: 'blue.500' });\n",
        )
    );
}

#[test]
fn replaces_multiple_direct_calls_in_one_file() {
    let source = concat!(
        "const button = cva({});\n",
        "const card = cva({ base: { color: 'red.500' } });\n",
    );

    let rewritten = replace_function_name(source, VIRTUAL_PATH, "cva", "__reference_ui_cva", None);

    assert_eq!(
        rewritten,
        concat!(
            "const button = __reference_ui_cva({});\n",
            "const card = __reference_ui_cva({ base: { color: 'red.500' } });\n",
        )
    );
}

#[test]
fn replaces_matching_import_binding_and_direct_calls_when_import_from_is_provided() {
    let source = concat!(
        "import { css, cva } from 'src/system/css';\n",
        "const card = css({ color: 'red.500' });\n",
        "const keep_ref = css;\n",
        "const button = cva({});\n",
    );

    let rewritten = replace_function_name(
        source,
        VIRTUAL_PATH,
        "css",
        "__reference_ui_css",
        Some("src/system/css"),
    );

    assert_eq!(
        rewritten,
        concat!(
            "import { css, cva } from 'src/system/css';\n",
            "const __reference_ui_css = css;\n",
            "const card = __reference_ui_css({ color: 'red.500' });\n",
            "const keep_ref = css;\n",
            "const button = cva({});\n",
        )
    );
}

#[test]
fn leaves_calls_unchanged_when_import_from_does_not_match() {
    let source = concat!(
        "import { css } from '@reference-ui/react';\n",
        "const card = css({ color: 'red.500' });\n",
    );

    let rewritten = replace_function_name(
        source,
        VIRTUAL_PATH,
        "css",
        "__reference_ui_css",
        Some("src/system/css"),
    );

    assert_eq!(
        rewritten,
        concat!(
            "import { css } from '@reference-ui/react';\n",
            "const card = css({ color: 'red.500' });\n",
        )
    );
}

#[test]
fn does_not_insert_alias_when_no_direct_calls_match_import_binding() {
    let source = concat!(
        "import { css } from 'src/system/css';\n",
        "const keep_ref = css;\n",
        "const nested = theme.css({ color: 'blue.500' });\n",
    );

    let rewritten = replace_function_name(
        source,
        VIRTUAL_PATH,
        "css",
        "__reference_ui_css",
        Some("src/system/css"),
    );

    assert_eq!(rewritten, source);
}

#[test]
fn ignores_type_only_imports_for_css_rewrite() {
    let source = "import type { css } from '@reference-ui/react';\nconst x = 1;\n";

    assert_eq!(rewrite_css_imports(source, VIRTUAL_PATH), source);
}

#[test]
fn rewrites_recipe_alias_to_cva_and_normalizes_calls() {
    let source =
        "import { recipe as buttonRecipe, Box } from '@reference-ui/react';\nconst x = buttonRecipe({});\n";

    let rewritten = rewrite_cva_imports(source, VIRTUAL_PATH);

    assert_eq!(
        rewritten,
        "import { cva } from 'src/system/css';\nimport { Box } from '@reference-ui/react';\n\nconst x = cva({});\n"
    );
}

#[test]
fn rewrites_aliased_cva_import_to_canonical_cva_call() {
    let source =
        "import { cva as buttonCva, Box } from '@reference-ui/react';\nconst x = buttonCva({});\n";

    let rewritten = rewrite_cva_imports(source, VIRTUAL_PATH);

    assert_eq!(
        rewritten,
        "import { cva } from 'src/system/css';\nimport { Box } from '@reference-ui/react';\n\nconst x = cva({});\n"
    );
}

#[test]
fn leaves_unrelated_imports_unchanged_for_cva_rewrite() {
    let source = "import { Box } from '@reference-ui/react';\nconst x = Box;\n";

    assert_eq!(rewrite_cva_imports(source, VIRTUAL_PATH), source);
}

#[test]
fn rewrites_only_the_first_matching_runtime_import() {
    let source = concat!(
        "import { recipe as cardRecipe } from '@reference-ui/react';\n",
        "import { recipe as buttonRecipe } from '@reference-ui/react';\n",
        "const card = cardRecipe({});\n",
        "const button = buttonRecipe({});\n",
    );

    let rewritten = rewrite_cva_imports(source, VIRTUAL_PATH);

    assert_eq!(
        rewritten,
        concat!(
            "import { cva } from 'src/system/css';\n",
            "\n",
            "import { recipe as buttonRecipe } from '@reference-ui/react';\n",
            "const card = cva({});\n",
            "const button = buttonRecipe({});\n",
        )
    );
}

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

    let rewritten = apply_responsive_styles(source, VIRTUAL_PATH);

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

    let rewritten = apply_responsive_styles(&rewrite_css_imports(source, VIRTUAL_PATH), VIRTUAL_PATH);

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

    let rewritten = apply_responsive_styles(&rewrite_cva_imports(source, VIRTUAL_PATH), VIRTUAL_PATH);

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

    let rewritten = apply_responsive_styles(source, VIRTUAL_PATH);

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

    assert_eq!(apply_responsive_styles(source, VIRTUAL_PATH), source);
}

#[test]
fn leaves_existing_container_rules_unchanged() {
    let source = concat!(
        "import { css } from 'src/system/runtime';\n",
        "const x = css({ '@container sidebar (min-width: 420px)': { padding: '3' } });\n",
    );

    assert_eq!(apply_responsive_styles(source, VIRTUAL_PATH), source);
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

    let rewritten = apply_responsive_styles(source, VIRTUAL_PATH);

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

    assert_eq!(apply_responsive_styles(source, VIRTUAL_PATH), source);
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

    let rewritten = apply_responsive_styles(source, VIRTUAL_PATH);

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
