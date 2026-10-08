# Caller attribution: lib-styletrace (84faa918f)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `docs/evidence/flamegraph/styletrace-lib6`.
Derived 2026-09-30T16:10:12.655Z via `pnpm agentrs flame --callers docs/evidence/flamegraph/styletrace-lib6`; no re-record, bundle raws untouched.
Covers 3320 weight across 2924 main-thread samples. Shares below are of that weight unless noted.


## Callers of `free_tiny`

Inclusive 685wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 440 | 13.3% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 52 | 1.6% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 32 | 1.0% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 25 | 0.8% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 10 | 0.3% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 8 | 0.2% | `styletrace::analysis::parser::component::component_from_expression` |
| 8 | 0.2% | `core::ptr::drop_in_place<alloc::vec::Vec<indexmap::Bucket<alloc::string::String,serde_json::value::Value>>>` |
| 8 | 0.2% | `szone_realloc` |

## Callers of `tiny_malloc_should_clear`

Inclusive 673wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 673 | 20.3% | `szone_malloc_should_clear` |

## Callers of `semaphore_wait_trap`

Inclusive 277wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 277 | 8.3% | `_dispatch_sema4_wait` |

## Callers of `kevent`

Inclusive 213wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 213 | 6.4% | `uv__io_poll` |

## Callers of `__open`

Inclusive 148wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 148 | 4.5% | `open` |

## Callers of `tiny_free_no_lock`

Inclusive 305wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 305 | 9.2% | `free_tiny` |

## Callers of `tiny_malloc_from_free_list`

Inclusive 264wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 264 | 8.0% | `tiny_malloc_should_clear` |

## Callers of `stat$INODE64`

Inclusive 125wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 87 | 2.6% | `std::path::Path::is_file` |
| 32 | 1.0% | `std::path::Path::is_dir` |
| 4 | 0.1% | `uv__fs_work` |
| 2 | 0.1% | `std::sys::fs::metadata` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 120wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 36 | 1.1% | `0x7ff7b785d51f` |
| 13 | 0.4% | `core::slice::sort::stable::drift::sort` |
| 12 | 0.4% | `0x7ff7b785e4df` |
| 9 | 0.3% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 4 | 0.1% | `0x7ff7b785302f` |
| 3 | 0.1% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 2 | 0.1% | `0x7ff7b7852ecf` |
| 2 | 0.1% | `0x7ff7b7851aaf` |

## Callers of `rack_get_thread_index`

Inclusive 95wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 94 | 2.8% | `tiny_malloc_should_clear` |
| 1 | 0.0% | `small_malloc_should_clear` |

## Callers of `set_tiny_meta_header_in_use`

Inclusive 91wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 91 | 2.7% | `tiny_malloc_from_free_list` |

## Callers of `madvise`

Inclusive 87wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 87 | 2.6% | `mvm_madvise_plat` |

## Callers of `oxc_parser::lexer::Lexer::next_token`

Inclusive 71wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 0.3% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_lhs_expression_or_higher` |
| 6 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_member_expression_rest` |
| 4 | 0.1% | `oxc_parser::ts::statement::<impl oxc_parser::ParserImpl>::parse_ts_type_annotation` |
| 4 | 0.1% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type_name` |
| 4 | 0.1% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_type_arguments_of_type_reference` |
| 4 | 0.1% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type` |
| 3 | 0.1% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 3 | 0.1% | `oxc_parser::cursor::<impl oxc_parser::ParserImpl>::parse_delimited_list` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 80wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 36 | 1.1% | `styletrace::resolver::tracer::resolve::take_or_extend` |
| 29 | 0.9% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 8 | 0.2% | `styletrace::analysis::parser::component::component_from_function_like` |
| 2 | 0.1% | `tasty::ast::resolve::index::ExportFold::collect` |
| 2 | 0.1% | `tasty::scan::scan_typescript_bundle` |
| 1 | 0.0% | `atomic::runtime::plan::build_style_prop_names` |
| 1 | 0.0% | `atomic::extract::scope::table::ScopeTable::declare` |
| 1 | 0.0% | `tasty::ast::extract::module_bindings::exports::record_named_reexports` |

## Callers of `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push`

Inclusive 162wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 162 | 4.9% | `alloc::collections::btree::map::BTreeMap<K,V,A>::bulk_build_from_sorted_iter` |

## Callers of `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold`

Inclusive 523wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 523 | 15.8% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |

## Callers of `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next`

Inclusive 86wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 62 | 1.9% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 9 | 0.3% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 8 | 0.2% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 2 | 0.1% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 1 | 0.0% | `styletrace::analysis::parser::component::component_from_expression` |
| 1 | 0.0% | `styletrace::resolver::tracer::builtins::resolve_builtin_props` |
| 1 | 0.0% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 1 | 0.0% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |

## Callers of `<alloc::string::String as core::clone::Clone>::clone`

Inclusive 584wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 493 | 14.8% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 66 | 2.0% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 12 | 0.4% | `styletrace::resolver::tracer::resolve::take_or_extend` |
| 4 | 0.1% | `<alloc::vec::Vec<T,A> as core::clone::Clone>::clone` |
| 2 | 0.1% | `styletrace::resolver::parser::parse_module` |
| 2 | 0.1% | `tasty::scan::scan_typescript_bundle` |
| 1 | 0.0% | `atomic::diagnostics::proof::render::Proof::collect` |
| 1 | 0.0% | `tasty::ast::extract::pipeline::extract_file` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 64wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 18 | 0.5% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 15 | 0.5% | `std::path::Path::_join` |
| 6 | 0.2% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 3 | 0.1% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 3 | 0.1% | `core::slice::sort::stable::drift::sort` |
| 2 | 0.1% | `std::path::PathBuf::_push` |
| 2 | 0.1% | `module_graph::ladder::SpecifierLadder<F>::package_hit` |
| 2 | 0.1% | `atomic::extract_parallel::FileOut::commit` |

## Callers of `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.1% | `oxc_parser::lexer::byte_handlers::IDT` |
| 3 | 0.1% | `oxc_parser::lexer::byte_handlers::L_T` |
| 2 | 0.1% | `oxc_parser::lexer::byte_handlers::L_S` |
| 2 | 0.1% | `oxc_parser::lexer::byte_handlers::L_E` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_U` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_N` |

