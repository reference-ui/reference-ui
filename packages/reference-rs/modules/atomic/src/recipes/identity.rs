//! Recipe identity claims within one system: every recipe owns its class stem and authored className.
//! Takes spec and extracted recipes in order and emits those whose identity is free, refusing the rest
//! with `ATM-E-DUPLICATE-RECIPE`, once per distinct message at their call site. A stem is `card` for a
//! plain recipe or `card__root` for slot `root` of a slotted `card`. Slots of one call share its
//! className; a second call claiming that className, or a plain recipe named like a slot stem, is
//! refused. The first claimant wins.

use rustc_hash::FxHashMap;

use super::Recipe;
use crate::diagnostics::{Diagnostic, DiagnosticCode, DiagnosticLocation};

/// Keep every recipe whose stem and className are free; refuse the rest with a located diagnostic.
pub(crate) fn claim<'r>(
    recipes: impl IntoIterator<Item = &'r Recipe>,
    system: &str,
    diagnostics: &mut Vec<Diagnostic>,
) -> Vec<Recipe> {
    let mut claims = Claims::default();
    let mut kept = Vec::new();
    for recipe in recipes {
        if let Some(message) = claims.refusal(recipe, system) {
            claims.report(recipe, message, diagnostics);
            continue;
        }
        claims.take(recipe);
        kept.push(recipe.clone());
    }
    kept
}

/// Stems and authored classNames claimed so far, with the call site each className came from, and
/// the refusals already reported. Every slot of a refused call is refused at one call site, so the
/// reported list is what keeps a duplicate call to one diagnostic per distinct message.
#[derive(Default)]
struct Claims<'r> {
    stems: FxHashMap<&'r str, &'r Recipe>,
    names: FxHashMap<&'r str, &'r DiagnosticLocation>,
    reported: Vec<(String, &'r DiagnosticLocation)>,
}

impl<'r> Claims<'r> {
    /// Why this recipe cannot claim its identity, if it cannot.
    fn refusal(&self, recipe: &Recipe, system: &str) -> Option<String> {
        if let Some(first) = self.stems.get(recipe.class_name.as_str()) {
            return Some(stem_message(first, recipe, system));
        }
        let name = recipe.selection_name();
        match self.names.get(name) {
            Some(site) if **site != recipe.location => Some(duplicate_name(name, system)),
            _ => None,
        }
    }

    /// Push one refusal, unless the same message already went out at this call site.
    fn report(
        &mut self,
        recipe: &'r Recipe,
        message: String,
        diagnostics: &mut Vec<Diagnostic>,
    ) {
        let site = &recipe.location;
        if self
            .reported
            .iter()
            .any(|(text, at)| *text == message && *at == site)
        {
            return;
        }
        diagnostics.push(site.error(DiagnosticCode::DuplicateRecipe, message.clone()));
        self.reported.push((message, site));
    }

    fn take(&mut self, recipe: &'r Recipe) {
        self.stems.insert(recipe.class_name.as_str(), recipe);
        self.names.insert(recipe.selection_name(), &recipe.location);
    }
}

/// Two recipes on one stem: the classic duplicate when they share a className, else both named.
fn stem_message(first: &Recipe, second: &Recipe, system: &str) -> String {
    if first.selection_name() == second.selection_name() {
        return duplicate_name(second.selection_name(), system);
    }
    format!(
        "Recipe class stem '{}' within system '{}' is claimed by {} and {}",
        second.class_name,
        system,
        describe(first),
        describe(second)
    )
}

fn duplicate_name(name: &str, system: &str) -> String {
    format!("Duplicate recipe className '{name}' within system '{system}'")
}

fn describe(recipe: &Recipe) -> String {
    match &recipe.slot {
        Some(slot) => format!("slot '{}' of recipe '{}'", slot.name, slot.recipe),
        None => format!("recipe '{}'", recipe.class_name),
    }
}

#[cfg(test)]
mod tests {
    use indexmap::IndexMap;

    use super::*;
    use crate::recipes::{name, RecipeSlot};

    fn at(line: u32) -> DiagnosticLocation {
        DiagnosticLocation {
            file: Some("app.ts".to_string()),
            line: Some(line),
            column: Some(1),
            span: None,
        }
    }

    fn plain(class_name: &str, line: u32) -> Recipe {
        Recipe {
            class_name: class_name.to_string(),
            slot: None,
            base: vec![],
            variants: IndexMap::new(),
            default_variants: IndexMap::new(),
            compounds: vec![],
            location: at(line),
        }
    }

