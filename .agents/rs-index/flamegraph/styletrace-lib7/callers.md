# Caller attribution: lib-styletrace (ec4f6f725)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `docs/evidence/flamegraph/styletrace-lib7`.
Derived 2026-09-30T16:11:52.219Z via `pnpm agentrs flame --callers docs/evidence/flamegraph/styletrace-lib7`; no re-record, bundle raws untouched.
Covers 3371 weight across 2953 main-thread samples. Shares below are of that weight unless noted.


## Callers of `free_tiny`

Inclusive 628wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 412 | 12.2% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 46 | 1.4% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 33 | 1.0% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 20 | 0.6% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 11 | 0.3% | `szone_realloc` |
| 11 | 0.3% | `core::ptr::drop_in_place<alloc::vec::Vec<indexmap::Bucket<alloc::string::String,serde_json::value::Value>>>` |
| 9 | 0.3% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 8 | 0.2% | `core::ptr::drop_in_place<styletrace::resolver::tracer::context::TraceSession>` |

## Callers of `tiny_malloc_should_clear`

Inclusive 706wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 706 | 20.9% | `szone_malloc_should_clear` |

## Callers of `semaphore_wait_trap`

Inclusive 283wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 282 | 8.4% | `_dispatch_sema4_wait` |
| 1 | 0.0% | `uv_sem_wait` |

## Callers of `kevent`

Inclusive 219wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 219 | 6.5% | `uv__io_poll` |

## Callers of `stat$INODE64`

Inclusive 148wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 101 | 3.0% | `std::path::Path::is_file` |
| 37 | 1.1% | `std::path::Path::is_dir` |
| 6 | 0.2% | `std::sys::fs::metadata` |
| 4 | 0.1% | `uv__fs_work` |

## Callers of `madvise`

Inclusive 146wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 146 | 4.3% | `mvm_madvise_plat` |

## Callers of `tiny_malloc_from_free_list`

Inclusive 295wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 295 | 8.8% | `tiny_malloc_should_clear` |

## Callers of `__open`

Inclusive 136wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 136 | 4.0% | `open` |

## Callers of `tiny_free_no_lock`

Inclusive 297wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 297 | 8.8% | `free_tiny` |

## Callers of `set_tiny_meta_header_in_use`

Inclusive 110wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 109 | 3.2% | `tiny_malloc_from_free_list` |
| 1 | 0.0% | `tiny_try_realloc_in_place` |

## Callers of `tiny_free_list_add_ptr`

Inclusive 107wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 89 | 2.6% | `tiny_free_no_lock` |
| 17 | 0.5% | `tiny_malloc_from_free_list` |
| 1 | 0.0% | `tiny_try_realloc_in_place` |

## Callers of `rack_get_thread_index`

Inclusive 104wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 103 | 3.1% | `tiny_malloc_should_clear` |
| 1 | 0.0% | `small_malloc_should_clear` |

## Callers of `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push`

Inclusive 208wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 208 | 6.2% | `alloc::collections::btree::map::BTreeMap<K,V,A>::bulk_build_from_sorted_iter` |

## Callers of `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next`

Inclusive 86wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 60 | 1.8% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 8 | 0.2% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 4 | 0.1% | `styletrace::resolver::tracer::builtins::resolve_builtin_props` |
| 4 | 0.1% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 3 | 0.1% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 2 | 0.1% | `styletrace::analysis::parser::component::component_from_expression` |
| 2 | 0.1% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 1 | 0.0% | `core::ptr::drop_in_place<styletrace::resolver::tracer::context::TraceSession>` |

## Callers of `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold`

Inclusive 574wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 574 | 17.0% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 84wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 34 | 1.0% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 32 | 0.9% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 11 | 0.3% | `styletrace::analysis::parser::component::component_from_function_like` |
| 2 | 0.1% | `tasty::ast::extract::module_bindings::exports::record_named_reexports` |
| 1 | 0.0% | `styletrace::resolver::tracer::resolve::resolve_decl_props_into` |
| 1 | 0.0% | `styletrace::resolver::tracer::resolve::resolve_literal_names_into` |
| 1 | 0.0% | `module_graph::record::ExportTable::insert_exported` |
| 1 | 0.0% | `module_graph::record::collect::statement` |

## Callers of `oxc_parser::lexer::Lexer::next_token`