## Callers of `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize`

Inclusive 75wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 75 | 2.3% | `serde_json::de::from_trait` |

## Callers of `core::slice::sort::stable::drift::sort`

Inclusive 65wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 65 | 2.0% | `core::slice::sort::stable::driftsort_main` |

## Malloc-family leaves by nearest atomic/canon ancestor

997wt of malloc-family leaves; 13wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 678 | 20.4% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 29 | 0.9% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 24 | 0.7% | `styletrace::resolver::tracer::collect_style_prop_names` |
| 22 | 0.7% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 21 | 0.6% | `styletrace::resolver::tracer::context::TraceContext::resolve_declaration` |
| 19 | 0.6% | `styletrace::resolver::tracer::resolve::take_or_extend` |
| 18 | 0.5% | `module_graph::walk::BindingWalk<L,F>::record_copy` |
| 11 | 0.3% | `tasty::scan::scan_typescript_bundle` |
| 9 | 0.3% | `module_graph::walk::BindingWalk<L,F>::resolve_export` |
| 9 | 0.3% | `atomic::extract::identity::IdentityGraph::resolve` |
| 8 | 0.2% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 8 | 0.2% | `serde_core::de::impls::<impl serde_core::de::Deserialize for alloc::string::String>::deserialize` |
| 7 | 0.2% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 7 | 0.2% | `styletrace::analysis::parser::component::component_from_expression` |
| 6 | 0.2% | `tasty::scanner::packages::relative::declaration_candidates` |
| 5 | 0.2% | `styletrace::resolver::parser::property_name` |
| 5 | 0.2% | `module_graph::ladder::package::field_entries` |
| 5 | 0.2% | `atomic::compile` |

## memmove leaves by nearest .node ancestor

40wt of memmove leaves; 7wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 16 | 0.5% | `<alloc::string::String as core::clone::Clone>::clone` |
| 4 | 0.1% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 2 | 0.1% | `atomic::scan::scan` |
| 2 | 0.1% | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Mut,K,V,alloc::collections::btree::node::marker::Leaf>,alloc::collections::btree::node::marker::Edge>::insert_recursing` |
| 1 | 0.0% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |
| 1 | 0.0% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type` |
| 1 | 0.0% | `oxc_parser::jsx::<impl oxc_parser::ParserImpl>::parse_jsx_element` |
| 1 | 0.0% | `module_graph::ladder::join_with` |
| 1 | 0.0% | `atomic::extract::scope::table::ScopeTable::declare` |
| 1 | 0.0% | `oxc_parser::js::binding::<impl oxc_parser::ParserImpl>::parse_array_binding_pattern` |
| 1 | 0.0% | `tasty::scanner::packages::node_modules::installed_package_dirs` |
| 1 | 0.0% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 1 | 0.0% | `tasty::generator::util::indent_block` |

## memcmp leaves by nearest .node ancestor

