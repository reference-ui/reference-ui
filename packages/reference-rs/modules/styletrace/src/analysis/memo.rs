//! Memoized verdicts for the style walk: whether an export, component or factory traces to a primitive.
//! Every walk node is looked up here before its body runs, and a node met again while it is still on the stack answers no as a cycle cut.
//! A cut's no is not the node's verdict, so a no that leaned on a cut stays tentative until its top-level query settles: a yes discards those tentative nos, and a no makes them final.
//! The bodies in `analyzer.rs` supply the verdicts; this file owns the cache, the cut counter and the entry points that call those bodies.

use std::collections::BTreeSet;
use std::path::{Path, PathBuf};

use rustc_hash::{FxHashMap, FxHashSet};

use super::analyzer::StyleTraceAnalyzer;
use crate::resolver::StyleTraceError;

/// A node's owned props when it traces, `None` when it does not.
pub(super) type Verdict = Option<BTreeSet<String>>;

/// Which entry point a node came from; an export and a component can share a name.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub(super) enum NodeKind {
    Export,
    Component,
    Factory,
}

/// One walk node: its kind plus the module path and name that identify it.
#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub(super) struct NodeKey {
    kind: NodeKind,
    module: PathBuf,
    name: String,
}

impl NodeKey {
    pub(super) fn new(kind: NodeKind, module: &Path, name: &str) -> Self {
        Self {
            kind,
            module: module.to_path_buf(),
            name: name.to_string(),
        }
    }

    /// The spelling a node takes on the walk stack; re-entering it is a cycle cut.
    fn stack_key(&self) -> String {
        let tag = match self.kind {
            NodeKind::Export => "export",
            NodeKind::Component => "component",
            NodeKind::Factory => "factory",
        };
        format!("{tag}:{}::{}", self.module.display(), self.name)
    }
}

/// The cut counter when a frame opened; `settle` compares against it to learn whether the frame leaned on a cut.
#[derive(Clone, Copy)]
struct FrameMark(u64);

/// Settled verdicts, the tentative nos of the active query, and the cut counter.
#[derive(Default)]
pub(super) struct TraceMemo {
    verdicts: FxHashMap<NodeKey, Verdict>,
    tentative: FxHashSet<NodeKey>,
    cuts: u64,
}

impl TraceMemo {
    /// The memoized verdict for a node. Reading a tentative no leans on the walk
    /// that produced it, so the reader leans on that same cut.
    fn lookup(&mut self, key: &NodeKey) -> Option<Verdict> {
        let verdict = self.verdicts.get(key)?.clone();
        if self.tentative.contains(key) {
            self.cuts += 1;
        }
        Some(verdict)
    }

    /// A re-entered node is still on the stack, so its verdict is not known yet.
    fn cut(&mut self) {
        self.cuts += 1;
    }

    fn open(&self) -> FrameMark {
        FrameMark(self.cuts)
    }

    /// Settle a finished frame. A yes is final, and so is a no that saw no cut; a no
    /// that leaned on a cut waits for its query. The root frame of a query settles the
    /// query: a yes discards the tentative nos, because a path to a primitive now
    /// exists, and a no makes them final, because nothing the query reached traces.
    fn settle(&mut self, key: NodeKey, verdict: &Verdict, mark: FrameMark, is_root: bool) {
        if verdict.is_none() && self.cuts != mark.0 {
            self.tentative.insert(key.clone());
        }
        self.verdicts.insert(key, verdict.clone());
        if is_root {
            self.close_query(verdict.is_some());
        }
    }

    fn close_query(&mut self, traced: bool) {
        if !traced {
            self.tentative.clear();
            return;
        }
        for key in self.tentative.drain() {
            self.verdicts.remove(&key);
        }
    }
}

