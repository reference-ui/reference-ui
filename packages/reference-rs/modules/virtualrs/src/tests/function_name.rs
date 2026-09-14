//! Test file.
//! This file provides coverage for the respective domain.
//! It inputs test cases and emits test results.

use super::VIRTUAL_PATH;
use crate::replace_function_name;

#[test]
fn replaces_direct_function_calls_without_touching_member_calls_or_refs() {
    let source = concat!(
        "const card = css({ color: 'red.500' });\n",
        "const keepRef = css;\n",
        "const nested = theme.css({ color: 'blue.500' });\n",
    );

    // Provide a default empty context or handle args properly based on current `replace_function_name`
    // Actually `replace_function_name` args were updated to use a struct later? No, currently 5 args.
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
