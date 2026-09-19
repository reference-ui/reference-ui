//! Block-position targets: identifiers and members that name a style object.
//! A bare identifier answers its recorded const object and a single-hop
//! member answers the nested entries one hop down; deeper paths are not
//! block shapes at all (SPEC-V2-31). Callers lower a hit exactly as if
//! spread, check mutation on a miss, and refuse anything else generically.

use oxc_ast::ast::Expression;

use crate::extract::constants::ConstObject;
use crate::extract::scope::Scoped;

/// Resolution of an identifier or single-hop member in a block position
/// (`css()` arg, JSX style prop) against recorded const objects.
pub enum BlockLookup<'a> {
    /// Not an identifier or member shape — the caller refuses generically.
    NotBlock,
    /// Resolved to a const object; the caller lowers it under this name.
    Hit(String, &'a ConstObject),
    /// Shape matched but nothing resolved; the caller checks mutation,
    /// then refuses. Carries the base name for the stale check.
    Miss(String),
}

/// Resolve an identifier or `base.prop` member to its const object: a bare
/// identifier answers its recorded object, a member answers the nested
/// entries one hop down. Deeper paths stay unresolved for SPEC-V2-31.
pub fn resolve_block_target<'a>(scopes: Scoped<'a>, expr: &Expression<'_>) -> BlockLookup<'a> {
    match expr {
        Expression::Identifier(ident) => {
            // css(styles)
            resolve_named_object(scopes, ident.name.as_str())
        }
        Expression::StaticMemberExpression(mem) => {
            // css(theme.colors)
            resolve_member_target(scopes, mem)
        }
        _ => BlockLookup::NotBlock,
    }
}

/// Resolve a bare identifier to its recorded const object, or miss.
fn resolve_named_object<'a>(scopes: Scoped<'a>, name: &str) -> BlockLookup<'a> {
    match scopes.object(name) {
        Some(obj) => BlockLookup::Hit(name.to_string(), obj),
        None => BlockLookup::Miss(name.to_string()),
    }
}

/// Resolve a single-hop member to its nested entries, or miss. Deeper
/// bases are not block shapes at all.
fn resolve_member_target<'a>(
    scopes: Scoped<'a>,
    mem: &oxc_ast::ast::StaticMemberExpression<'_>,
) -> BlockLookup<'a> {
    let Expression::Identifier(base) = &mem.object else {
        return BlockLookup::NotBlock;
    };
    let base_name = base.name.as_str();
    let prop_name = mem.property.name.as_str();
    match scopes.member_object(base_name, prop_name) {
        Some(obj) => BlockLookup::Hit(format!("{base_name}.{prop_name}"), obj),
        None => BlockLookup::Miss(base_name.to_string()),
    }
}
