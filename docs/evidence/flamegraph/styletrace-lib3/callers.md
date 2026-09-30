# Caller attribution: lib-styletrace (e9387f5ec)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `docs/evidence/flamegraph/styletrace-lib3`.
Derived 2026-09-30T16:08:40.105Z via `pnpm agentrs flame --callers docs/evidence/flamegraph/styletrace-lib3`; no re-record, bundle raws untouched.
Covers 3471 weight across 3016 main-thread samples. Shares below are of that weight unless noted.


## Callers of `free_tiny`

Inclusive 622wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 400 | 11.5% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 66 | 1.9% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 25 | 0.7% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 18 | 0.5% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 11 | 0.3% | `szone_realloc` |
| 8 | 0.2% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 7 | 0.2% | `core::ptr::drop_in_place<serde_json::value::Value>` |
| 7 | 0.2% | `<alloc::vec::Vec<T,A> as core::ops::drop::Drop>::drop` |

## Callers of `semaphore_wait_trap`

Inclusive 323wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 323 | 9.3% | `_dispatch_sema4_wait` |

## Callers of `tiny_malloc_should_clear`

Inclusive 716wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 716 | 20.6% | `szone_malloc_should_clear` |

## Callers of `kevent`

Inclusive 222wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 222 | 6.4% | `uv__io_poll` |

## Callers of `__open`

Inclusive 153wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 153 | 4.4% | `open` |

## Callers of `tiny_malloc_from_free_list`

Inclusive 298wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 298 | 8.6% | `tiny_malloc_should_clear` |

## Callers of `stat$INODE64`

Inclusive 131wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 88 | 2.5% | `std::path::Path::is_file` |
| 36 | 1.0% | `std::path::Path::is_dir` |
| 4 | 0.1% | `std::sys::fs::metadata` |
| 3 | 0.1% | `uv__fs_work` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 131wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 27 | 0.8% | `0x7ff7bb53f51f` |
| 10 | 0.3% | `core::slice::sort::stable::drift::sort` |
| 8 | 0.2% | `0x7ff7bb5404df` |
| 6 | 0.2% | `0x7ff7bb5351ef` |
| 4 | 0.1% | `0x7ff7bb53461f` |
| 3 | 0.1% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 3 | 0.1% | `0x7ff7bb53371f` |
| 3 | 0.1% | `0x7ff7bb533e5f` |

## Callers of `madvise`

Inclusive 128wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 128 | 3.7% | `mvm_madvise_plat` |

## Callers of `rack_get_thread_index`

Inclusive 114wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 114 | 3.3% | `tiny_malloc_should_clear` |

## Callers of `tiny_free_no_lock`

Inclusive 253wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 253 | 7.3% | `free_tiny` |

## Callers of `set_tiny_meta_header_in_use`

Inclusive 112wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 109 | 3.1% | `tiny_malloc_from_free_list` |
| 3 | 0.1% | `tiny_try_realloc_in_place` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 153wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 83 | 2.4% | `styletrace::resolver::tracer::resolve::resolve_combined_props` |
| 35 | 1.0% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 17 | 0.5% | `styletrace::resolver::tracer::resolve::resolve_combined_literals` |
| 11 | 0.3% | `styletrace::analysis::parser::component::component_from_function_like` |
| 2 | 0.1% | `atomic::extract::scope::table::ScopeTable::declare` |
| 2 | 0.1% | `tasty::ast::resolve::index::ExportFold::collect` |
| 1 | 0.0% | `styletrace::resolver::tracer::resolve::resolve_prop_names` |
| 1 | 0.0% | `atomic::extract::harvest::literals::HarvestPool::merge` |

## Callers of `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push`

Inclusive 192wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 192 | 5.5% | `alloc::collections::btree::map::BTreeMap<K,V,A>::bulk_build_from_sorted_iter` |

## Callers of `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next`

Inclusive 102wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 63 | 1.8% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 10 | 0.3% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 7 | 0.2% | `styletrace::resolver::tracer::resolve::resolve_combined_props` |
| 6 | 0.2% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 3 | 0.1% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 3 | 0.1% | `styletrace::resolver::tracer::resolve::resolve_prop_names` |
| 2 | 0.1% | `styletrace::analysis::parser::component::component_from_function_like` |
| 2 | 0.1% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 68wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 15 | 0.4% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 14 | 0.4% | `std::path::Path::_join` |
| 10 | 0.3% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 5 | 0.1% | `std::path::PathBuf::_push` |
| 4 | 0.1% | `core::slice::sort::stable::drift::sort` |
| 3 | 0.1% | `atomic::extract_parallel::FileOut::commit` |
| 3 | 0.1% | `<alloc::string::String as core::clone::Clone>::clone` |
| 2 | 0.1% | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |

## Callers of `oxc_parser::lexer::Lexer::next_token`

