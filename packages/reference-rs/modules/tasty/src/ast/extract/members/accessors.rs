//! Joins the get and set signatures of one interface accessor pair into a single property member.
//! The pair is one property: typed by the getter's return type (the setter's parameter type when only a
//! setter exists), and readonly only while no setter is present. The member keeps the position of its first
//! accessor, and the name index lives only for one member list, so accessors never merge across bodies.

use std::collections::BTreeMap;

use crate::model::TsMember;

/// Accessor members already pushed into one member list, keyed by property name.
#[derive(Default)]
pub(super) struct AccessorFold {
    index_by_name: BTreeMap<String, usize>,
}

impl AccessorFold {
    /// Pushes an accessor as a new member, or merges it into the earlier member of the same name.
    pub(super) fn push(&mut self, members: &mut Vec<TsMember>, accessor: TsMember) {
        match self.index_by_name.get(&accessor.name).copied() {
            Some(index) => merge_accessor(&mut members[index], accessor),
            None => {
                self.index_by_name
                    .insert(accessor.name.clone(), members.len());
                members.push(accessor);
            }
        }
    }
}

/// A getter (readonly) supplies the type, so it overrides; a setter never does. The merged member is
/// readonly only when every accessor folded into it is a getter.
fn merge_accessor(existing: &mut TsMember, accessor: TsMember) {
    if accessor.readonly {
        existing.type_ref = accessor.type_ref;
    }
    existing.readonly &= accessor.readonly;
}
