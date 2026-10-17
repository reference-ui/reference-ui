//! Budgets for type-level evaluation: an entry scope that gives every top-level evaluation a fresh
//! step budget, an alias scope that caps nested alias expansion depth and total steps, and an
//! instantiation scope that marks the body of a generic alias being instantiated. Counters are
//! thread-local so the recursive resolver keeps its `&self` shape. An exhausted budget never
//! panics; it sets a flag that makes the active evaluation fail closed (leave `resolved` absent).

use std::cell::Cell;

/// Alias expansions nested inside one evaluation. TypeScript stops instantiation at depth 100. Each
/// level costs roughly 5 to 10 KB of native stack in a release build (a 256 KB stack overflows on the
/// deepest case, a 512 KB one does not), so 50 levels stay inside a 1 MB main-thread stack.
pub(crate) const MAX_ALIAS_DEPTH: u32 = 50;

/// Alias expansions across one outermost evaluation. This bounds union fan-out as well as depth,
/// so a recursion that doubles at every level still ends in bounded time.
pub(crate) const MAX_ALIAS_STEPS: u32 = 10_000;

thread_local! {
    static ACTIVE_ENTRIES: Cell<u32> = const { Cell::new(0) };
    static ALIAS_DEPTH: Cell<u32> = const { Cell::new(0) };
    static ALIAS_STEPS: Cell<u32> = const { Cell::new(0) };
    static INSTANTIATIONS: Cell<u32> = const { Cell::new(0) };
    static EXHAUSTED: Cell<bool> = const { Cell::new(false) };
}

fn read(counter: &'static std::thread::LocalKey<Cell<u32>>) -> u32 {
    counter.with(Cell::get)
}

fn write(counter: &'static std::thread::LocalKey<Cell<u32>>, value: u32) {
    counter.with(|cell| cell.set(value));
}

/// Marks one evaluator entry. The outermost entry starts a fresh step budget and clears any flag
/// left by an earlier evaluation, so one symbol can never make the next one fail.
pub(crate) struct EvaluationScope;

impl EvaluationScope {
    pub(crate) fn enter() -> Self {
        if read(&ACTIVE_ENTRIES) == 0 {
            write(&ALIAS_STEPS, 0);
            EXHAUSTED.with(|flag| flag.set(false));
        }
        write(&ACTIVE_ENTRIES, read(&ACTIVE_ENTRIES) + 1);
        Self
    }
}

impl Drop for EvaluationScope {
    fn drop(&mut self) {
        write(&ACTIVE_ENTRIES, read(&ACTIVE_ENTRIES).saturating_sub(1));
    }
}

/// One alias expansion. Holding it counts toward the depth budget until it is dropped.
pub(crate) struct AliasScope;

impl AliasScope {
    /// `None` once the depth or step budget is spent, and the evaluation in progress is flagged.
    pub(crate) fn enter() -> Option<Self> {
        let depth = read(&ALIAS_DEPTH);
        let steps = read(&ALIAS_STEPS);
        if depth >= MAX_ALIAS_DEPTH || steps >= MAX_ALIAS_STEPS {
            EXHAUSTED.with(|flag| flag.set(true));
            return None;
        }
        write(&ALIAS_DEPTH, depth + 1);
        write(&ALIAS_STEPS, steps + 1);
        Some(Self)
    }
}

impl Drop for AliasScope {
    fn drop(&mut self) {
        write(&ALIAS_DEPTH, read(&ALIAS_DEPTH).saturating_sub(1));
    }
}

/// Marks the body of a generic alias that is being instantiated with its type arguments.
pub(crate) struct InstantiationScope;

impl InstantiationScope {
    pub(crate) fn enter() -> Self {
        write(&INSTANTIATIONS, read(&INSTANTIATIONS) + 1);
        Self
    }
}

impl Drop for InstantiationScope {
    fn drop(&mut self) {
        write(&INSTANTIATIONS, read(&INSTANTIATIONS).saturating_sub(1));
    }
}

/// True while a generic alias body is being instantiated, where a union check may be a naked type
/// parameter that TypeScript would distribute over.
pub(crate) fn instantiating() -> bool {
    read(&INSTANTIATIONS) > 0
}

/// True once a budget ran out during the current evaluation; the result must then be discarded.
pub(crate) fn exhausted() -> bool {
    EXHAUSTED.with(Cell::get)
}