Inclusive 70wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_lhs_expression_or_higher` |
| 6 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_literal_string` |
| 4 | 0.1% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_block` |
| 4 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binary_expression_or_higher` |
| 4 | 0.1% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type` |
| 4 | 0.1% | `oxc_parser::jsx::<impl oxc_parser::ParserImpl>::parse_jsx_expression_container` |
| 4 | 0.1% | `oxc_parser::js::object::<impl oxc_parser::ParserImpl>::parse_property_name` |
| 4 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_identifier_expression` |

## Callers of `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold`

Inclusive 566wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 566 | 16.3% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |

## Callers of `<alloc::string::String as core::clone::Clone>::clone`

Inclusive 645wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 543 | 15.6% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 83 | 2.4% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 5 | 0.1% | `<alloc::vec::Vec<T,A> as core::clone::Clone>::clone` |
| 3 | 0.1% | `tasty::ast::extract::pipeline::extract_file` |
| 2 | 0.1% | `tasty::scan::scan_typescript_bundle` |
| 2 | 0.1% | `<tasty::model::TypeRef as core::clone::Clone>::clone` |
| 1 | 0.0% | `<module_graph::walk::Refused as core::clone::Clone>::clone` |
| 1 | 0.0% | `atomic::extract::resolver::ValueGraph::resolve_binding` |

## Callers of `std::path::Components::parse_next_component_back`

Inclusive 19wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 19 | 0.5% | `<std::path::Components as core::iter::traits::double_ended::DoubleEndedIterator>::next_back` |

## Callers of `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler`

Inclusive 17wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.1% | `oxc_parser::lexer::byte_handlers::IDT` |
| 3 | 0.1% | `oxc_parser::lexer::byte_handlers::L_C` |
| 2 | 0.1% | `oxc_parser::lexer::byte_handlers::L_R` |
| 2 | 0.1% | `oxc_parser::lexer::byte_handlers::L_A` |
| 2 | 0.1% | `oxc_parser::lexer::byte_handlers::L_N` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_F` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_P` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_I` |

## Callers of `__rustc::__rust_dealloc`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.1% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 3 | 0.1% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 2 | 0.1% | `<alloc::vec::Vec<T,A> as core::ops::drop::Drop>::drop` |
| 1 | 0.0% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 1 | 0.0% | `styletrace::analysis::parser::component::component_from_expression` |
| 1 | 0.0% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 1 | 0.0% | `core::ptr::drop_in_place<serde_json::value::Value>` |

## Malloc-family leaves by nearest atomic/canon ancestor

970wt of malloc-family leaves; 6wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 658 | 19.0% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 28 | 0.8% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 22 | 0.6% | `styletrace::resolver::tracer::collect_style_prop_names` |
| 21 | 0.6% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 20 | 0.6% | `styletrace::resolver::tracer::resolve::resolve_prop_names` |
| 20 | 0.6% | `styletrace::resolver::tracer::context::TraceContext::resolve_declaration` |
| 17 | 0.5% | `module_graph::walk::BindingWalk<L,F>::record_copy` |
| 14 | 0.4% | `styletrace::resolver::tracer::resolve::resolve_literal_names` |
| 10 | 0.3% | `module_graph::walk::BindingWalk<L,F>::resolve_export` |
| 10 | 0.3% | `tasty::scanner::packages::relative::declaration_candidates` |
| 8 | 0.2% | `atomic::extract::identity::IdentityGraph::resolve` |
| 8 | 0.2% | `tasty::scan::scan_typescript_bundle` |
| 7 | 0.2% | `styletrace::analysis::parser::component::component_from_expression` |
| 7 | 0.2% | `styletrace::analysis::parser::component::component_from_function_like` |
| 7 | 0.2% | `tasty::scanner::packages::relative::candidate_matches` |
| 6 | 0.2% | `tasty::scanner::packages::package_entry::find_installed_declaration_provider` |
| 5 | 0.1% | `styletrace::resolver::tracer::resolve::resolve_combined_props` |
| 5 | 0.1% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |

## memmove leaves by nearest .node ancestor

54wt of memmove leaves; 12wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 21 | 0.6% | `<alloc::string::String as core::clone::Clone>::clone` |
| 4 | 0.1% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 2 | 0.1% | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Mut,K,V,alloc::collections::btree::node::marker::Leaf>,alloc::collections::btree::node::marker::Edge>::insert_recursing` |
| 2 | 0.1% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 1 | 0.0% | `atomic::scan::scan` |
| 1 | 0.0% | `<serde_json::de::MapAccess<R> as serde_core::de::MapAccess>::next_key_seed` |
| 1 | 0.0% | `oxc_parser::cursor::<impl oxc_parser::ParserImpl>::parse_delimited_list` |
| 1 | 0.0% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type` |
| 1 | 0.0% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::export_is_traced` |
| 1 | 0.0% | `std::sys::fs::metadata` |
| 1 | 0.0% | `module_graph::key::join_under` |
| 1 | 0.0% | `module_graph::walk::BindingWalk<L,F>::local_step` |
| 1 | 0.0% | `alloc::str::join_generic_copy` |
| 1 | 0.0% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |

