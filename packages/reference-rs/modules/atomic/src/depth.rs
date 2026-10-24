//! The expression-depth gate that follows every atomic parse.
//! The shared nesting gate counts brackets, so a chain with none (`!!!!x`, `1 + 1 + 1 + ...`, `a ? b : a ? b : ...`,
//! `x as T as T`, `f()()()`, `a[0][0][0]`) nests the AST as deep as it is long and costs the gate nothing. Every walker
//! after the parse recurses once per AST level: the fold table, the scope collector, the extract and analysis
//! visitors. A parsed program whose expressions, statements or types nest past `MAX_DEPTH` is refused here, so no
//! walker ever sees a tree deeper than the limit. `check` takes a parsed program and returns the byte offset of the node
//! that crossed the limit; `DepthRefusal::message` is the sentence the parse-error path reports as `ATM-E-PARSE`.
//! The check is a visitor that stops descending where it crosses the limit, so it never recurses past `MAX_DEPTH` levels.

use oxc_ast::ast::{Expression, Program, Statement, TSType};
use oxc_ast_visit::{walk, Visit};
use oxc_span::GetSpan;

/// The deepest AST nesting a program may reach: expressions, statements and types counted together. A level is one
/// node, so `(((x)))` is four levels, and a call argument inside a statement inside an arrow body counts each step.
/// Real sources stay far below it (the nesting survey found 36 bracket levels at most, and a chain of a few hundred
/// operands is already unusual), and the bracket gate's own limit of 1,024 bracket levels fits beneath it.
/// Measured in a release build (`tests/depth.rs`), the whole compile of the costliest chain shape at this depth needs
/// between 1.5 and 2 MiB of stack: a quarter of the 8 MiB a Node main thread gives, an eighth of the 16 MiB floor a native
/// thread falls back to, and a hundredth of the 256 MiB an N-API export runs on.
pub(crate) const MAX_DEPTH: usize = 2048;

/// A program the gate refused: the byte offset where its AST first nested past `MAX_DEPTH`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct DepthRefusal {
    pub offset: u32,
}

impl DepthRefusal {
    /// The sentence the parse-error path reports for a refused program, given the 1-based line of `offset`.
    pub(crate) fn message(line: u32) -> String {
        format!(
            "expression nested deeper than {MAX_DEPTH} levels at line {line}; split or flatten the long chain of operators"
        )
    }
}

/// Refuses `program` when any expression, statement or type in it nests past `MAX_DEPTH`.
pub(crate) fn check(program: &Program<'_>) -> Result<(), DepthRefusal> {
    let mut gate = DepthGate {
        depth: 0,
        crossed: None,
    };
    gate.visit_program(program);
    match gate.crossed {
        Some(offset) => Err(DepthRefusal { offset }),
        None => Ok(()),
    }
}

/// The visitor behind `check`: `depth` is the node level being visited, and `crossed` holds the first offset past the
/// limit. Once it is set every visit returns at once, so the walk ends where it crossed.
struct DepthGate {
    depth: usize,
    crossed: Option<u32>,
}

impl DepthGate {
    /// Enters one level at `offset`, runs `descend` if the limit still holds, and leaves the level.
    fn level(&mut self, offset: u32, descend: impl FnOnce(&mut Self)) {
        if self.crossed.is_some() {
            return;
        }
        self.depth += 1;
        if self.depth > MAX_DEPTH {
            self.crossed = Some(offset);
        } else {
            descend(self);
        }
        self.depth -= 1;
    }
}

impl<'a> Visit<'a> for DepthGate {
    fn visit_expression(&mut self, it: &Expression<'a>) {
        self.level(it.span().start, |gate| walk::walk_expression(gate, it));
    }

    fn visit_statement(&mut self, it: &Statement<'a>) {
        self.level(it.span().start, |gate| walk::walk_statement(gate, it));
    }

    fn visit_ts_type(&mut self, it: &TSType<'a>) {
        self.level(it.span().start, |gate| walk::walk_ts_type(gate, it));
    }
}

#[cfg(test)]
mod tests;
