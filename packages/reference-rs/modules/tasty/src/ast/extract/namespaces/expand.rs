//! Alias expansion. A name that an import-equals alias starts is rewritten to the alias's target text, repeatedly, so a
//! chain of aliases resolves in one lowering. Lowering does the rewrite, so a type reference carries the target name and
//! the resolver sees only names it already knows how to bind. A cycle (`import A = A.B`) stops after a fixed number of hops,
//! and the name left over stays unresolved.

use std::collections::BTreeMap;

use crate::ast::model::{ImportBinding, ImportBindingKind};

const MAX_ALIAS_HOPS: usize = 8;

/// The name after expanding every alias it starts with. A name no alias starts comes back unchanged.
pub(crate) fn expand_alias(bindings: &BTreeMap<String, ImportBinding>, name: &str) -> String {
    let mut current = name.to_string();
    for _ in 0..MAX_ALIAS_HOPS {
        let Some(next) = alias_hop(bindings, &current) else {
            break;
        };
        current = next;
    }
    current
}

/// One expansion step: the whole name when it is an alias, else the name with its head replaced when the head is one.
fn alias_hop(bindings: &BTreeMap<String, ImportBinding>, name: &str) -> Option<String> {
    if let Some(binding) = alias_binding(bindings, name) {
        return Some(binding.imported_name.clone());
    }
    let (head, rest) = name.split_once('.')?;
    let binding = alias_binding(bindings, head)?;
    Some(format!("{}.{rest}", binding.imported_name))
}

fn alias_binding<'b>(
    bindings: &'b BTreeMap<String, ImportBinding>,
    name: &str,
) -> Option<&'b ImportBinding> {
    bindings
        .get(name)
        .filter(|binding| matches!(binding.kind, ImportBindingKind::Alias))
}
