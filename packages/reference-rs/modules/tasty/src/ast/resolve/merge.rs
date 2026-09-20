//! Pre-resolution declaration-merge fold (M1–M3): same-file same-name
//! shells share one symbol id (`sym:{file}#{name}`), so without a fold the
//! resolve layer's id-keyed maps keep only the last declaration. This pass
//! runs over `parsed.exports` before any index is built or reference is
//! resolved: all-Interface groups merge into one shell with unioned members
//! (M1), same-name nominal members keep the first with a diagnostic (M2),
//! and alias/mixed groups keep the last shell with a diagnostic (M3).
//! Diagnostics ride the existing `ParsedTypeScriptAst.diagnostics` channel
//! end to end (graph → bundle → manifest warnings + `out.diagnostics`).

use std::collections::{BTreeMap, BTreeSet};

use crate::ast::model::{ParsedFileAst, SymbolShell};
use crate::model::{ScannerDiagnostic, TsMember, TsMemberKind, TsSymbolKind};

/// Fold same-file same-name shells in place, preserving first-occurrence
/// declaration order. Groups of one pass through untouched (zero behavior
/// change); groups of several fold per M1–M3 with diagnostics appended.
pub(crate) fn fold_same_file_merges(
    parsed: &mut ParsedFileAst,
    diagnostics: &mut Vec<ScannerDiagnostic>,
) {
    if parsed.exports.len() < 2 {
        return;
    }
    let mut order: Vec<String> = Vec::new();
    let mut groups: BTreeMap<String, Vec<SymbolShell>> = BTreeMap::new();
    for shell in parsed.exports.drain(..) {
        let name = shell.name.clone();
        if !groups.contains_key(&name) {
            order.push(name.clone());
        }
        groups.entry(name).or_default().push(shell);
    }
    let mut folded = Vec::with_capacity(order.len());
    for name in order {
        let group = groups.remove(&name).expect("group pushed above");
        folded.push(fold_group(&parsed.file_id, group, diagnostics));
    }
    parsed.exports = folded;
}

fn fold_group(
    file_id: &str,
    group: Vec<SymbolShell>,
    diagnostics: &mut Vec<ScannerDiagnostic>,
) -> SymbolShell {
    if group.len() == 1 {
        return group.into_iter().next().expect("non-empty group");
    }
    if group
        .iter()
        .all(|shell| shell.kind == TsSymbolKind::Interface)
    {
        return merge_interfaces(file_id, group, diagnostics);
    }
    let name = group[0].name.clone();
    let kinds = group
        .iter()
        .map(|shell| kind_label(&shell.kind))
        .collect::<Vec<_>>()
        .join(" + ");
    diagnostics.push(ScannerDiagnostic {
        file_id: file_id.to_string(),
        message: format!("duplicate declaration of \"{name}\" ({kinds}); keeping the last"),
    });
    group.into_iter().last().expect("non-empty group")
}

/// M1: union all-Interface shells in declaration order. Members union by
/// name with first-wins for nominal collisions (M2); `extends` and
/// `references` concatenate; docs take first-Some; type parameters stay
/// the first block's (tsc requires identical lists); `exported` is OR-ed.
fn merge_interfaces(
    file_id: &str,
    group: Vec<SymbolShell>,
    diagnostics: &mut Vec<ScannerDiagnostic>,
) -> SymbolShell {
    let mut shells = group.into_iter();
    let first = shells.next().expect("non-empty merge group");
    let mut merge = InterfaceMerge::new(first);
    for shell in shells {
        merge.absorb(shell, file_id, diagnostics);
    }
    merge.finish()
}

/// Accumulator for one M1 merge: the surviving shell plus the nominal
/// member names already claimed (first-wins per M2).
struct InterfaceMerge {
    merged: SymbolShell,
    seen: BTreeSet<String>,
}

impl InterfaceMerge {
    fn new(first: SymbolShell) -> Self {
        let seen = nominal_member_names(&first.defined_members);
        Self {
            merged: first,
            seen,
        }
    }

    fn absorb(
        &mut self,
        shell: SymbolShell,
        file_id: &str,
        diagnostics: &mut Vec<ScannerDiagnostic>,
    ) {
        self.merged.exported |= shell.exported;
        self.merged.extends.extend(shell.extends);
        self.merged.references.extend(shell.references);
        if self.merged.description.is_none() {
            self.merged.description = shell.description;
        }
        if self.merged.description_raw.is_none() {
            self.merged.description_raw = shell.description_raw;
        }
        if self.merged.jsdoc.is_none() {
            self.merged.jsdoc = shell.jsdoc;
        }
        for member in shell.defined_members {
            self.push_member(member, file_id, diagnostics);
        }
    }

    fn push_member(
        &mut self,
        member: TsMember,
        file_id: &str,
        diagnostics: &mut Vec<ScannerDiagnostic>,
    ) {
        if is_nominal(&member) && !self.seen.insert(member.name.clone()) {
            diagnostics.push(ScannerDiagnostic {
                file_id: file_id.to_string(),
                message: format!(
                    "interface \"{}\" declares member \"{}\" more than once; keeping the first",
                    self.merged.name, member.name
                ),
            });
            return;
        }
        self.merged.defined_members.push(member);
    }

    fn finish(self) -> SymbolShell {
        self.merged
    }
}

/// M2 applies to nominal members only. Call/construct/index signatures
/// (`[call]`/`[new]`/`[index]`) are overloads in tsc, not collisions, so
/// they always union additively without a diagnostic.
fn is_nominal(member: &TsMember) -> bool {
    matches!(
        member.kind,
        TsMemberKind::Property | TsMemberKind::Method
    )
}

fn nominal_member_names(members: &[TsMember]) -> BTreeSet<String> {
    members
        .iter()
        .filter(|member| is_nominal(member))
        .map(|member| member.name.clone())
        .collect()
}

fn kind_label(kind: &TsSymbolKind) -> &'static str {
    match kind {
        TsSymbolKind::Interface => "Interface",
        TsSymbolKind::TypeAlias => "TypeAlias",
    }
}
