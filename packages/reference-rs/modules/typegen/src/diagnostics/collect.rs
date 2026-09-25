//! Collector walking a lowered system plus printer options for every printable skip.
//! Mirrors the printer guards one by one — unknown token categories, unprintable
//! recipes, invalid compound rows, skipped strict names, weightless font families —
//! so `emit_dts_detailed` reports exactly what `emit_dts` omits. Rows sort by code
//! and message and dedupe, keeping station goldens and repro assertions deterministic.

use std::collections::{BTreeMap, BTreeSet};

use base_system::BaseSystem;

use super::{
    absent_strict_category, duplicate_recipe_stem, empty_font_family, empty_recipe,
    empty_recipe_axis, invalid_compound_variant, invalid_recipe_name, unknown_strict_category,
    unknown_token_category, Diagnostic, DiagnosticError,
};
use crate::emit::{strict, tokens, ts};
use crate::EmitOptions;

/// Walk `system` with `options` and report one warning per printer skip.
/// The printers stay pure; this is the only place skip vocabulary is minted.
pub(crate) fn collect_diagnostics(
    system: &BaseSystem,
    options: &EmitOptions,
) -> Vec<Diagnostic> {
    let mut out = Vec::new();
    collect_token_categories(system, &mut out);
    collect_recipes(system, &mut out);
    collect_strict(system, options, &mut out);
    collect_fonts(system, &mut out);
    normalize(&mut out);
    out
}

fn collect_token_categories(system: &BaseSystem, out: &mut Vec<Diagnostic>) {
    let mut unknown: BTreeMap<&str, usize> = BTreeMap::new();
    for (_, entry) in system.tokens.iter() {
        // Families print through FontRegistry, never a token union, so the
        // derived `fonts` index entries stay silent by design.
        if tokens::is_known_token_category(entry.category()) || entry.category() == "fonts" {
            continue;
        }
        *unknown.entry(entry.category()).or_default() += 1;
    }
    for (category, count) in unknown {
        push(out, unknown_token_category(category, count));
    }
}

fn collect_recipes(system: &BaseSystem, out: &mut Vec<Diagnostic>) {
    let mut seen_stems = BTreeSet::new();
    for (name, recipe) in system.list_recipes() {
        let stem = ts::to_pascal_case(name);
        if !ts::is_ts_ident(&stem) {
            push(out, invalid_recipe_name(name));
            continue;
        }
        if !is_printable_recipe(recipe) {
            // Claims no stem: the printer omits it for emptiness, reported below.
            collect_recipe_axes(name, recipe, out);
            collect_compound_rows(name, recipe, out);
            continue;
        }
        if !seen_stems.insert(stem.clone()) {
            push(out, duplicate_recipe_stem(name, &stem));
            continue;
        }
        collect_recipe_axes(name, recipe, out);
        collect_compound_rows(name, recipe, out);
    }
}

/// True when the recipe prints aliases: at least one axis carries values.
/// Mirrors the printer's `variant_props_body` gate, so only printed recipes
/// claim stems — an empty recipe never swallows a later printable twin.
fn is_printable_recipe(recipe: &base_system::RecipeDefinition) -> bool {
    recipe.variants.values().any(|values| !values.is_empty())
}

fn collect_recipe_axes(
    name: &str,
    recipe: &base_system::RecipeDefinition,
    out: &mut Vec<Diagnostic>,
) {
    let printable = recipe.variants.values().any(|values| !values.is_empty());
    if !printable {
        push(out, empty_recipe(name));
        return;
    }
    for (axis, values) in &recipe.variants {
        if values.is_empty() {
            push(out, empty_recipe_axis(name, axis));
        }
    }
}

fn collect_compound_rows(
    name: &str,
    recipe: &base_system::RecipeDefinition,
    out: &mut Vec<Diagnostic>,
) {
    for (index, row) in recipe.compound_variants.iter().enumerate() {
        let Some((axis, value)) = first_unknown_when(recipe, row) else {
            continue;
        };
        push(
            out,
            invalid_compound_variant(name, index + 1, axis, value),
        );
    }
}

fn first_unknown_when<'row>(
    recipe: &base_system::RecipeDefinition,
    row: &'row base_system::CompoundVariant,
) -> Option<(&'row str, &'row str)> {
    row.when.iter().find_map(|(axis, value)| {
        let known = recipe
            .variants
            .get(axis)
            .is_some_and(|values| values.contains_key(value));
        (!known).then(|| (axis.as_str(), value.as_str()))
    })
}

fn collect_strict(system: &BaseSystem, options: &EmitOptions, out: &mut Vec<Diagnostic>) {
    for name in &options.strict {
        if !strict::is_known_strict_category(name) {
            push(out, unknown_strict_category(name));
        } else if !has_category(system, name) {
            push(out, absent_strict_category(name));
        }
    }
}

fn has_category(system: &BaseSystem, category: &str) -> bool {
    system
        .tokens
        .iter()
        .any(|(_, entry)| entry.category() == category)
}

fn collect_fonts(system: &BaseSystem, out: &mut Vec<Diagnostic>) {
    for (name, font) in system.fonts.iter() {
        if font.weights.is_empty() {
            push(out, empty_font_family(name));
        }
    }
}

/// Record one warning; construction is infallible in practice — the codes are
/// hardcoded-valid constants and no message is ever blank — so an unreachable
/// build failure drops the note rather than failing the emit.
fn push(out: &mut Vec<Diagnostic>, made: Result<Diagnostic, DiagnosticError>) {
    if let Ok(diagnostic) = made {
        out.push(diagnostic);
    }
}

fn normalize(diagnostics: &mut Vec<Diagnostic>) {
    diagnostics.sort_by(|left, right| {
        (left.code.as_str(), &left.message).cmp(&(right.code.as_str(), &right.message))
    });
    diagnostics.dedup_by(|next, prev| {
        next.code.as_str() == prev.code.as_str() && next.message == prev.message
    });
}
