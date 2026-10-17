//! Authored-value resolution for one declaration: scalar, responsive array, and responsive object forms.
//! Each form converts its JSON leaves into `Want`s at one condition step and resolves them through the utility resolver into `ResolvedAtom`s carrying their cascade slots.
//! Diet mode keeps only the atoms with empty slot strings, since the `!proof` path needs emptiness and atoms alone.

use base_system::BaseSystem;
use serde_json::Value;

use super::{derive_slot, AuthoredDeclaration, PlanBuilder, ResolvedAtom};
use crate::atom::{Atom, AtomValue, Want};
use crate::diagnostics::{Diagnostic, DiagnosticLocation};
use crate::resolve::{resolve_want_with, ResolveSession};
use crate::runtime::values::is_duplicate;

fn resolve_with_unique_diagnostics(
    want: &Want,
    base_system: &BaseSystem,
    diagnostics: &mut Vec<Diagnostic>,
) -> Vec<crate::atom::Atom> {
    let mut local = Vec::new();
    let mut session = ResolveSession {
        system: base_system,
        diagnostics: &mut local,
        location: DiagnosticLocation::default(),
        // Plan re-resolve echoes the rendered line with no facts attached,
        // so is_duplicate still drops repeats by message as today.
        sink: None,
        want: None,
    };
    let atoms = resolve_want_with(want, &mut session);
    for diag in local {
        if !is_duplicate(diagnostics, &diag) {
            diagnostics.push(diag);
        }
    }
    atoms
}

impl<'a> PlanBuilder<'a> {
    pub(super) fn resolve_entry(&mut self, decl: &AuthoredDeclaration, diet: bool) -> Vec<ResolvedAtom> {
        if let Value::Array(arr) = &decl.value {
            return self.resolve_array(decl, arr, diet);
        }
        if let Value::Object(map) = &decl.value {
            if !map.contains_key("$r") && !map.contains_key("$token") {
                return self.resolve_object(decl, map, diet);
            }
        }

        let Some(atom_val) =
            self.convert_value(&decl.value, &decl.prop, &decl.when, decl.important)
        else {
            return Vec::new();
        };

        let want = want_at(decl, atom_val, &decl.when);
        let atoms = resolve_with_unique_diagnostics(&want, self.base_system, self.diagnostics);

        if diet {
            return diet_resolved(atoms);
        }
        let mut out = Vec::with_capacity(atoms.len());
        for atom in atoms {
            let slot = derive_slot(&atom.prop, &decl.when, None);
            out.push(ResolvedAtom { slot, atom });
        }
        out
    }

    fn resolve_array(
        &mut self,
        decl: &AuthoredDeclaration,
        arr: &[Value],
        diet: bool,
    ) -> Vec<ResolvedAtom> {
        let mut out = Vec::new();
        let bp_scale = self.base_system.breakpoints();

        for (idx, elem) in arr.iter().enumerate() {
            if elem.is_null() {
                continue;
            }
            let Some(bp) = bp_scale.breakpoint_for_index(idx) else {
                continue;
            };
            let mut step_when = decl.when.clone();
            step_when.push(bp.to_string());
            let Some(atom_val) = self.convert_value(elem, &decl.prop, &step_when, decl.important)
            else {
                continue;
            };
            let want = want_at(decl, atom_val, &step_when);
            let atoms = resolve_with_unique_diagnostics(&want, self.base_system, self.diagnostics);

            if diet {
                out.extend(diet_resolved(atoms));
                continue;
            }
            for atom in atoms {
                let slot = derive_slot(&atom.prop, &decl.when, Some(bp));
                out.push(ResolvedAtom { slot, atom });
            }
        }
        out
    }

    fn resolve_object(
        &mut self,
        decl: &AuthoredDeclaration,
        map: &serde_json::Map<String, Value>,
        diet: bool,
    ) -> Vec<ResolvedAtom> {
        let mut out = Vec::new();
        let bp_scale = self.base_system.breakpoints();

        for (key, elem) in map {
            if elem.is_null() {
                continue;
            }
            let mut step_when = decl.when.clone();
            step_when.push(key.clone());
            let Some(atom_val) = self.convert_value(elem, &decl.prop, &step_when, decl.important)
            else {
                continue;
            };
            let want = want_at(decl, atom_val, &step_when);
            let atoms = resolve_with_unique_diagnostics(&want, self.base_system, self.diagnostics);

            if diet {
                out.extend(diet_resolved(atoms));
                continue;
            }
            let responsive = key == "base" || bp_scale.names().iter().any(|n| n == key);

            for atom in atoms {
                let slot = object_slot(
                    &atom.prop,
                    &decl.when,
                    &step_when,
                    responsive.then_some(key.as_str()),
                );
                out.push(ResolvedAtom { slot, atom });
            }
        }
        out
    }
}

/// Build the resolve want for one authored value at one condition step.
fn want_at(
    decl: &AuthoredDeclaration,
    atom_val: AtomValue,
    when: &[String],
) -> Want {
    let when_boxed: smallvec::SmallVec<[Box<str>; 2]> =
        when.iter().map(|w| w.clone().into_boxed_str()).collect();
    Want::new(decl.prop.as_str(), atom_val)
        .with_when(when_boxed)
        .with_important(decl.important)
}

/// Zero-slot wrappers for the diet path: only emptiness and the atoms matter,
/// so slot materialization stays skipped.
fn diet_resolved(atoms: Vec<Atom>) -> Vec<ResolvedAtom> {
    atoms
        .into_iter()
        .map(|atom| ResolvedAtom {
            slot: String::new(),
            atom,
        })
        .collect()
}

/// Object slot: a breakpoint key joins the `@` responsive family; any other
/// key reads as nested `when` parts so `_hover` keys merge with `_hover:
/// { … }` blocks instead of bare props.
fn object_slot(
    prop: &str,
    decl_when: &[String],
    step_when: &[String],
    bp: Option<&str>,
) -> String {
    if let Some(bp) = bp {
        derive_slot(prop, decl_when, Some(bp))
    } else {
        derive_slot(prop, step_when, None)
    }
}
