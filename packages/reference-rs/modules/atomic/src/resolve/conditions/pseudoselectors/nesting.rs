//! Two-level selector nesting for atomic utilities. Takes the current
//! selector (the escaped class, then each stacked result) plus one selector
//! template, and emits the nested selector. A comma-list template scopes
//! every member to the parent — a member without `&` becomes a descendant —
//! and substitution distributes over comma members on both sides. When the
//! parent member carries a top-level combinator and the template member
//! holds more than one `&`, each `&` substitutes `:is(parent)`; a single
//! `&` stays textual. When the parent ends in a pseudo-element and the
//! member appends compound material after `&`, the pseudo-element moves
//! past it (`:focus::before`, never `::before:focus`). Mirrors Panda v2
//! `replace_selector_parent` plus its pseudo-element-last ordering.

use super::{member_needs_is_wrap, split_selector_list, Action, SelectorQuoteState, SelectorScan};

/// Nest `template` under `parent`, distributing over comma members.
///
/// The cartesian product runs parent-major so stacked comma parents keep
/// author order. A template member without a code `&` scopes as a
/// descendant (`{parent} {member}`); otherwise every `&` substitutes the
/// parent member, armoured with `:is()` when it carries a combinator and
/// the member repeats `&`.
pub fn nest(parent: &str, template: &str) -> String {
    if !parent.contains(',') && !template.contains(',') {
        return nest_single(parent.trim(), template.trim());
    }
    nest_list(parent, template)
}

/// Nest when neither side can hold a top-level comma: both sides are one
/// trimmed member, so the cartesian product is one member, no join.
fn nest_single(parent: &str, member: &str) -> String {
    if parent.is_empty() || member.is_empty() {
        return String::new();
    }
    let mut out = String::with_capacity(member.len() + parent.len() * 2 + 2);
    nest_member_into(parent, member, &mut out);
    out
}

/// Nest comma-carrying sides: split as before, push members directly.
fn nest_list(parent: &str, template: &str) -> String {
    let parents = split_selector_list(parent);
    let members = split_selector_list(template);
    let pairs = parents.len() * members.len();
    if pairs == 0 {
        return String::new();
    }
    let mut out = String::with_capacity((parent.len() + template.len()) * pairs + pairs * 2);
    for (parent_idx, parent_member) in parents.iter().enumerate() {
        for (member_idx, member) in members.iter().enumerate() {
            if parent_idx > 0 || member_idx > 0 {
                out.push_str(", ");
            }
            nest_member_into(parent_member, member, &mut out);
        }
    }
    out
}

fn nest_member_into(parent: &str, member: &str, out: &mut String) {
    if !contains_code_ampersand(member) {
        out.push_str(parent);
        out.push(' ');
        out.push_str(member);
        return;
    }
    if reorder_pseudo_element_into(parent, member, out) {
        return;
    }
    let wrapped = substitution_needs_wrap(parent, member);
    substitute_into(member, parent, wrapped, out);
}

/// Reorder a pseudo-class appended under a pseudo-element parent.
///
/// When `parent` ends in a `::pseudo-element` and `member` holds exactly one
/// `&`, the member's suffix after `&` joins the parent's last compound.
/// Substituting the bare parent would strand the pseudo-element mid-compound
/// (`.c::before:focus`, which never matches), so the suffix splices onto the
/// parent base and the pseudo-element moves past it (`.c:focus::before`). A
/// suffix starting at a combinator inserts at offset zero — the textual
/// result — so descendant and sibling members keep their own compound.
/// Anything else returns false and substitutes textually.
///
/// The `::` gate is a necessary condition: without those bytes the trailing
/// scan cannot find a pair, so the slow check is skipped, never weakened.
fn reorder_pseudo_element_into(parent: &str, member: &str, out: &mut String) -> bool {
    if !parent.contains("::") {
        return false;
    }
    let Some((base, pseudo)) = split_trailing_pseudo_element(parent) else {
        return false;
    };
    let Some(amp) = single_code_ampersand(member) else {
        return false;
    };
    let suffix = &member[amp + 1..];
    let end = compound_end(suffix);
    out.push_str(&member[..amp]);
    out.push_str(base);
    out.push_str(&suffix[..end]);
    out.push_str(pseudo);
    out.push_str(&suffix[end..]);
    true
}

