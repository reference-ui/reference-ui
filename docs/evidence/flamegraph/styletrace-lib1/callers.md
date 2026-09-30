# Caller attribution: lib-styletrace (488bcfd7a)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `../../../../tmp/styletrace-perf-mission/docs/EVIDENCE/flamegraph/styletrace-lib1`.
Derived 2026-09-30T12:45:31.701Z via `pnpm agentrs flame --callers /tmp/styletrace-perf-mission/docs/EVIDENCE/flamegraph/styletrace-lib1`; no re-record, bundle raws untouched.
Covers 5343 weight across 4600 main-thread samples. Shares below are of that weight unless noted.


## Callers of `read`

Inclusive 787wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 664 | 12.4% | `std::io::default_read_to_end` |
| 59 | 1.1% | `<std::fs::File as std::io::Read>::read` |
| 50 | 0.9% | `uv__fs_work` |
| 14 | 0.3% | `std::io::default_read_to_end::small_probe_read` |

## Callers of `semaphore_wait_trap`

Inclusive 563wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 563 | 10.5% | `_dispatch_sema4_wait` |

## Callers of `tiny_malloc_should_clear`

Inclusive 1030wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 1030 | 19.3% | `szone_malloc_should_clear` |

## Callers of `free_tiny`

Inclusive 739wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 324 | 6.1% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 186 | 3.5% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 81 | 1.5% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 14 | 0.3% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 12 | 0.2% | `<hashbrown::raw::RawTable<T,A> as core::ops::drop::Drop>::drop` |
| 11 | 0.2% | `core::ptr::drop_in_place<alloc::vec::Vec<indexmap::Bucket<alloc::string::String,serde_json::value::Value>>>` |
| 10 | 0.2% | `szone_realloc` |
| 9 | 0.2% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |

## Callers of `kevent`

Inclusive 270wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 270 | 5.1% | `uv__io_poll` |

## Callers of `stat$INODE64`

Inclusive 262wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 170 | 3.2% | `std::path::Path::is_file` |
| 41 | 0.8% | `std::sys::fs::metadata` |
| 38 | 0.7% | `std::path::Path::is_dir` |
| 13 | 0.2% | `uv__fs_work` |

## Callers of `tiny_malloc_from_free_list`

Inclusive 412wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 412 | 7.7% | `tiny_malloc_should_clear` |

## Callers of `__open`

Inclusive 187wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 187 | 3.5% | `open` |

## Callers of `rack_get_thread_index`

Inclusive 157wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 157 | 2.9% | `tiny_malloc_should_clear` |

## Callers of `set_tiny_meta_header_in_use`

Inclusive 147wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 146 | 2.7% | `tiny_malloc_from_free_list` |
| 1 | 0.0% | `tiny_try_realloc_in_place` |

## Callers of `tiny_free_no_lock`

Inclusive 322wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 322 | 6.0% | `free_tiny` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 123wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 19 | 0.4% | `0x7ff7be9a0eef` |
| 16 | 0.3% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 8 | 0.1% | `core::slice::sort::stable::drift::sort` |
| 8 | 0.1% | `0x7ff7be9a1eaf` |
| 3 | 0.1% | `0x7ff7be995bcf` |
| 3 | 0.1% | `0x7ff7be99671f` |
| 2 | 0.0% | `0x7ff7be996bbf` |
| 2 | 0.0% | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 157wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 101 | 1.9% | `styletrace::resolver::tracer::resolve::resolve_combined_props` |
| 28 | 0.5% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 18 | 0.3% | `styletrace::resolver::tracer::resolve::resolve_combined_literals` |
| 6 | 0.1% | `styletrace::analysis::parser::component::component_from_function_like` |
| 1 | 0.0% | `atomic::phase_merge::publish` |
| 1 | 0.0% | `typegen::emit::tokens::token_unions` |
| 1 | 0.0% | `tasty::ast::extract::module_bindings::exports::record_named_reexports` |
| 1 | 0.0% | `tasty::generator::bundle::emit_artifact_bundle` |

## Callers of `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold`

Inclusive 800wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 800 | 15.0% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |

## Callers of `<alloc::string::String as core::clone::Clone>::clone`

Inclusive 988wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 737 | 13.8% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 199 | 3.7% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 16 | 0.3% | `<styletrace::resolver::model::TypeExpr as core::clone::Clone>::clone` |
| 12 | 0.2% | `<hashbrown::raw::RawTable<T,A> as core::clone::Clone>::clone` |
| 5 | 0.1% | `<alloc::vec::Vec<T,A> as core::clone::Clone>::clone` |
| 3 | 0.1% | `<tasty::model::TypeRef as core::clone::Clone>::clone` |
| 2 | 0.0% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |
| 2 | 0.0% | `<atomic::extract::resolver::source::AtomicFs as module_graph::fs::FileSystem>::read_to_string` |

## Callers of `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next`

Inclusive 135wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 60 | 1.1% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 51 | 1.0% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 7 | 0.1% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 6 | 0.1% | `styletrace::resolver::tracer::resolve::resolve_combined_props` |
| 3 | 0.1% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 2 | 0.0% | `styletrace::analysis::parser::component::component_from_expression` |
| 2 | 0.0% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 1 | 0.0% | `styletrace::resolver::tracer::resolve::resolve_prop_names` |