Inclusive 79wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_primary_expression` |
| 6 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_lhs_expression_or_higher` |
| 6 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_member_expression_rest` |
| 5 | 0.1% | `oxc_parser::cursor::<impl oxc_parser::ParserImpl>::parse_normal_list` |
| 4 | 0.1% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type` |
| 4 | 0.1% | `oxc_parser::ts::statement::<impl oxc_parser::ParserImpl>::parse_ts_type_annotation` |
| 3 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binary_expression_or_higher` |
| 3 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_assignment_expression_or_higher_impl` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 78wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 21 | 0.6% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 14 | 0.4% | `std::path::Path::_join` |
| 7 | 0.2% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 7 | 0.2% | `tasty::generator::util::emit_object` |
| 5 | 0.1% | `core::slice::sort::stable::drift::sort` |
| 5 | 0.1% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.1% | `std::path::PathBuf::_push` |
| 3 | 0.1% | `tasty::scanner::workspace::crawler::Crawler::run` |

## Callers of `<alloc::string::String as core::clone::Clone>::clone`

Inclusive 639wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 541 | 16.0% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 71 | 2.1% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 9 | 0.3% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 4 | 0.1% | `<alloc::vec::Vec<T,A> as core::clone::Clone>::clone` |
| 2 | 0.1% | `module_graph::walk::BindingWalk<L,F>::resolve_export` |
| 2 | 0.1% | `tasty::ast::extract::pipeline::extract_file` |
| 1 | 0.0% | `styletrace::resolver::parser::parse_module` |
| 1 | 0.0% | `<atomic::extract::resolver::source::AtomicFs as module_graph::fs::FileSystem>::read_to_string` |

## Callers of `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler`