/// Split a trailing `::name` off a complex selector, if it ends in one.
///
/// The `::` must sit outside strings at group depth zero, and the tail after
/// it must be a bare name to the end — a combinator or pseudo-class tail
/// means the pseudo-element is not trailing. Only the double-colon form
/// counts, matching Panda's `is_pseudo_element`.
fn split_trailing_pseudo_element(parent: &str) -> Option<(&str, &str)> {
    let start = trailing_pseudo_start(parent)?;
    if !is_bare_pseudo_tail(&parent[start + 2..]) {
        return None;
    }
    let base = parent[..start].trim_end();
    if base.is_empty() {
        return None;
    }
    Some((base, parent[start..].trim_end()))
}

/// Byte index of the last depth-zero `::` outside strings, if any.
fn trailing_pseudo_start(parent: &str) -> Option<usize> {
    let mut scan = SelectorScan::new();
    let mut found = None;
    let mut prev_colon = None;
    for (idx, ch) in parent.char_indices() {
        let code = scan.step_code(ch);
        let is_colon = code && scan.top_level() && ch == ':';
        let pair_start = if is_colon { prev_colon } else { None };
        if let Some(start) = pair_start {
            if start_is_uncoloned(parent, start) {
                found = Some(start);
            }
        }
        prev_colon = is_colon.then_some(idx);
    }
    found
}

/// True when the byte before `start` is not a colon, so `:::` never peels.
fn start_is_uncoloned(parent: &str, start: usize) -> bool {
    start == 0 || parent.as_bytes()[start - 1] != b':'
}

/// True when `tail` is a bare pseudo-element name to the end of the member.
fn is_bare_pseudo_tail(tail: &str) -> bool {
    let tail = tail.trim();
    !tail.is_empty()
        && tail
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || ch == '-' || ch == '_')
}

/// Byte index of the `&` when a member holds exactly one outside strings.
fn single_code_ampersand(member: &str) -> Option<usize> {
    let mut state = SelectorQuoteState::default();
    let mut found = None;
    for (idx, ch) in member.char_indices() {
        if matches!(state.step(ch), Action::Substitute) {
            if found.is_some() {
                return None;
            }
            found = Some(idx);
        }
    }
    found
}

/// Byte offset in `suffix` where the spliced compound ends: the first comma
/// or combinator outside strings and groups, else the suffix length.
fn compound_end(suffix: &str) -> usize {
    let mut scan = SelectorScan::new();
    for (idx, ch) in suffix.char_indices() {
        let code = scan.step_code(ch);
        if !code || !scan.top_level() {
            continue;
        }
        if ch == ',' || ch == '>' || ch == '+' || ch == '~' || ch.is_whitespace() {
            return idx;
        }
    }
    suffix.len()
}

/// True when the substitution arms the parent with `:is()`.
fn substitution_needs_wrap(parent: &str, member: &str) -> bool {
    has_multiple_code_ampersands(member) && member_needs_is_wrap(parent)
}

fn contains_code_ampersand(member: &str) -> bool {
    let mut state = SelectorQuoteState::default();
    member
        .chars()
        .any(|ch| matches!(state.step(ch), Action::Substitute))
}

fn has_multiple_code_ampersands(member: &str) -> bool {
    let mut state = SelectorQuoteState::default();
    let mut seen = false;
    for ch in member.chars() {
        if matches!(state.step(ch), Action::Substitute) {
            if seen {
                return true;
            }
            seen = true;
        }
    }
    false
}

fn substitute_into(member: &str, parent: &str, wrapped: bool, out: &mut String) {
    let mut state = SelectorQuoteState::default();
    for ch in member.chars() {
        match state.step(ch) {
            Action::Keep => out.push(ch),
            Action::Substitute => {
                if wrapped {
                    out.push_str(":is(");
                    out.push_str(parent);
                    out.push(')');
                } else {
                    out.push_str(parent);
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
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
}
