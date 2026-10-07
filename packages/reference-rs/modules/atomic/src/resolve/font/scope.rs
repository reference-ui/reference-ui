//! Family scoping for bare weight names: `weight="thin"` means the active family's thin.
//! Runs once per style root (JSX element, `css()` call, recipe block, global rule) over the wants
//! just pushed, rewriting bare keyword weights to `family.name` form when the root names exactly one
//! family. Explicit scopes, numerics, and unknown names pass through untouched, so the worst case
//! of a rewrite is the same keyword fallback the resolver applies today. Wants only: authored
//! plans stay bare because plan keys carry no family, so dynamic lookups keep keyword semantics.

use crate::atom::{AtomValue, Want};

use super::weight::CSS_WEIGHT_KEYWORDS;
use base_system::{GlobalDeclarationValue, GlobalStyleNode};

/// Props that select a family: the macro and its token-backed twin.
fn is_family_prop(prop: &str) -> bool {
    prop == "font" || prop == "fontFamily"
}

/// True for values that can name a family: `sans`, not stacks or the empty string.
pub(crate) fn is_family_key(value: &str) -> bool {
    // '"Inter", sans-serif' / '' / 'a b' never seed; 'sans' / 'mono' do
    !value.is_empty() && value.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_')
}

/// Scope one bare weight name against a family: `thin` + `sans` → `sans.thin`.
/// Only the six keyword names rewrite, so a miss downstream falls back to the
/// exact keyword value the bare name resolves to today.
pub(crate) fn scope_weight_name(value: &str, family: &str) -> Option<String> {
    if !is_family_key(family) || value.contains('.') {
        return None;
    }
    if !CSS_WEIGHT_KEYWORDS.iter().any(|(name, _)| *name == value) {
        return None;
    }
    Some(format!("{family}.{value}"))
}

/// Rewrite bare weights in one style root's wants against the root's family.
pub(crate) fn apply_to_wants(wants: &mut [Want]) {
    for index in 0..wants.len() {
        if wants[index].prop.as_ref() != "weight" {
            continue;
        }
        let AtomValue::String(value) = &wants[index].value else {
            continue;
        };
        let Some(scoped) = scoped_weight(wants, index, value) else {
            continue;
        };
        wants[index].value = AtomValue::String(scoped.into());
    }
}

/// The single family naming a global rule's declarations, if exactly one does.
pub(crate) fn block_family(node: &GlobalStyleNode) -> Option<&str> {
    single_seed(node.iter().map(|(key, val)| {
        let GlobalDeclarationValue::String(family) = val else {
            return None;
        };
        key_seed(key, family)
    }))
}

/// A family prop holding a plain key seeds; anything else contributes nothing.
fn key_seed<'v>(key: &str, family: &'v str) -> Option<&'v str> {
    if !is_family_prop(key) || !is_family_key(family) {
        return None;
    }
    Some(family)
}

/// Scope one scalar global declaration: bare `weight` against the block family.
pub(crate) fn scope_weight_decl(
    key: &str,
    val: &GlobalDeclarationValue,
    family: Option<&str>,
) -> Option<GlobalDeclarationValue> {
    if key != "weight" {
        return None;
    }
    let GlobalDeclarationValue::String(value) = val else {
        return None;
    };
    scope_weight_name(value, family?).map(GlobalDeclarationValue::String)
}

/// Scope one want's weight: same-`when` font wins, base font covers nested
/// conditions, and conflicting families decline to guess.
fn scoped_weight(wants: &[Want], index: usize, value: &str) -> Option<String> {
    let when = wants[index].when.as_slice();
    let seed = single_want_family(wants, when).or_else(|| {
        if when.is_empty() {
            None
        } else {
            single_want_family(wants, &[])
        }
    })?;
    scope_weight_name(value, seed)
}

/// The one family named under a `when` stack, or none when zero or two do.
fn single_want_family<'w>(wants: &'w [Want], when: &[Box<str>]) -> Option<&'w str> {
    single_seed(wants.iter().map(|want| {
        if want.when.as_slice() != when {
            return None;
        }
        let AtomValue::String(family) = &want.value else {
            return None;
        };
        key_seed(&want.prop, family)
    }))
}

/// Fold seed candidates into one family: first wins, repeats hold, conflict clears.
fn single_seed<'s>(candidates: impl Iterator<Item = Option<&'s str>>) -> Option<&'s str> {
    let mut found: Option<&'s str> = None;
    for candidate in candidates {
        let Some(family) = candidate else {
            continue;
        };
        if !fold_seed(&mut found, family) {
            return None;
        }
    }
    found
}

