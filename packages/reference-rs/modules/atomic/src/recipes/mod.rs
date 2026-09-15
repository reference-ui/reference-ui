//! Closed `recipe()` emit: IR, readable class names, and the runtime variant table.
//! Extract hands over style-object wants that must not enter the utility AtomSet.
//! This pass resolves those wants, stamps one class per base / variant / compound
//! leaf, and builds the JSON table runtime `recipe()` consumes. `sva` is refused.

pub mod name;
mod table;

use indexmap::IndexMap;
use serde::{Deserialize, Serialize};

use crate::atom::{Atom, Want};
use crate::resolve::{resolve_want_with, ResolveSession};

/// Extracted `recipe()` config. Style wants stay here, not on the utility list.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Recipe {
    pub name: String,
    pub class_name: String,
    pub base: Vec<Want>,
    pub variants: IndexMap<String, IndexMap<String, Vec<Want>>>,
    pub compounds: Vec<RecipeCompound>,
}

/// One `compoundVariants[]` entry: matching variant props plus a style object.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecipeCompound {
    pub props: IndexMap<String, String>,
    pub wants: Vec<Want>,
}

/// Resolved recipe ready to print and to serialize as a lookup table.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CompiledRecipe {
    pub table: RecipeTable,
    pub rules: Vec<RecipeRule>,
}

/// One closed class and the atoms that fill its declaration block.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RecipeRule {
    pub class_name: String,
    pub atoms: Vec<Atom>,
}

/// JSON variant table on `CompileResult`. Runtime looks up `combinations`.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeTable {
    pub name: String,
    pub class_name: String,
    pub variants: IndexMap<String, IndexMap<String, String>>,
    pub compound_variants: Vec<RecipeMatch>,
    pub combinations: Vec<RecipeMatch>,
}

/// Variant prop bag → class name (one leaf, one compound, or a joined permutation).
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecipeMatch {
    pub props: IndexMap<String, String>,
    pub class_name: String,
}

/// Resolve every recipe into closed classes and a lookup table.
pub fn compile(recipes: &[Recipe], session: &mut ResolveSession<'_>) -> Vec<CompiledRecipe> {
    recipes
        .iter()
        .map(|recipe| compile_one(recipe, session))
        .collect()
}

struct RecipeLower<'a, 'b> {
    stem: &'a str,
    rules: &'a mut Vec<RecipeRule>,
    session: &'a mut ResolveSession<'b>,
}

fn compile_one(recipe: &Recipe, session: &mut ResolveSession<'_>) -> CompiledRecipe {
    let mut rules = Vec::new();
    let (variant_classes, compounds) = {
        let mut lower = RecipeLower {
            stem: &recipe.class_name,
            rules: &mut rules,
            session,
        };
        push_rule(&mut lower, &recipe.class_name, &recipe.base);
        let variant_classes = compile_variants(&mut lower, &recipe.variants);
        let compounds = compile_compounds(&mut lower, &recipe.compounds);
        (variant_classes, compounds)
    };
    CompiledRecipe {
        table: table::build(
            &recipe.name,
            &recipe.class_name,
            &variant_classes,
            &compounds,
        ),
        rules,
    }
}

fn compile_variants(
    lower: &mut RecipeLower<'_, '_>,
    variants: &IndexMap<String, IndexMap<String, Vec<Want>>>,
) -> IndexMap<String, IndexMap<String, String>> {
    let mut variant_classes = IndexMap::new();
    for (key, items) in variants {
        variant_classes.insert(key.clone(), compile_variant_group(lower, key, items));
    }
    variant_classes
}

fn compile_compounds(
    lower: &mut RecipeLower<'_, '_>,
    compounds: &[RecipeCompound],
) -> Vec<RecipeMatch> {
    compounds
        .iter()
        .map(|compound| compile_compound(lower, compound))
        .collect()
}

fn compile_variant_group(
    lower: &mut RecipeLower<'_, '_>,
    key: &str,
    items: &IndexMap<String, Vec<Want>>,
) -> IndexMap<String, String> {
    let mut map = IndexMap::new();
    for (value, wants) in items {
        let class_name = name::variant_class(lower.stem, key, value);
        push_rule(lower, &class_name, wants);
        map.insert(value.clone(), class_name);
    }
    map
}

fn compile_compound(lower: &mut RecipeLower<'_, '_>, compound: &RecipeCompound) -> RecipeMatch {
    let class_name = name::compound_class(lower.stem, &compound.props);
    push_rule(lower, &class_name, &compound.wants);
    RecipeMatch {
        props: compound.props.clone(),
        class_name,
    }
}

fn push_rule(lower: &mut RecipeLower<'_, '_>, class_name: &str, wants: &[Want]) {
    let mut atoms = resolve_wants(wants, lower.session);
    if atoms.is_empty() {
        return;
    }
    atoms.sort_by(|a, b| {
        a.prop
            .cmp(&b.prop)
            .then_with(|| a.value.css_value_str().cmp(b.value.css_value_str()))
    });
    lower.rules.push(RecipeRule {
        class_name: class_name.to_string(),
        atoms,
    });
}

fn resolve_wants(wants: &[Want], session: &mut ResolveSession<'_>) -> Vec<Atom> {
    let mut atoms = Vec::new();
    for want in wants {
        atoms.extend(resolve_want_with(want, session));
    }
    atoms
}
