//! Resolved import values and the refusals behind them, as data.
//! A `ResolvedExport` clones one origin's value kinds plus its precise
//! origin mutation and any nested-spread residue markers the origin baked;
//! `ValueRefused` words why a nested import spread could not be read, with
//! the cycle trail, the mutated write, or the walk refusal as its reason.

use module_graph::{BindingOrigin, Refused};

use crate::atom::AtomValue;
use crate::extract::constants::{
    ConstArrayElement, ConstObject, LocalConstants, MutatedBinding, ObjectProp,
};
use crate::extract::fold::fence::PureFn;

/// One imported name's resolved value, cloned from its declaring origin.
/// Value-empty with a mutation means the origin was written: uses drop and
/// name the write. Value-empty without a mutation never enters the map.
#[derive(Debug, Clone, Default)]
pub struct ResolvedExport {
    scalars: Vec<AtomValue>,
    scalar_residue: bool,
    object: Option<ConstObject>,
    array: Option<Vec<ConstArrayElement>>,
    pure_fn: Option<PureFn>,
    mutation: Option<MutatedBinding>,
    unfoldable: Vec<UnfoldableSpread>,
}

impl ResolvedExport {
    /// Every static leaf the origin declares for the imported name.
    pub fn scalars(&self) -> &[AtomValue] {
        &self.scalars
    }

    /// True when the origin's scalar init dropped a dynamic arm beside its
    /// leaves: values scoop the union while test folding stays open.
    pub fn scalar_residue(&self) -> bool {
        self.scalar_residue
    }

    /// The style object the origin declares for the imported name, if any.
    pub fn object(&self) -> Option<&ConstObject> {
        self.object.as_ref()
    }

    /// One member entry of the imported style object, if it carries one.
    pub fn object_prop(&self, prop: &str) -> Option<&ObjectProp> {
        self.object.as_ref().and_then(|map| map.get(prop))
    }

    /// The const array the origin declares for the imported name, if any.
    pub fn array(&self) -> Option<&[ConstArrayElement]> {
        self.array.as_deref()
    }

    /// The lowered helper the origin declares for the imported name, if any.
    pub fn pure_fn(&self) -> Option<&PureFn> {
        self.pure_fn.as_ref()
    }

    /// The origin file's write to this binding, for precise poison.
    pub fn mutation(&self) -> Option<&MutatedBinding> {
        self.mutation.as_ref()
    }

    /// Nested spreads the origin could not unfold, for the use-site floor.
    pub fn unfoldable(&self) -> &[UnfoldableSpread] {
        &self.unfoldable
    }

    /// True when the export carries any lowerable value kind.
    pub fn has_value(&self) -> bool {
        !self.scalars.is_empty()
            || self.object.is_some()
            || self.array.is_some()
            || self.pure_fn.is_some()
    }

    /// An empty export naming the origin file's write to the binding.
    pub(crate) fn mutated(mutation: MutatedBinding) -> Self {
        Self {
            mutation: Some(mutation),
            ..Self::default()
        }
    }

    /// Fill the value kinds; the mutation and markers arrive separately.
    pub(crate) fn set_value(
        &mut self,
        scalars: Vec<AtomValue>,
        object: Option<ConstObject>,
        array: Option<Vec<ConstArrayElement>>,
        pure_fn: Option<PureFn>,
    ) {
        self.scalars = scalars;
        self.object = object;
        self.array = array;
        self.pure_fn = pure_fn;
    }

    /// Carry the origin's nested-spread residue markers to the use site.
    pub(crate) fn set_unfoldable(&mut self, markers: Vec<UnfoldableSpread>) {
        self.unfoldable = markers;
    }

    /// Carry the origin scalar's dropped-arm mark to the use site.
    pub(crate) fn set_scalar_residue(&mut self, residue: bool) {
        self.scalar_residue = residue;
    }
}

/// One nested spread an origin file could not unfold: the residue marker.
/// Rides the resolved object to the importing file, where wholesale
/// lowerings (spreads, `css(ident)`, style blocks) diagnose it once per use.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct UnfoldableSpread {
    /// The spread name as authored in the origin file.
    local: String,
    /// The origin file's basename (`tokens.ts`, never a full path).
    file: String,
    /// The spread's 1-based line in the origin file.
    line: u32,
    /// The parenthetical reason (`cycle a.ts ↔ b.ts`, ...).
    reason: String,
}

impl UnfoldableSpread {
    /// A marker for one unreadable spread of `local` at `file:line`.
    pub(crate) fn new(local: &str, file: &str, line: u32, reason: String) -> Self {
        Self {
            local: local.to_string(),
            file: basename(file).to_string(),
            line,
            reason,
        }
    }

    /// The site diagnostic: what spread, where, and why it could not be read.
    pub fn message(&self) -> String {
        format!(
            "spread of `{}` in {}:{} could not be read ({})",
            self.local, self.file, self.line, self.reason
        )
    }
}

/// Why an origin value has no foldable value: the walk refusal, an origin
/// write, or a value chase that re-entered its own in-progress origin.
#[derive(Debug, Clone)]
pub(crate) enum ValueRefused {
    /// The origin walk refused the import edge (cycle, miss, star clash,
    /// namespace, or default).
    Walk(Refused),
    /// The origin file wrote the binding; the write names itself.
    Mutated {
        name: String,
        binding: MutatedBinding,
    },
    /// The value chase re-entered an origin already being valued.
    ValueCycle { stack: Vec<BindingOrigin> },
}