/// Fold one candidate into the seed. False on conflict: two families, no guess.
fn fold_seed<'s>(found: &mut Option<&'s str>, family: &'s str) -> bool {
    match *found {
        None => {
            *found = Some(family);
            true
        }
        Some(prior) => prior == family,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn want(prop: &str, value: &str, when: &[&str]) -> Want {
        Want::new(prop, AtomValue::String(value.into())).with_when(
            when.iter()
                .map(|w| Box::<str>::from(*w))
                .collect::<smallvec::SmallVec<[Box<str>; 2]>>(),
        )
    }

    fn weight_of(wants: &[Want]) -> &str {
        wants
            .iter()
            .find(|w| w.prop.as_ref() == "weight")
            .expect("weight want")
            .value
            .class_name_str()
    }

    #[test]
    fn bare_weight_scopes_to_sibling_font() {
        let mut wants = vec![want("font", "sans", &[]), want("weight", "thin", &[])];
        apply_to_wants(&mut wants);
        assert_eq!(weight_of(&wants), "sans.thin");
    }

    #[test]
    fn bare_weight_without_family_stays_bare() {
        let mut wants = vec![want("weight", "bold", &[])];
        apply_to_wants(&mut wants);
        assert_eq!(weight_of(&wants), "bold");
    }

    #[test]
    fn scoped_and_raw_weights_pass_through() {
        let mut wants = vec![
            want("font", "sans", &[]),
            want("weight", "sans.bold", &[]),
            want("weight", "393", &[]),
            want("weight", "extra-bold", &[]),
        ];
        apply_to_wants(&mut wants);
        let weights: Vec<&str> = wants
            .iter()
            .filter(|w| w.prop.as_ref() == "weight")
            .map(|w| w.value.class_name_str())
            .collect();
        assert_eq!(weights, vec!["sans.bold", "393", "extra-bold"]);
    }

    #[test]
    fn conflicting_families_decline_to_guess() {
        let mut wants = vec![
            want("font", "sans", &[]),
            want("font", "mono", &[]),
            want("weight", "thin", &[]),
        ];
        apply_to_wants(&mut wants);
        assert_eq!(weight_of(&wants), "thin");
    }

    #[test]
    fn font_family_seeds_and_stacks_do_not() {
        let mut seeded = vec![want("fontFamily", "serif", &[]), want("weight", "normal", &[])];
        apply_to_wants(&mut seeded);
        assert_eq!(weight_of(&seeded), "serif.normal");

        let mut stacked = vec![
            want("fontFamily", "\"Inter\", sans-serif", &[]),
            want("weight", "thin", &[]),
        ];
        apply_to_wants(&mut stacked);
        assert_eq!(weight_of(&stacked), "thin");
    }

    #[test]
    fn nested_weight_falls_back_to_base_font() {
        let mut wants = vec![
            want("font", "sans", &[]),
            want("weight", "thin", &["_hover"]),
        ];
        apply_to_wants(&mut wants);
        assert_eq!(weight_of(&wants), "sans.thin");
    }

    #[test]
    fn same_group_font_beats_base_font() {
        let mut wants = vec![
            want("font", "sans", &[]),
            want("font", "mono", &["_hover"]),
            want("weight", "thin", &["_hover"]),
        ];
        apply_to_wants(&mut wants);
        assert_eq!(weight_of(&wants), "mono.thin");
    }

    #[test]
    fn global_block_scopes_scalar_weight() {
        let mut node = GlobalStyleNode::new();
        node.insert("fontFamily".to_string(), GlobalDeclarationValue::String("sans".to_string()));
        node.insert("weight".to_string(), GlobalDeclarationValue::String("thin".to_string()));
        let family = block_family(&node);
        assert_eq!(family, Some("sans"));
        let scoped = scope_weight_decl(
            "weight",
            &GlobalDeclarationValue::String("thin".to_string()),
            family,
        );
        assert_eq!(scoped, Some(GlobalDeclarationValue::String("sans.thin".to_string())));
        assert_eq!(scope_weight_decl("color", &GlobalDeclarationValue::String("red".to_string()), family), None);
    }

    #[test]
    fn scope_weight_name_guards_its_inputs() {
        assert_eq!(scope_weight_name("thin", "sans"), Some("sans.thin".to_string()));
        assert_eq!(scope_weight_name("sans.thin", "sans"), None);
        assert_eq!(scope_weight_name("thin", "\"Inter\", sans-serif"), None);
        assert_eq!(scope_weight_name("thin", ""), None);
        assert_eq!(scope_weight_name("393", "sans"), None);
    }
}