## Callers of `oxc_parser::lexer::Lexer::next_token`

Inclusive 87wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 13 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_lhs_expression_or_higher` |
| 7 | 0.1% | `oxc_parser::cursor::<impl oxc_parser::ParserImpl>::parse_normal_list` |
| 7 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_member_expression_rest` |
| 5 | 0.1% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type` |
| 5 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_primary_expression` |
| 5 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_literal_string` |
| 4 | 0.1% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 4 | 0.1% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_non_array_type` |

## Callers of `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push`

Inclusive 133wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 132 | 2.5% | `alloc::collections::btree::map::BTreeMap<K,V,A>::bulk_build_from_sorted_iter` |
| 1 | 0.0% | `<alloc::collections::btree::map::BTreeMap<K,V> as core::iter::traits::collect::FromIterator<(K,V)>>::from_iter` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 74wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 23 | 0.4% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 20 | 0.4% | `std::path::Path::_join` |
| 5 | 0.1% | `atomic::scan::scan` |
| 5 | 0.1% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 4 | 0.1% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.1% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 2 | 0.0% | `std::path::PathBuf::_push` |
| 2 | 0.0% | `core::slice::sort::stable::drift::sort` |

## Callers of `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler`

Inclusive 18wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.1% | `oxc_parser::lexer::byte_handlers::L_E` |
| 3 | 0.1% | `oxc_parser::lexer::byte_handlers::IDT` |
| 3 | 0.1% | `oxc_parser::lexer::byte_handlers::L_F` |
| 2 | 0.0% | `oxc_parser::lexer::byte_handlers::L_S` |
| 2 | 0.0% | `oxc_parser::lexer::byte_handlers::L_A` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_U` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_I` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_W` |

## Callers of `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize`

Inclusive 74wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 74 | 1.4% | `serde_json::de::from_trait` |

## Callers of `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree`

Inclusive 255wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 186 | 3.5% | `<styletrace::resolver::model::TypeExpr as core::clone::Clone>::clone` |
| 24 | 0.4% | `module_graph::walk::BindingWalk<L,F>::record_copy` |
| 16 | 0.3% | `styletrace::resolver::tracer::resolve::resolve_prop_names` |
| 10 | 0.2% | `styletrace::resolver::tracer::resolve::resolve_literal_names` |
| 9 | 0.2% | `styletrace::resolver::tracer::collect_style_prop_names` |
| 4 | 0.1% | `styletrace::analysis::parser::component::component_from_expression` |
| 4 | 0.1% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::next` |
| 1 | 0.0% | `atomic::extract::constants::index::LocalConstants::merge` |

## Malloc-family leaves by nearest atomic/canon ancestor

1373wt of malloc-family leaves; 10wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 773 | 14.5% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 278 | 5.2% | `styletrace::resolver::tracer::context::TraceContext::resolve_declaration` |
| 39 | 0.7% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 24 | 0.4% | `styletrace::resolver::tracer::resolve::resolve_prop_names` |
| 22 | 0.4% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 18 | 0.3% | `styletrace::resolver::tracer::collect_style_prop_names` |
| 18 | 0.3% | `module_graph::walk::BindingWalk<L,F>::record_copy` |
| 16 | 0.3% | `styletrace::resolver::tracer::resolve::resolve_literal_names` |
| 11 | 0.2% | `tasty::scan::scan_typescript_bundle` |
| 10 | 0.2% | `tasty::scanner::packages::relative::declaration_candidates` |
| 9 | 0.2% | `module_graph::ladder::package::field_entries` |
| 9 | 0.2% | `atomic::extract::identity::IdentityGraph::resolve` |
| 8 | 0.1% | `module_graph::walk::BindingWalk<L,F>::resolve_export` |
| 7 | 0.1% | `serde_core::de::impls::<impl serde_core::de::Deserialize for alloc::string::String>::deserialize` |
| 7 | 0.1% | `tasty::generator::util::emit_field` |
| 6 | 0.1% | `atomic::scan::scan` |
| 5 | 0.1% | `styletrace::analysis::parser::component::component_from_expression` |
| 5 | 0.1% | `tasty::scanner::packages::package_entry::first_existing_candidate` |

## memmove leaves by nearest .node ancestor

86wt of memmove leaves; 11wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 42 | 0.8% | `<alloc::string::String as core::clone::Clone>::clone` |
| 4 | 0.1% | `atomic::scan::scan` |
| 3 | 0.1% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 3 | 0.1% | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Mut,K,V,alloc::collections::btree::node::marker::Leaf>,alloc::collections::btree::node::marker::Edge>::insert_recursing` |
| 2 | 0.0% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 2 | 0.0% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 2 | 0.0% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |
| 2 | 0.0% | `atomic::extract_parallel::FileOut::commit` |
| 2 | 0.0% | `std::path::Path::_join` |
| 2 | 0.0% | `tasty::generator::util::indent_block` |
| 2 | 0.0% | `serde_json::ser::format_escaped_str` |
| 1 | 0.0% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type` |
| 1 | 0.0% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 1 | 0.0% | `std::sys::fs::metadata` |