## memcmp leaves by nearest .node ancestor

131wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 57 | 1.6% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 38 | 1.1% | `core::slice::sort::stable::drift::sort` |
| 16 | 0.5% | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 10 | 0.3% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 6 | 0.2% | `<alloc::collections::btree::set::Difference<T,A> as core::iter::traits::iterator::Iterator>::next` |
| 2 | 0.1% | `tasty::ast::resolve::index::ExportFold::collect` |
| 1 | 0.0% | `module_graph::ladder::join_with` |
| 1 | 0.0% | `<std::path::Component as core::cmp::PartialEq>::eq` |

## File opens by issuing frame

153wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 144 | 4.1% | `std::sys::fs::unix::File::open_c [reference-native.darwin-x64.node]` |
| 9 | 0.3% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

1080wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 1073 | 30.9% | `reference_native::atomic::__napi__compile_system → atomic::compile` |
| 1047 | 30.2% | `atomic::compile → std::thread::scoped::scope` |
| 1018 | 29.3% | `std::thread::scoped::scope → atomic::phase_parallel::drive_rounds` |
| 547 | 15.8% | `atomic::phase_parallel::drive_rounds → atomic::phase_merge::publish` |
| 545 | 15.7% | `atomic::phase_merge::publish → atomic::hosts::resolve_prepared` |
| 543 | 15.6% | `atomic::hosts::resolve_prepared → styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 543 | 15.6% | `styletrace::analysis::surface::trace_style_bindings_with_modules → styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 542 | 15.6% | `styletrace::analysis::surface::SurfaceTraceSession::trace_with → styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 533 | 15.4% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded → styletrace::analysis::parser::parse_trace_module` |
| 525 | 15.1% | `styletrace::analysis::parser::parse_trace_module → styletrace::analysis::parser::fold_trace_module` |
| 434 | 12.5% | `styletrace::analysis::parser::types::resolve_style_props_from_type_annotation → styletrace::resolver::tracer::collect_style_prop_names` |
| 413 | 11.9% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings → styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 401 | 11.6% | `styletrace::resolver::tracer::collect_style_prop_names → styletrace::resolver::tracer::resolve::resolve_reference_props` |
| 376 | 10.8% | `styletrace::analysis::parser::fold_trace_module → styletrace::analysis::parser::collect_variable_symbols` |
| 376 | 10.8% | `styletrace::analysis::parser::collect_variable_symbols → styletrace::analysis::parser::component::component_from_expression` |
| 371 | 10.7% | `styletrace::resolver::tracer::resolve::resolve_reference_props → styletrace::resolver::tracer::resolve::resolve_decl_props` |
| 333 | 9.6% | `styletrace::resolver::tracer::resolve::resolve_decl_props → styletrace::resolver::tracer::resolve::resolve_combined_props` |
| 323 | 9.3% | `atomic::phase_parallel::drive_rounds → std::sync::mpmc::list::Channel<T>::recv` |
| 323 | 9.3% | `std::sync::mpmc::list::Channel<T>::recv → std::sync::mpmc::list::Channel<T>::recv::{{closure}}` |
| 323 | 9.3% | `std::sync::mpmc::list::Channel<T>::recv::{{closure}} → std::thread::thread::Thread::park` |
| 318 | 9.2% | `styletrace::resolver::tracer::resolve::resolve_combined_props → styletrace::resolver::tracer::resolve::resolve_prop_names` |
| 277 | 8.0% | `styletrace::resolver::tracer::resolve::resolve_prop_names → styletrace::resolver::tracer::resolve::resolve_decl_props` |
| 233 | 6.7% | `styletrace::analysis::parser::component::component_from_expression → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |
| 230 | 6.6% | `styletrace::analysis::parser::component::component_from_function_like → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |
| 196 | 5.6% | `styletrace::resolver::tracer::resolve::resolve_prop_names → styletrace::resolver::tracer::resolve::resolve_prop_names` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 645 | 603 | 93% | `<alloc::string::String as core::clone::Clone>::clone` |
| 566 | 544 | 96% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 192 | 145 | 76% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 68 | 42 | 62% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 102 | 35 | 34% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 153 | 25 | 16% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 105 | 14 | 13% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_lhs_expression_or_higher` |
| 109 | 14 | 13% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binary_expression_or_higher` |
| 26 | 11 | 42% | `indexmap::map::IndexMap<K,V,S>::insert_full` |
| 51 | 4 | 8% | `core::slice::sort::stable::drift::sort` |
| 70 | 1 | 1% | `oxc_parser::lexer::Lexer::next_token` |
| 19 | 0 | 0% | `std::path::Components::parse_next_component_back` |
| 17 | 0 | 0% | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 13 | 0 | 0% | `__rustc::__rust_dealloc` |
| 8 | 0 | 0% | `__rustc::__rust_alloc` |
