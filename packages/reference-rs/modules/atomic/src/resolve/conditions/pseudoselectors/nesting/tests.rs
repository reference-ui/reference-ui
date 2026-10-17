//! Unit tests for two-level selector nesting: the fast and slow paths agree on trims and empties,
//! comma-list templates scope each member to the parent, multi-ampersand templates wrap a combinator
//! parent in `:is`, and pseudo-elements move past the compound that follows `&`. Each test calls `nest`
//! directly and compares the emitted selector string. Compiled only under `cfg(test)` as a child of `nesting`.

use super::*;

#[test]
fn fast_and_slow_paths_agree_on_trims_and_empties() {
    assert_eq!(nest("  .cls  ", "  &:hover  "), ".cls:hover");
    assert_eq!(nest("", "&:hover"), "");
    assert_eq!(nest(".cls", ""), "");
    assert_eq!(nest("   ", "   "), "");
    assert_eq!(nest(".a:is(.x, .y)", "&:hover"), ".a:is(.x, .y):hover");
    assert_eq!(
        nest(".cls", "&:is(:hover, [data-hover])"),
        ".cls:is(:hover, [data-hover])"
    );
}

#[test]
fn comma_member_without_ampersand_scopes_to_parent() {
    assert_eq!(
        nest(".cls", "&:not(:first-child), :only-child"),
        ".cls:not(:first-child), .cls :only-child"
    );
    assert_eq!(nest(".cls", "& .one, .two"), ".cls .one, .cls .two");
}

#[test]
fn stacked_template_distributes_over_parent_members() {
    assert_eq!(
        nest(".cls:not(:first-child), .cls :only-child", "& .left-border"),
        ".cls:not(:first-child) .left-border, .cls :only-child .left-border"
    );
}

#[test]
fn comma_lists_nest_parent_major() {
    assert_eq!(
        nest(".a, .b", "&:hover, &:active"),
        ".a:hover, .a:active, .b:hover, .b:active"
    );
}

#[test]
fn multi_ampersand_under_combinator_parent_uses_is() {
    assert_eq!(
        nest(".cls .divider", "& .bar & .baz"),
        ":is(.cls .divider) .bar :is(.cls .divider) .baz"
    );
    assert_eq!(
        nest(".cls > .row", "& + &"),
        ":is(.cls > .row) + :is(.cls > .row)"
    );
}

#[test]
fn single_ampersand_under_combinator_parent_stays_textual() {
    assert_eq!(nest(".cls > p", "&:hover"), ".cls > p:hover");
    assert_eq!(nest(".cls .divider", "& .kid"), ".cls .divider .kid");
}

#[test]
fn compound_parent_substitutes_textually() {
    assert_eq!(nest(".cls", "& + &"), ".cls + .cls");
    assert_eq!(nest(".cls", "&:hover"), ".cls:hover");
    assert_eq!(nest(".cls", "&"), ".cls");
}

#[test]
fn quoted_ampersand_is_literal() {
    assert_eq!(
        nest(".cls", "&[data-x=\"a & b\"]"),
        ".cls[data-x=\"a & b\"]"
    );
    assert_eq!(
        nest(".cls", "[data-x=\"a & b\"]"),
        ".cls [data-x=\"a & b\"]"
    );
}

#[test]
fn escaped_combinator_in_class_is_not_structure() {
    assert_eq!(
        nest(".\\[\\&_\\+_\\&\\]\\:c_red", "& + &"),
        ".\\[\\&_\\+_\\&\\]\\:c_red + .\\[\\&_\\+_\\&\\]\\:c_red"
    );
}

#[test]
fn pseudo_class_under_pseudo_element_reorders() {
    assert_eq!(nest(".cls::before", "&:focus"), ".cls:focus::before");
    assert_eq!(nest(".cls::after", "&:hover"), ".cls:hover::after");
}

#[test]
fn functional_pseudo_class_reorders_before_pseudo_element() {
    assert_eq!(
        nest(".cls::before", "&:is(:focus, [data-focus])"),
        ".cls:is(:focus, [data-focus])::before"
    );
}

#[test]
fn reorder_applies_at_every_stack_depth() {
    assert_eq!(
        nest(".cls:hover::before", "&:focus"),
        ".cls:hover:focus::before"
    );
    assert_eq!(
        nest(".cls::before, .cls::after", "&:focus"),
        ".cls:focus::before, .cls:focus::after"
    );
}

#[test]
fn reorder_scopes_to_the_trailing_compound() {
    assert_eq!(
        nest("[data-color-mode=dark] .cls::before", "&:focus"),
        "[data-color-mode=dark] .cls:focus::before"
    );
    assert_eq!(
        nest(".cls::before", "&:hover .kid"),
        ".cls:hover::before .kid"
    );
}

#[test]
fn combinator_members_keep_the_pseudo_element_compound() {
    assert_eq!(nest(".cls::before", "& .kid"), ".cls::before .kid");
    assert_eq!(nest(".cls::before", "& + .sib"), ".cls::before + .sib");
    assert_eq!(
        nest(".cls::before", "input:hover &"),
        "input:hover .cls::before"
    );
    assert_eq!(nest(".cls::before", "&"), ".cls::before");
}

#[test]
fn pseudo_element_inner_stays_textual() {
    assert_eq!(nest(".cls:hover", "&::before"), ".cls:hover::before");
    assert_eq!(nest(".cls", "&:focus::before"), ".cls:focus::before");
}

#[test]
fn multi_ampersand_under_pseudo_element_stays_textual() {
    assert_eq!(nest(".cls::before", "& + &"), ".cls::before + .cls::before");
}

#[test]
fn single_colon_before_is_not_a_pseudo_element() {
    assert_eq!(nest(".cls:before", "&:focus"), ".cls:before:focus");
}

#[test]
fn quoted_or_escaped_colons_are_not_pseudo_elements() {
    assert_eq!(
        nest(".cls[data-x=\"a::b\"]", "&:focus"),
        ".cls[data-x=\"a::b\"]:focus"
    );
    assert_eq!(
        nest(".hover\\:c_red::before", "&:focus"),
        ".hover\\:c_red:focus::before"
    );
}
