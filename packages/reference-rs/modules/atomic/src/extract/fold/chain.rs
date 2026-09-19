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
        let mut object = match element {
            ChainElement::StaticMemberExpression(mem) => {
                // tokens?.color  — one transparent hop over a known base
                links.push(mem.property.name.to_string());
                &mem.object
            }
            // tokens?.color!  — `!` erases exactly like the plain member
            ChainElement::TSNonNullExpression(non_null) => &non_null.expression,
            // getColor?.() refuses at the SITE-32 pins; sizes?.[k] folds at
            // SITE-48; private fields never appear in style positions.
            _ => return None,
        };
        loop {
            object = peel_wrappers(object);
            match object {
                Expression::Identifier(base) => {
                    links.reverse();
                    return Some((base.name.to_string(), links));
                }
                Expression::ChainExpression(inner) => {
                    element = &inner.expression;
                    break;
                }
                Expression::StaticMemberExpression(mem) => {
                    // `t?.colors?.red` nests bare members under one wrapper.
                    links.push(mem.property.name.to_string());
                    object = &mem.object;
                }
                _ => return None,
            }
        }
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