    fn slot(recipe: &str, slot: &str, line: u32) -> Recipe {
        Recipe {
            class_name: name::slot_class_name(recipe, slot),
            slot: Some(RecipeSlot {
                recipe: recipe.to_string(),
                name: slot.to_string(),
            }),
            ..plain(recipe, line)
        }
    }

    fn run(recipes: &[Recipe]) -> (Vec<String>, Vec<Diagnostic>) {
        let mut diagnostics = Vec::new();
        let kept = claim(recipes, "sys", &mut diagnostics);
        (
            kept.into_iter().map(|recipe| recipe.class_name).collect(),
            diagnostics,
        )
    }

    #[test]
    fn plain_duplicates_keep_the_classic_message() {
        let (kept, diags) = run(&[plain("card", 1), plain("card", 2)]);
        assert_eq!(kept, vec!["card"]);
        assert_eq!(diags.len(), 1);
        assert_eq!(diags[0].code, DiagnosticCode::DuplicateRecipe);
        assert_eq!(
            diags[0].message,
            "Duplicate recipe className 'card' within system 'sys'"
        );
        assert_eq!(diags[0].line, Some(2));
    }

    #[test]
    fn slots_of_one_call_share_their_class_name() {
        let (kept, diags) = run(&[slot("card", "root", 1), slot("card", "title", 1)]);
        assert_eq!(kept, vec!["card__root", "card__title"]);
        assert!(diags.is_empty());
    }

    #[test]
    fn a_plain_recipe_named_like_a_slot_is_refused() {
        let (kept, diags) = run(&[slot("card", "root", 1), plain("card__root", 2)]);
        assert_eq!(kept, vec!["card__root"]);
        assert_eq!(
            diags[0].message,
            "Recipe class stem 'card__root' within system 'sys' is claimed by slot 'root' of recipe 'card' and recipe 'card__root'"
        );
    }

    #[test]
    fn a_slot_named_like_a_plain_recipe_is_refused() {
        let (_, diags) = run(&[plain("card__root", 1), slot("card", "root", 2)]);
        assert_eq!(
            diags[0].message,
            "Recipe class stem 'card__root' within system 'sys' is claimed by recipe 'card__root' and slot 'root' of recipe 'card'"
        );
    }

    #[test]
    fn plain_and_slotted_calls_share_no_class_name() {
        let (kept, diags) = run(&[plain("card", 1), slot("card", "root", 2)]);
        assert_eq!(kept, vec!["card"]);
        assert_eq!(
            diags[0].message,
            "Duplicate recipe className 'card' within system 'sys'"
        );
    }

    #[test]
    fn two_slotted_calls_with_one_class_name_are_duplicates() {
        let (_, diags) = run(&[slot("card", "root", 1), slot("card", "root", 2)]);
        assert_eq!(diags.len(), 1);
        assert_eq!(
            diags[0].message,
            "Duplicate recipe className 'card' within system 'sys'"
        );
    }

    #[test]
    fn a_duplicate_slotted_call_is_reported_once() {
        let (kept, diags) = run(&[
            slot("card", "root", 1),
            slot("card", "title", 1),
            slot("card", "body", 1),
            slot("card", "root", 2),
            slot("card", "title", 2),
            slot("card", "body", 2),
        ]);
        assert_eq!(kept, vec!["card__root", "card__title", "card__body"]);
        assert_eq!(diags.len(), 1, "{:?}", diags);
        assert_eq!(diags[0].code, DiagnosticCode::DuplicateRecipe);
        assert_eq!(
            diags[0].message,
            "Duplicate recipe className 'card' within system 'sys'"
        );
        assert_eq!(diags[0].line, Some(2));
    }

    #[test]
    fn a_stem_collision_keeps_one_message_per_refused_recipe() {
        let (kept, diags) = run(&[
            slot("card", "root", 1),
            slot("card", "title", 1),
            plain("card__root", 2),
            plain("card__title", 2),
        ]);
        assert_eq!(kept, vec!["card__root", "card__title"]);
        let messages: Vec<&str> = diags.iter().map(|diag| diag.message.as_str()).collect();
        assert_eq!(
            messages,
            vec![
                "Recipe class stem 'card__root' within system 'sys' is claimed by slot 'root' of recipe 'card' and recipe 'card__root'",
                "Recipe class stem 'card__title' within system 'sys' is claimed by slot 'title' of recipe 'card' and recipe 'card__title'",
            ]
        );
    }
}
