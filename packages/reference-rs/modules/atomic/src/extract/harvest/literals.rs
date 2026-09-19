//! Harvest pool collection: one visitor over each compile input AST.
//!
//! Collects `StringLiteral` and hole-free `TemplateLiteral` values,
//! classifies them rhythm-then-canon, and dedupes into the pool. Position is
//! irrelevant — an array member, a helper return, a const bag — and numbers
//! are never harvested (A4). Compile inputs only: the caller feeds the same
//! parsed programs the site walk reads, never `node_modules`.

use std::collections::{BTreeSet, HashMap};

use canon::ValueKind;
use oxc_ast::ast::{Program, StringLiteral, TemplateLiteral};
use oxc_ast_visit::{walk, Visit};
use oxc_parser::ParserReturn;

use super::classify::classify_harvest_value;

/// Deterministic kind order for minting: colors, lengths, transforms, math,
/// urls, then keywords. (`ValueKind` has no `Ord`, so the pool maps kinds
/// and mint walks this order instead of the map.)
pub const KIND_ORDER: [ValueKind; 6] = [
    ValueKind::Color,
    ValueKind::Length,
    ValueKind::Transform,
    ValueKind::Math,
    ValueKind::Url,
    ValueKind::Keyword,
];

/// Distinct harvested values by kind: the program's CSS-shaped information.
#[derive(Debug, Default)]
pub struct HarvestPool {
    kinds: HashMap<ValueKind, BTreeSet<Box<str>>>,
}

impl HarvestPool {
    /// Classify one source string into the pool; non-values are not
    /// information and never land. Stored trimmed, the complete value.
    pub(crate) fn insert(&mut self, value: &str) {
        if let Some(kind) = classify_harvest_value(value) {
            let text = value.trim();
            self.kinds.entry(kind).or_default().insert(text.into());
        }
    }

    /// Merge another pool (one per compile input) into this one.
    fn merge(&mut self, other: HarvestPool) {
        for (kind, values) in other.kinds {
            self.kinds.entry(kind).or_default().extend(values);
        }
    }

    /// The distinct harvested values of one kind, sorted, if any.
    pub fn values(&self, kind: ValueKind) -> Option<&BTreeSet<Box<str>>> {
        self.kinds.get(&kind)
    }

    /// True when no compile input held a harvestable value.
    pub fn is_empty(&self) -> bool {
        self.kinds.values().all(BTreeSet::is_empty)
    }
}

/// Collect the harvest pool over every successfully parsed compile input.
/// Panicked programs have no AST and contribute nothing, exactly as the
/// site walk skips them.
pub fn collect_pool(parsed: &[ParserReturn<'_>]) -> HarvestPool {
    let mut pool = HarvestPool::default();
    for ret in parsed.iter() {
        if ret.panicked {
            continue;
        }
        pool.merge(pool_for_program(&ret.program));
    }
    pool
}

/// Collect one program's pool with a single visitor.
fn pool_for_program(program: &Program<'_>) -> HarvestPool {
    let mut visitor = HarvestVisitor {
        pool: HarvestPool::default(),
    };
    visitor.visit_program(program);
    visitor.pool
}

/// AST visitor collecting harvestable string values into the pool.
struct HarvestVisitor {
    pool: HarvestPool,
}

impl<'a> Visit<'a> for HarvestVisitor {
    fn visit_string_literal(&mut self, lit: &StringLiteral<'a>) {
        self.pool.insert(lit.value.as_str());
        walk::walk_string_literal(self, lit);
    }

    fn visit_template_literal(&mut self, lit: &TemplateLiteral<'a>) {
        // Hole-free only: `` `red` `` is information, `` `2${n}r` `` is
        // arithmetic. Holes still walk, so literals inside them harvest.
        if lit.expressions.is_empty() {
            if let Some(text) = cooked_quasis(lit) {
                self.pool.insert(&text);
            }
        }
        walk::walk_template_literal(self, lit);
    }
}

/// Joined cooked quasi text, or None on an invalid escape.
fn cooked_quasis(lit: &TemplateLiteral<'_>) -> Option<String> {
    let mut out = String::new();
    for quasi in lit.quasis.iter() {
        out.push_str(quasi.value.cooked.as_ref()?.as_str());
    }
    Some(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    use oxc_allocator::Allocator;
    use oxc_parser::Parser;
    use oxc_span::SourceType;

    /// Collect the pool for one inline source string.
    fn pool_for_source(code: &str) -> HarvestPool {
        let allocator = Allocator::default();
        let source_type = SourceType::from_path(std::path::Path::new("t.ts"))
            .unwrap_or_default()
            .with_typescript(true);
        let parsed = Parser::new(&allocator, code, source_type).parse();
        assert!(!parsed.panicked);
        pool_for_program(&parsed.program)
    }

    /// The sorted values of one kind, for assertions.
    fn sorted(pool: &HarvestPool, kind: ValueKind) -> Vec<&str> {
        pool.values(kind)
            .map(|set| set.iter().map(Box::as_ref).collect())
            .unwrap_or_default()
    }

    #[test]
    fn strings_harvest_position_free_and_dedupe() {
        let pool = pool_for_source(
            r#"
            const palette = ['red', 'red'];
            const getColor = () => 'blue';
            const space = `4r`;
            export const x = 1;
            "#,
        );
        assert_eq!(sorted(&pool, ValueKind::Color), ["blue", "red"]);
        assert_eq!(sorted(&pool, ValueKind::Length), ["4r"]);
    }

    #[test]
    fn holes_tokens_and_numbers_never_harvest() {
        let pool = pool_for_source(
            r#"
            declare const n: number;
            const a = `2${n}r`;
            const b = 'gray.800';
            const c = 'sm';
            const d = 13;
            "#,
        );
        assert!(pool.is_empty());
    }

    #[test]
    fn whole_css_value_in_a_hole_harvests_the_inner_literal_not_the_join() {
        let pool = pool_for_source(
            r#"
            declare const n: number;
            declare const color: string;
            const branded = `brand ${'red'} tonight`;
            const wrap = `${'blue'}`;
            const hex = `${'#0af'}`;
            const partial = `${n}px`;
            const glue = n + 'px';
            const emptyWrap = `${color}`;
            "#,
        );
        assert_eq!(sorted(&pool, ValueKind::Color), ["#0af", "blue", "red"]);
        assert_eq!(sorted(&pool, ValueKind::Length), Vec::<&str>::new());
    }
}