Inclusive 18wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.2% | `oxc_parser::lexer::byte_handlers::IDT` |
| 4 | 0.1% | `oxc_parser::lexer::byte_handlers::L_C` |
| 2 | 0.1% | `oxc_parser::lexer::byte_handlers::L_P` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_O` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_S` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_T` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_R` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_I` |

## Callers of `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize`

Inclusive 72wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 72 | 2.1% | `serde_json::de::from_trait` |

## Callers of `core::slice::sort::stable::drift::sort`

Inclusive 51wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 51 | 1.5% | `core::slice::sort::stable::driftsort_main` |

## Malloc-family leaves by nearest atomic/canon ancestor

1017wt of malloc-family leaves; 9wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 706 | 20.9% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 27 | 0.8% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 27 | 0.8% | `styletrace::resolver::tracer::collect_style_prop_names` |
| 25 | 0.7% | `styletrace::resolver::tracer::context::TraceContext::resolve_declaration` |
| 22 | 0.7% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 20 | 0.6% | `module_graph::walk::BindingWalk<L,F>::record_copy` |
| 16 | 0.5% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 11 | 0.3% | `module_graph::walk::BindingWalk<L,F>::resolve_export` |
| 11 | 0.3% | `atomic::extract::identity::IdentityGraph::resolve` |
| 10 | 0.3% | `module_graph::ladder::package::field_entries` |
| 9 | 0.3% | `styletrace::resolver::tracer::resolve::resolve_literal_names_into` |
| 8 | 0.2% | `tasty::scanner::packages::relative::declaration_candidates` |
| 7 | 0.2% | `styletrace::analysis::parser::component::component_from_function_like` |
| 7 | 0.2% | `serde_core::de::impls::<impl serde_core::de::Deserialize for alloc::string::String>::deserialize` |
| 6 | 0.2% | `styletrace::analysis::parser::component::component_from_expression` |
| 6 | 0.2% | `tasty::scanner::paths::package::external_package_path_for_file_id` |
| 6 | 0.2% | `tasty::scanner::packages::relative::resolve_relative_import` |
| 6 | 0.2% | `tasty::generator::util::emit_object` |

## memmove leaves by nearest .node ancestor

54wt of memmove leaves; 9wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 22 | 0.7% | `<alloc::string::String as core::clone::Clone>::clone` |
| 7 | 0.2% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 1 | 0.0% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 1 | 0.0% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type` |
| 1 | 0.0% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 1 | 0.0% | `<serde_json::value::de::KeyClassifier as serde_core::de::DeserializeSeed>::deserialize` |
| 1 | 0.0% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 1 | 0.0% | `atomic::phase_commit::settle` |
| 1 | 0.0% | `atomic::extract_parallel::FileOut::commit` |
| 1 | 0.0% | `atomic::runtime::serializer::serialize_lookup_key` |
| 1 | 0.0% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_import_specifiers` |
| 1 | 0.0% | `oxc_parser::cursor::<impl oxc_parser::ParserImpl>::parse_delimited_list` |
| 1 | 0.0% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |
| 1 | 0.0% | `tasty::scanner::packages::node_modules::installed_package_dirs` |

## memcmp leaves by nearest .node ancestor

100wt of memcmp leaves; 1wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 33 | 1.0% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 33 | 1.0% | `core::slice::sort::stable::drift::sort` |
| 11 | 0.3% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 9 | 0.3% | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 3 | 0.1% | `tasty::ast::resolve::index::ExportFold::collect` |
| 2 | 0.1% | `<alloc::collections::btree::set::Difference<T,A> as core::iter::traits::iterator::Iterator>::next` |
| 1 | 0.0% | `atomic::extract::constants::index::LocalConstants::merge` |
| 1 | 0.0% | `module_graph::graph::ModuleGraph<L>::ensure` |
| 1 | 0.0% | `canon::css::find_property` |
| 1 | 0.0% | `typegen::emit::props::PropDefs::collect` |
| 1 | 0.0% | `oxc_parser::jsx::<impl oxc_parser::ParserImpl>::parse_jsx_element` |
| 1 | 0.0% | `tasty::scanner::packages::relative::candidate_matches` |
| 1 | 0.0% | `alloc::collections::btree::map::BTreeMap<K,V,A>::remove` |
| 1 | 0.0% | `alloc::collections::btree::search::<impl alloc::collections::btree::node::NodeRef<BorrowType,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::search_tree` |

## File opens by issuing frame

136wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 129 | 3.8% | `std::sys::fs::unix::File::open_c [reference-native.darwin-x64.node]` |
| 7 | 0.2% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

952wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 943 | 28.0% | `reference_native::atomic::__napi__compile_system → atomic::compile` |
| 917 | 27.2% | `atomic::compile → std::thread::scoped::scope` |
| 887 | 26.3% | `std::thread::scoped::scope → atomic::phase_parallel::drive_rounds` |
| 456 | 13.5% | `atomic::phase_parallel::drive_rounds → atomic::phase_merge::publish` |
| 454 | 13.5% | `atomic::phase_merge::publish → atomic::hosts::resolve_prepared` |
| 452 | 13.4% | `atomic::hosts::resolve_prepared → styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 452 | 13.4% | `styletrace::analysis::surface::trace_style_bindings_with_modules → styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 451 | 13.4% | `styletrace::analysis::surface::SurfaceTraceSession::trace_with → styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 447 | 13.3% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded → styletrace::analysis::parser::parse_trace_module` |
| 436 | 12.9% | `styletrace::analysis::parser::parse_trace_module → styletrace::analysis::parser::fold_trace_module` |
| 358 | 10.6% | `styletrace::analysis::parser::types::resolve_style_props_from_type_annotation → styletrace::resolver::tracer::collect_style_prop_names` |
| 346 | 10.3% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings → styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 315 | 9.3% | `styletrace::resolver::tracer::collect_style_prop_names → styletrace::resolver::tracer::resolve::resolve_reference_props` |
| 305 | 9.0% | `styletrace::analysis::parser::fold_trace_module → styletrace::analysis::parser::collect_variable_symbols` |
| 305 | 9.0% | `styletrace::analysis::parser::collect_variable_symbols → styletrace::analysis::parser::component::component_from_expression` |
| 282 | 8.4% | `atomic::phase_parallel::drive_rounds → std::sync::mpmc::list::Channel<T>::recv` |
| 282 | 8.4% | `std::sync::mpmc::list::Channel<T>::recv → std::sync::mpmc::list::Channel<T>::recv::{{closure}}` |
| 282 | 8.4% | `std::sync::mpmc::list::Channel<T>::recv::{{closure}} → std::thread::thread::Thread::park` |
| 278 | 8.2% | `styletrace::resolver::tracer::resolve::resolve_reference_props → styletrace::resolver::tracer::resolve::resolve_decl_props_into` |
| 278 | 8.2% | `styletrace::resolver::tracer::resolve::resolve_decl_props_into → styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 245 | 7.3% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into → styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 200 | 5.9% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into → styletrace::resolver::tracer::resolve::resolve_decl_props_into` |
| 197 | 5.8% | `styletrace::analysis::parser::component::component_from_function_like → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |
| 189 | 5.6% | `styletrace::resolver::tracer::context::TraceContext::resolve_declaration → styletrace::resolver::parser::parse_module` |
| 179 | 5.3% | `styletrace::analysis::parser::component::component_from_expression → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 858 | 795 | 93% | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 639 | 595 | 93% | `<alloc::string::String as core::clone::Clone>::clone` |
| 574 | 545 | 95% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 208 | 163 | 78% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 83 | 75 | 90% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 78 | 53 | 68% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 72 | 37 | 51% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 86 | 35 | 41% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 84 | 23 | 27% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 27 | 14 | 52% | `indexmap::map::IndexMap<K,V,S>::insert_full` |
| 51 | 5 | 10% | `core::slice::sort::stable::drift::sort` |
| 118 | 5 | 4% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binary_expression_or_higher` |
| 79 | 1 | 1% | `oxc_parser::lexer::Lexer::next_token` |
| 19 | 1 | 5% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_member_expression_rest` |
| 18 | 0 | 0% | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
