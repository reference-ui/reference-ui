//! Optional-chain (`?.`) folding over known const objects (SPEC-V2-43/44).
//! A chain over a recorded base unwraps transparently: `tokens?.color`
//! folds exactly like `tokens.color`, and `t?.colors?.red` descends the
//! recorded nested entries link by link. Calls, computed members, and
//! private fields never fold here (the refuse pins and the SITE-48 element
//! work own those spellings); unresolvable bases yield nothing and the
//! walkers diagnose them exactly like any other dynamic leaf.

use oxc_ast::ast::{ChainElement, ChainExpression, Expression};

use crate::atom::AtomValue;
use crate::extract::constants::ConstObject;
use crate::extract::scope::Scoped;

/// Fold one optional chain over its base's recorded entries, if static.
pub fn fold_chain(chain: &ChainExpression<'_>, scoped: Scoped<'_>) -> Vec<AtomValue> {
    // color: tokens?.color  after  const tokens = { color: 'red' }
    let Some((base, links)) = chain_links(chain) else {
        return Vec::new();
    };
    let Some(map) = scoped.object(&base) else {
        return Vec::new();
    };
    descend_links(map, &links)
}

/// The dotted path a chain read, when its terminal entry kept leaves
/// beside a dropped dynamic arm (Ph4 residue channel). Mirrors the fold:
/// intermediate hops name nested maps, only the terminal can carry loss.
pub fn chain_residue_path(chain: &ChainExpression<'_>, scoped: Scoped<'_>) -> Option<String> {
    let (base, links) = chain_links(chain)?;
    let map = scoped.object(&base)?;
    descend_residue(map, &links)?;
    Some(format!("{base}.{}", links.join(".")))
}

/// The terminal entry of a link descent, when it carries residue and leaves.
fn descend_residue(map: &ConstObject, links: &[String]) -> Option<()> {
    let first = links.first()?;
    let prop = map.get(first)?;
    if links.len() == 1 {
        if prop.residue && !prop.leaves.is_empty() {
            return Some(());
        }
        return None;
    }
    if prop.nested.is_empty() {
        return None;
    }
    descend_residue(&prop.nested, &links[1..])
}

/// Follow static member links through recorded (nested) entries.
fn descend_links(map: &ConstObject, links: &[String]) -> Vec<AtomValue> {
    let Some(first) = links.first() else {
        return Vec::new();
    };
    let Some(prop) = map.get(first) else {
        return Vec::new();
    };
    if links.len() == 1 {
        // Final hop: the entry's leaves (an empty marker yields nothing).
        return prop.leaves.clone();
    }
    if prop.nested.is_empty() {
        return Vec::new();
    }
    descend_links(&prop.nested, &links[1..])
}

/// A chain's identifier base plus its static member links, outermost first.
fn chain_links(chain: &ChainExpression<'_>) -> Option<(String, Vec<String>)> {
    let mut links = Vec::new();
    let mut element = &chain.expression;
    loop {
        let object = chain_element_object(element, &mut links)?;
        match walk_object_links(object, &mut links)? {
            ObjectStep::Base(name) => {
                links.reverse();
                return Some((name, links));
            }
            ObjectStep::Chained(next) => element = next,
        }
    }
}

/// Where a chain's object spine ends: at an identifier base, or at a nested chain to keep walking.
enum ObjectStep<'a, 'e> {
    Base(String),
    Chained(&'e ChainElement<'a>),
}

/// The object one chain element reads from, recording its member link when it has one.
fn chain_element_object<'a, 'e>(
    element: &'e ChainElement<'a>,
    links: &mut Vec<String>,
) -> Option<&'e Expression<'a>> {
    match element {
        ChainElement::StaticMemberExpression(mem) => {
            // tokens?.color  — one transparent hop over a known base
            links.push(mem.property.name.to_string());
            Some(&mem.object)
        }
        // tokens?.color!  — `!` erases exactly like the plain member
        ChainElement::TSNonNullExpression(non_null) => Some(&non_null.expression),
        // getColor?.() refuses at the SITE-32 pins; sizes?.[k] folds at
        // SITE-48; private fields never appear in style positions.
        _ => None,
    }
}

/// Walk an object spine through bare members and transparent wrappers until its base or a nested
/// chain.
fn walk_object_links<'a, 'e>(
    object: &'e Expression<'a>,
    links: &mut Vec<String>,
) -> Option<ObjectStep<'a, 'e>> {
    match peel_wrappers(object) {
        Expression::Identifier(base) => Some(ObjectStep::Base(base.name.to_string())),
        Expression::ChainExpression(inner) => Some(ObjectStep::Chained(&inner.expression)),
        Expression::StaticMemberExpression(mem) => {
            // `t?.colors?.red` nests bare members under one wrapper.
            links.push(mem.property.name.to_string());
            walk_object_links(&mem.object, links)
        }
        _ => None,
    }
}

/// Peel every transparent TS wrapper the want walker unwraps through.
fn peel_wrappers<'a, 'b>(expr: &'b Expression<'a>) -> &'b Expression<'a> {
    use crate::extract::expressions::walk::unwrap_wrapper_target;
    let mut current = expr;
    while let Some(inner) = unwrap_wrapper_target(current) {
        current = inner;
    }
    current
}