120wt of memcmp leaves; 1wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 50 | 1.5% | `core::slice::sort::stable::drift::sort` |
| 31 | 0.9% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 16 | 0.5% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 10 | 0.3% | `<alloc::vec::into_iter::IntoIter<T,A> as core::iter::traits::iterator::Iterator>::try_fold` |
| 2 | 0.1% | `canon::css::find_property` |
| 2 | 0.1% | `tasty::ast::resolve::index::ExportFold::collect` |
| 1 | 0.0% | `std::path::Path::_join` |
| 1 | 0.0% | `atomic::extract::constants::index::LocalConstants::get_object_prop` |
| 1 | 0.0% | `<Q as hashbrown::Equivalent<K>>::equivalent` |
| 1 | 0.0% | `base_system::lower::LoweringContext::walk` |
| 1 | 0.0% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 1 | 0.0% | `tasty::scanner::packages::relative::candidate_matches` |
| 1 | 0.0% | `core::slice::sort::stable::quicksort::quicksort` |
| 1 | 0.0% | `alloc::collections::btree::map::BTreeMap<K,V,A>::remove` |

## File opens by issuing frame

148wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 141 | 4.2% | `std::sys::fs::unix::File::open_c [reference-native.darwin-x64.node]` |
| 7 | 0.2% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

946wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 938 | 28.3% | `reference_native::atomic::__napi__compile_system → atomic::compile` |
| 912 | 27.5% | `atomic::compile → std::thread::scoped::scope` |
| 884 | 26.6% | `std::thread::scoped::scope → atomic::phase_parallel::drive_rounds` |
| 460 | 13.9% | `atomic::phase_parallel::drive_rounds → atomic::phase_merge::publish` |
| 458 | 13.8% | `atomic::phase_merge::publish → atomic::hosts::resolve_prepared` |
| 456 | 13.7% | `atomic::hosts::resolve_prepared → styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 456 | 13.7% | `styletrace::analysis::surface::trace_style_bindings_with_modules → styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 456 | 13.7% | `styletrace::analysis::surface::SurfaceTraceSession::trace_with → styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 448 | 13.5% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded → styletrace::analysis::parser::parse_trace_module` |
| 440 | 13.3% | `styletrace::analysis::parser::parse_trace_module → styletrace::analysis::parser::fold_trace_module` |
| 358 | 10.8% | `styletrace::analysis::parser::types::resolve_style_props_from_type_annotation → styletrace::resolver::tracer::collect_style_prop_names` |
| 347 | 10.5% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings → styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 315 | 9.5% | `styletrace::resolver::tracer::collect_style_prop_names → styletrace::resolver::tracer::resolve::resolve_reference_props` |
| 313 | 9.4% | `styletrace::analysis::parser::fold_trace_module → styletrace::analysis::parser::collect_variable_symbols` |
| 313 | 9.4% | `styletrace::analysis::parser::collect_variable_symbols → styletrace::analysis::parser::component::component_from_expression` |
| 283 | 8.5% | `styletrace::resolver::tracer::resolve::resolve_reference_props → styletrace::resolver::tracer::resolve::resolve_decl_props_into` |
| 283 | 8.5% | `styletrace::resolver::tracer::resolve::resolve_decl_props_into → styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 277 | 8.3% | `atomic::phase_parallel::drive_rounds → std::sync::mpmc::list::Channel<T>::recv` |
| 277 | 8.3% | `std::sync::mpmc::list::Channel<T>::recv → std::sync::mpmc::list::Channel<T>::recv::{{closure}}` |
| 277 | 8.3% | `std::sync::mpmc::list::Channel<T>::recv::{{closure}} → std::thread::thread::Thread::park` |
| 251 | 7.6% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into → styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 205 | 6.2% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into → styletrace::resolver::tracer::resolve::resolve_decl_props_into` |
| 192 | 5.8% | `styletrace::analysis::parser::component::component_from_expression → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |
| 191 | 5.8% | `styletrace::analysis::parser::component::component_from_function_like → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |
| 188 | 5.7% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into → styletrace::resolver::tracer::builtins::resolve_builtin_props` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 1495 | 1112 | 74% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 584 | 545 | 93% | `<alloc::string::String as core::clone::Clone>::clone` |
| 523 | 495 | 95% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 162 | 115 | 71% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 64 | 44 | 69% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 75 | 38 | 51% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 152 | 35 | 23% | `<alloc::vec::into_iter::IntoIter<T,A> as core::iter::traits::iterator::Iterator>::try_fold` |
| 86 | 34 | 40% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 40 | 23 | 57% | `<serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize::ValueVisitor as serde_core::de::Visitor>::visit_map` |
| 80 | 16 | 20% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 119 | 13 | 11% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_assignment_expression_or_higher_impl` |
| 65 | 3 | 5% | `core::slice::sort::stable::drift::sort` |
| 71 | 0 | 0% | `oxc_parser::lexer::Lexer::next_token` |
| 12 | 0 | 0% | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 10 | 0 | 0% | `std::path::Components::parse_next_component_back` |