impl StyleTraceAnalyzer<'_> {
    /// The export's owned props when its target traces; `None` when it does not.
    pub(super) fn export_is_traced(
        &mut self,
        module_path: &Path,
        export_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
        let key = NodeKey::new(NodeKind::Export, module_path, export_name);
        self.walk_node(key, stack, |this, stack| {
            this.export_body(module_path, export_name, stack)
        })
    }

    /// The component's owned props when it traces; `None` when it does not.
    pub(super) fn component_is_traced(
        &mut self,
        module_path: &Path,
        component_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
        let key = NodeKey::new(NodeKind::Component, module_path, component_name);
        self.walk_node(key, stack, |this, stack| {
            this.component_body(module_path, component_name, stack)
        })
    }

    /// The factory product's owned props when it traces; `None` when it does not.
    pub(super) fn factory_is_traced(
        &mut self,
        module_path: &Path,
        factory_name: &str,
        stack: &mut Vec<String>,
    ) -> Result<Verdict, StyleTraceError> {
        let key = NodeKey::new(NodeKind::Factory, module_path, factory_name);
        self.walk_node(key, stack, |this, stack| {
            this.factory_body(module_path, factory_name, stack)
        })
    }

    /// Run one walk node: a settled verdict answers at once, a node already on the
    /// stack is a cycle cut, and anything else runs `body` in its own stack frame.
    fn walk_node(
        &mut self,
        key: NodeKey,
        stack: &mut Vec<String>,
        body: impl FnOnce(&mut Self, &mut Vec<String>) -> Result<Verdict, StyleTraceError>,
    ) -> Result<Verdict, StyleTraceError> {
        if let Some(verdict) = self.memo.lookup(&key) {
            return Ok(verdict);
        }
        let stack_key = key.stack_key();
        if stack.contains(&stack_key) {
            self.memo.cut();
            return Ok(None);
        }
        let is_root = stack.is_empty();
        let depth = stack.len();
        let mark = self.memo.open();
        stack.push(stack_key);
        let verdict = body(self, stack);
        stack.truncate(depth);
        let verdict = verdict?;
        self.memo.settle(key, &verdict, mark, is_root);
        Ok(verdict)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn key(name: &str) -> NodeKey {
        NodeKey::new(NodeKind::Component, Path::new("/m.tsx"), name)
    }

    fn traced() -> Verdict {
        Some(BTreeSet::new())
    }

    #[test]
    fn tentative_no_is_dropped_when_its_query_traces() {
        let mut memo = TraceMemo::default();
        let root = memo.open();
        let inner = memo.open();
        memo.cut();
        memo.settle(key("Pong"), &None, inner, false);
        memo.settle(key("Ping"), &traced(), root, true);
        assert!(memo.lookup(&key("Pong")).is_none());
        assert_eq!(memo.lookup(&key("Ping")), Some(traced()));
    }

    #[test]
    fn tentative_no_becomes_final_when_its_query_does_not_trace() {
        let mut memo = TraceMemo::default();
        let root = memo.open();
        let inner = memo.open();
        memo.cut();
        memo.settle(key("Solo1"), &None, inner, false);
        memo.settle(key("Solo2"), &None, root, true);
        assert!(memo.tentative.is_empty());
        assert_eq!(memo.lookup(&key("Solo1")), Some(None));
    }

    #[test]
    fn exact_no_survives_a_traced_query() {
        let mut memo = TraceMemo::default();
        let root = memo.open();
        let inner = memo.open();
        memo.settle(key("Plain"), &None, inner, false);
        memo.settle(key("Card"), &traced(), root, true);
        assert!(memo.tentative.is_empty());
        assert_eq!(memo.lookup(&key("Plain")), Some(None));
    }

    #[test]
    fn reading_a_tentative_no_leans_on_the_same_walk() {
        let mut memo = TraceMemo::default();
        let root = memo.open();
        let first = memo.open();
        memo.cut();
        memo.settle(key("Pong"), &None, first, false);
        let second = memo.open();
        assert_eq!(memo.lookup(&key("Pong")), Some(None));
        memo.settle(key("Other"), &None, second, false);
        assert!(memo.tentative.contains(&key("Other")));
        memo.settle(key("Ping"), &None, root, true);
        assert!(memo.tentative.is_empty());
    }
}
