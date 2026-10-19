//! Symbol shell surface.
//! Builds interface and type-alias shells for export bookkeeping before resolution.

mod interface;
mod type_alias;

pub(super) use interface::push_interface_shell;
pub(super) use type_alias::push_type_alias_shell;
