//! Call-site extraction: `css()`, `recipe()`, aliases, and non-sites.
//!
//! Proves `css()` fills utility wants while `recipe()` fills Recipe IR
//! with correct layer order and no utility pollution, canon-locked
//! aliases extract while refused spellings stay silent, and unknown
//! helpers plus `css.raw` never become sites.

use super::compile_code;

#[test]
fn test_css_and_recipe_call_sites() {
    let res = compile_code(
        r#"
        import { css, recipe } from '@reference-ui/react';
        const c1 = css({ mt: '2r' });
        const c2 = css.object({ p: '1r' });
        const button = recipe({
            className: 'button',
            base: { color: 'white' },
            variants: {
                size: {
                    sm: { fontSize: '12px' },
                },
            },
        });
        button({ size: 'sm' });
        "#,
    );
    assert!(res
        .wants
        .iter()
        .any(|w| &*w.prop == "mt" && w.value.to_string() == "2r"));
    assert!(res
        .wants
        .iter()
        .any(|w| &*w.prop == "p" && w.value.to_string() == "1r"));
    assert!(!res
        .wants
        .iter()
        .any(|w| &*w.prop == "color" && w.value.to_string() == "white"));
    assert!(!res
        .wants
        .iter()
        .any(|w| &*w.prop == "fontSize" && w.value.to_string() == "12px"));
    assert_eq!(res.recipes.len(), 1);
    assert_eq!(res.recipes[0].class_name, "button");
    assert!(res.stylesheet.contains("@layer recipes {"));
    assert!(res.stylesheet.contains("button__base"));
    assert!(res.stylesheet.contains("color: white"));
    assert!(res.stylesheet.contains("button_s_sm"));
    assert!(res.stylesheet.contains("font-size: 12px"));
    assert!(res.stylesheet.contains("@layer utilities {"));
    assert!(res.stylesheet.contains(".\\@reference-ui\\/lib__mt_2r"));
    let recipes_at = res
        .stylesheet
        .find("@layer recipes {")
        .expect("recipes layer");
    let utilities_at = res
        .stylesheet
        .find("@layer utilities {")
        .expect("utilities layer");
    assert!(recipes_at < utilities_at);
    let utilities = &res.stylesheet[utilities_at..];
    assert!(!utilities.contains(".button"));
}

#[test]
fn test_css_raw_is_not_an_extract_site() {
    let res = compile_code(
        r#"
        import { css } from '@reference-ui/react';
        const leftover = css.raw({ p: '1r' });
        "#,
    );
    assert!(res.wants.is_empty());
}

#[test]
fn test_unknown_helpers_are_not_extract_sites() {
    let res = compile_code(
        r#"
        const alert = sva({
            slots: ['root', 'icon'],
            base: {
                root: { padding: '4r', borderRadius: 'md' },
                icon: { color: 'green' },
            },
        });
        "#,
    );
    assert!(res.wants.is_empty());
}

#[test]
fn test_locked_aliases_follow_canon() {
    let res = compile_code(
        r#"
        import { Div } from '@reference-ui/react';
        export const Comp = () => (
            <Div
                mt="10px"
                px="20px"
                w="100px"
                flexDir="column"
                rounded="md"
                c="red"
                pos="absolute"
                ps="15px"
                borderX="1px solid"
            />
        );
        "#,
    );
    // Locked aliases must extract as style props
    assert!(
        res.wants.iter().any(|w| &*w.prop == "mt"),
        "mt must extract"
    );
    assert!(
        res.wants.iter().any(|w| &*w.prop == "px"),
        "px must extract"
    );
    assert!(res.wants.iter().any(|w| &*w.prop == "w"), "w must extract");
    assert!(
        res.wants.iter().any(|w| &*w.prop == "flexDir"),
        "flexDir must extract"
    );

    // Refused aliases must NOT extract as style props
    assert!(
        !res.wants.iter().any(|w| &*w.prop == "rounded"),
        "rounded must NOT extract"
    );
    assert!(
        !res.wants.iter().any(|w| &*w.prop == "c"),
        "c must NOT extract"
    );
    assert!(
        !res.wants.iter().any(|w| &*w.prop == "pos"),
        "pos must NOT extract"
    );
    assert!(
        !res.wants.iter().any(|w| &*w.prop == "ps"),
        "ps must NOT extract"
    );
    assert!(
        !res.wants.iter().any(|w| &*w.prop == "borderX"),
        "borderX must NOT extract"
    );
}