/// The authored edge behind a refused nested import, for reason wording.
pub(crate) struct RefusalCtx<'a> {
    /// The specifier as authored in the origin file.
    pub specifier: &'a str,
    /// The imported name the edge takes from the target.
    pub imported: &'a str,
}

/// The parenthetical reason for one refused nested import.
pub(crate) fn reason_text(refused: &ValueRefused, ctx: &RefusalCtx<'_>) -> String {
    match refused {
        ValueRefused::Walk(walk) => walk_reason(walk, ctx),
        ValueRefused::Mutated { name, binding } => {
            format!("`{name}` {}", binding.write_phrase())
        }
        ValueRefused::ValueCycle { stack } => format!("cycle {}", cycle_files(stack)),
    }
}

/// The parenthetical reason for one origin-walk refusal.
fn walk_reason(refused: &Refused, ctx: &RefusalCtx<'_>) -> String {
    match refused {
        Refused::Cycle { .. } => "re-export cycle".to_string(),
        Refused::Namespace { .. } => "namespace import".to_string(),
        Refused::Default { .. } => "default import".to_string(),
        edge => edge_reason(edge, ctx),
    }
}

/// The parenthetical reason for an edge-carrying walk refusal.
fn edge_reason(refused: &Refused, ctx: &RefusalCtx<'_>) -> String {
    match refused {
        Refused::Unresolved { .. } => format!("unresolvable import '{}'", ctx.specifier),
        Refused::MissingExport { .. } => {
            format!("no export '{}' from '{}'", ctx.imported, ctx.specifier)
        }
        Refused::Ambiguous { .. } => format!("ambiguous export '{}'", ctx.imported),
        Refused::Cycle { .. } | Refused::Namespace { .. } | Refused::Default { .. } => {
            walk_reason(refused, ctx)
        }
    }
}

/// The chase's files in first-appearance order: `base.ts ↔ tokens.ts`.
fn cycle_files(stack: &[BindingOrigin]) -> String {
    let mut files = Vec::new();
    for origin in stack {
        let file = basename(origin.file.as_str());
        if !files.contains(&file) {
            files.push(file);
        }
    }
    files.join(" ↔ ")
}

/// The final segment of a slash-normalized path.
pub(crate) fn basename(path: &str) -> &str {
    path.rsplit('/').next().unwrap_or(path)
}

/// An export carrying exactly these value kinds.
pub(crate) fn valued(
    scalars: Vec<AtomValue>,
    object: Option<ConstObject>,
    array: Option<Vec<ConstArrayElement>>,
    pure_fn: Option<PureFn>,
) -> ResolvedExport {
    let mut export = ResolvedExport::default();
    export.set_value(scalars, object, array, pure_fn);
    export
}

/// An export carrying scalar leaves plus their dropped-arm mark.
pub(crate) fn valued_scalars(leaves: Vec<AtomValue>, residue: bool) -> ResolvedExport {
    let mut export = valued(leaves, None, None, None);
    export.set_scalar_residue(residue);
    export
}

/// Keep a folded value or a mutation entry; refusals stay out.
pub(crate) fn keep_outcome(
    local: &str,
    resolved: Result<ResolvedExport, ValueRefused>,
) -> Option<(String, ResolvedExport)> {
    match resolved {
        Ok(export) if export.has_value() => Some((local.to_string(), export)),
        Err(ValueRefused::Mutated { binding, .. }) => {
            Some((local.to_string(), ResolvedExport::mutated(binding)))
        }
        Ok(_) | Err(_) => None,
    }
}

/// One file's literal value for a name, from its own bag only.
pub(crate) fn bag_export(bag: &LocalConstants, name: &str) -> ResolvedExport {
    let mut export = valued(
        bag.scalar_leaves(name).to_vec(),
        bag.get_object(name).cloned(),
        bag.get_array(name).map(<[ConstArrayElement]>::to_vec),
        None,
    );
    export.set_scalar_residue(bag.scalar_residue(name));
    export
}

#[cfg(test)]
mod tests {
    use super::*;
    use module_graph::ModuleKey;

    /// A value-cycle refusal over a two-file chase.
    fn cycled() -> ValueRefused {
        ValueRefused::ValueCycle {
            stack: vec![
                BindingOrigin {
                    file: ModuleKey::new("/p/src/tokens.ts"),
                    name: "button".to_string(),
                },
                BindingOrigin {
                    file: ModuleKey::new("/p/src/base.ts"),
                    name: "base".to_string(),
                },
            ],
        }
    }

    #[test]
    fn cycle_reason_names_each_file_once() {
        let ctx = RefusalCtx {
            specifier: "./base",
            imported: "base",
        };
        assert_eq!(reason_text(&cycled(), &ctx), "cycle tokens.ts ↔ base.ts");
    }

    #[test]
    fn marker_message_names_spread_site_and_reason() {
        let marker = UnfoldableSpread::new(
            "base",
            "/p/src/tokens.ts",
            3,
            "cycle base.ts ↔ tokens.ts".to_string(),
        );
        assert_eq!(
            marker.message(),
            "spread of `base` in tokens.ts:3 could not be read (cycle base.ts ↔ tokens.ts)"
        );
    }

    #[test]
    fn mutated_reason_names_the_write() {
        let ctx = RefusalCtx {
            specifier: "./base",
            imported: "base",
        };
        let refused = ValueRefused::Mutated {
            name: "base".to_string(),
            binding: MutatedBinding::new("base.ts", Some((4, 1))),
        };
        assert_eq!(
            reason_text(&refused, &ctx),
            "`base` reassigned at base.ts:4:1"
        );
    }
}
