//! Constant folding for template literals, shared by both extraction walkers.
//!
//! `fold_template` joins quasis with every `${…}` hole folded through the
//! table: literals, const-resolved identifiers and members, transparent
//! wrappers, branching forms that fan out, nested templates, and unary and
//! binary parts via their nodes. Each hole contributes its string leaves and the node
//! joins one string per combination, capped so an over-wide fan-out refuses
//! whole instead of emitting a partial set. Holes that do not fold become
//! located refusals naming the part, where v2's staged harness drops the
//! whole call silently.

use oxc_ast::ast::TemplateLiteral;
use oxc_span::Span;

use crate::extract::scope::Scoped;

mod holes;

use holes::fold_hole;

/// Fan-out ceiling: three binary ternaries still join; wider products refuse whole.
const MAX_TEMPLATE_COMBINATIONS: usize = 8;

/// Folded template strings plus one refusal per hole that did not fold.
#[derive(Default)]
pub struct TemplateFold {
    /// One joined string per hole-leaf combination; empty when a hole
    /// refused, a quasi is invalid, or the fan-out exceeded the cap.
    pub values: Vec<String>,
    /// One refusal per unfoldable hole, arm, or operand — diagnosed where
    /// they sit, never re-walked for a second opinion.
    pub refusals: Vec<TemplateRefusal>,
}

/// Why one hole — or the whole template — did not fold.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TemplateRefusal {
    span: Span,
    part: Option<usize>,
    detail: Box<str>,
}

impl TemplateRefusal {
    /// A refusal naming one `${…}` hole by its one-based index.
    fn hole(span: Span, part: usize, detail: impl Into<Box<str>>) -> Self {
        Self {
            span,
            part: Some(part),
            detail: detail.into(),
        }
    }

    /// A refusal against the whole template (bad quasi, over-cap fan-out).
    fn whole(span: Span, detail: impl Into<Box<str>>) -> Self {
        Self {
            span,
            part: None,
            detail: detail.into(),
        }
    }

    /// Re-index a nested refusal to the outer hole that carried it.
    fn repart(self, part: usize) -> Self {
        Self {
            span: self.span,
            part: Some(part),
            detail: self.detail,
        }
    }

    /// The offending node's span: the hole, or the template for whole refusals.
    pub fn span(&self) -> Span {
        self.span
    }

    /// The hole index (one-based) and reason phrase policy renders.
    pub fn parts(&self) -> (Option<usize>, &str) {
        (self.part, &self.detail)
    }
}

/// One hole's fold session: its number, its scope, the shared refusal sink.
struct HoleFold<'a, 'b> {
    part: usize,
    scoped: Scoped<'a>,
    fold: &'b mut TemplateFold,
}

impl HoleFold<'_, '_> {
    /// Record a refusal against this hole at the offending span.
    fn refuse(&mut self, span: Span, detail: impl Into<Box<str>>) {
        self.fold
            .refusals
            .push(TemplateRefusal::hole(span, self.part, detail));
    }
}

/// Fold one template literal over its holes' static leaves.
pub fn fold_template(lit: &TemplateLiteral<'_>, scoped: Scoped<'_>) -> TemplateFold {
    let mut fold = TemplateFold::default();
    let mut holes = Vec::with_capacity(lit.expressions.len());
    for (index, expr) in lit.expressions.iter().enumerate() {
        let mut hole = HoleFold {
            part: index + 1,
            scoped,
            fold: &mut fold,
        };
        holes.push(fold_hole(expr, &mut hole));
    }
    join(lit, &holes, &mut fold);
    fold
}

/// Join quasis with every hole combination, or refuse whole over the cap.
fn join(lit: &TemplateLiteral<'_>, holes: &[Vec<String>], fold: &mut TemplateFold) {
    let Some(cooked) = cooked_quasis(lit, fold) else {
        return;
    };
    if cooked.len() != holes.len() + 1 {
        // The parser builds quasis and holes together; a skew refuses whole.
        fold.refusals.push(TemplateRefusal::whole(
            lit.span,
            "template quasis do not match the interpolation holes",
        ));
        return;
    }
    if holes.iter().any(Vec::is_empty) {
        // A refused or guard-only hole leaves no string to join.
        return;
    }
    let total: usize = holes.iter().map(Vec::len).product();
    if total > MAX_TEMPLATE_COMBINATIONS {
        fold.refusals.push(TemplateRefusal::whole(
            lit.span,
            format!("{total} combinations exceed the {MAX_TEMPLATE_COMBINATIONS}-combination fan-out limit"),
        ));
        return;
    }
    // Panda trims template joins after collapsing (SPEC-V2-14): the
    // collapse lands downstream at resolve, so the fold trims here.
    fold.values = combinations(&cooked, holes)
        .into_iter()
        .map(|joined| joined.trim().to_string())
        .collect();
}

/// Cooked quasi text, or a whole-template refusal on an invalid escape.
fn cooked_quasis<'a>(lit: &TemplateLiteral<'a>, fold: &mut TemplateFold) -> Option<Vec<&'a str>> {
    let mut cooked = Vec::with_capacity(lit.quasis.len());
    for quasi in lit.quasis.iter() {
        let Some(text) = quasi.value.cooked.as_ref() else {
            fold.refusals.push(TemplateRefusal::whole(
                lit.span,
                "invalid escape sequence in template quasi",
            ));
            return None;
        };
        cooked.push(text.as_str());
    }
    Some(cooked)
}

/// One joined string per hole-leaf combination, quasis interleaved.
fn combinations(quasis: &[&str], holes: &[Vec<String>]) -> Vec<String> {
    let Some(first) = quasis.first() else {
        return Vec::new();
    };
    let mut acc = vec![(*first).to_string()];
    for (hole, quasi) in holes.iter().zip(quasis.iter().skip(1)) {
        let mut next = Vec::with_capacity(acc.len() * hole.len());
        for prefix in &acc {
            for leaf in hole {
                next.push(format!("{prefix}{leaf}{quasi}"));
            }
        }
        acc = next;
    }
    acc
}