## memcmp leaves by nearest .node ancestor

123wt of memcmp leaves; 1wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 63 | 1.2% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 30 | 0.6% | `core::slice::sort::stable::drift::sort` |
| 10 | 0.2% | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 10 | 0.2% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 3 | 0.1% | `<alloc::collections::btree::set::Difference<T,A> as core::iter::traits::iterator::Iterator>::next` |
| 3 | 0.1% | `tasty::ast::resolve::index::ExportFold::collect` |
| 1 | 0.0% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 1 | 0.0% | `tasty::scanner::packages::relative::candidate_matches` |
| 1 | 0.0% | `tasty::generator::symbols::reference_descriptor` |

## File opens by issuing frame

187wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 172 | 3.2% | `std::sys::fs::unix::File::open_c [reference-native.darwin-x64.node]` |
| 15 | 0.3% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

1800wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 1792 | 33.5% | `reference_native::atomic::__napi__compile_system → atomic::compile` |
| 1766 | 33.1% | `atomic::compile → std::thread::scoped::scope` |
| 1737 | 32.5% | `std::thread::scoped::scope → atomic::phase_parallel::drive_rounds` |
| 987 | 18.5% | `atomic::phase_parallel::drive_rounds → atomic::phase_merge::publish` |
| 985 | 18.4% | `atomic::phase_merge::publish → atomic::hosts::resolve_prepared` |
| 984 | 18.4% | `atomic::hosts::resolve_prepared → styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 984 | 18.4% | `styletrace::analysis::surface::trace_style_bindings_with_modules → styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 983 | 18.4% | `styletrace::analysis::surface::SurfaceTraceSession::trace_with → styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 967 | 18.1% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded → styletrace::analysis::parser::parse_trace_module` |
| 959 | 17.9% | `styletrace::analysis::parser::parse_trace_module → styletrace::analysis::parser::fold_trace_module` |
| 880 | 16.5% | `styletrace::analysis::parser::types::resolve_style_props_from_type_annotation → styletrace::resolver::tracer::collect_style_prop_names` |
| 843 | 15.8% | `styletrace::resolver::tracer::collect_style_prop_names → styletrace::resolver::tracer::resolve::resolve_reference_props` |
| 807 | 15.1% | `styletrace::resolver::tracer::resolve::resolve_reference_props → styletrace::resolver::tracer::resolve::resolve_decl_props` |
| 761 | 14.2% | `styletrace::resolver::tracer::resolve::resolve_decl_props → styletrace::resolver::tracer::resolve::resolve_combined_props` |
| 742 | 13.9% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings → styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 738 | 13.8% | `styletrace::resolver::tracer::resolve::resolve_combined_props → styletrace::resolver::tracer::resolve::resolve_prop_names` |
| 693 | 13.0% | `styletrace::analysis::parser::fold_trace_module → styletrace::analysis::parser::collect_variable_symbols` |
| 693 | 13.0% | `styletrace::analysis::parser::collect_variable_symbols → styletrace::analysis::parser::component::component_from_expression` |
| 687 | 12.9% | `styletrace::resolver::tracer::resolve::resolve_prop_names → styletrace::resolver::tracer::resolve::resolve_decl_props` |
| 563 | 10.5% | `atomic::phase_parallel::drive_rounds → std::sync::mpmc::list::Channel<T>::recv` |
| 563 | 10.5% | `std::sync::mpmc::list::Channel<T>::recv → std::sync::mpmc::list::Channel<T>::recv::{{closure}}` |
| 563 | 10.5% | `std::sync::mpmc::list::Channel<T>::recv::{{closure}} → std::thread::thread::Thread::park` |
| 486 | 9.1% | `styletrace::resolver::tracer::resolve::resolve_prop_names → styletrace::resolver::tracer::context::TraceContext::resolve_declaration` |
| 480 | 9.0% | `styletrace::resolver::tracer::resolve::resolve_prop_names → styletrace::resolver::tracer::resolve::resolve_prop_names` |
| 455 | 8.5% | `styletrace::analysis::parser::component::component_from_function_like → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 1009 | 955 | 95% | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 988 | 898 | 91% | `<alloc::string::String as core::clone::Clone>::clone` |
| 800 | 740 | 93% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 255 | 251 | 98% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 133 | 89 | 67% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 135 | 52 | 39% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 74 | 52 | 70% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 74 | 38 | 51% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 157 | 19 | 12% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 87 | 0 | 0% | `oxc_parser::lexer::Lexer::next_token` |
| 18 | 0 | 0% | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 26 | 0 | 0% | `std::io::default_read_to_end::small_probe_read` |
| 11 | 0 | 0% | `__rustc::__rust_dealloc` |
| 10 | 0 | 0% | `std::path::Components::parse_next_component_back` |
| 10 | 0 | 0% | `__rustc::__rust_no_alloc_shim_is_unstable_v2` |
