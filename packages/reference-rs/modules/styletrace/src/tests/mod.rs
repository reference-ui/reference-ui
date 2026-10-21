//! Contains the styletrace test suite, grouped by internal concern such as resolution and analysis.
//! It coordinates the execution of isolated unit and integration tests across the various modules.
//! Takes test assertions and simulated file environments via the fixtures module.
//! Emits test results, verifying the correctness of type expansion and JSX wrapper tracing.

mod detailed_owned;
mod export_star;
mod fixtures;
mod hermetic_roots;
mod ident_alias;
mod member_alias;
mod member_alias_barrel;
mod member_alias_collide;
mod member_alias_forward_ref;
mod member_alias_reassign;
mod member_alias_silent;
mod core_decl_roots;
mod declared_walk;
mod owned_forwarded;
mod owned_local;
mod owned_props;
mod owned_provider;
mod owned_wrappers;
mod prop_resolution;
mod trace_gate;
mod tracing;
