# Caller attribution: lib-styletrace (e9387f5ec)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `docs/evidence/flamegraph/styletrace-lib4`.
Derived 2026-09-30T16:08:40.435Z via `pnpm agentrs flame --callers docs/evidence/flamegraph/styletrace-lib4`; no re-record, bundle raws untouched.
Covers 3427 weight across 2984 main-thread samples. Shares below are of that weight unless noted.


## Callers of `tiny_malloc_should_clear`

Inclusive 722wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 722 | 21.1% | `szone_malloc_should_clear` |

## Callers of `semaphore_wait_trap`

Inclusive 321wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 321 | 9.4% | `_dispatch_sema4_wait` |

## Callers of `free_tiny`

Inclusive 682wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 421 | 12.3% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 82 | 2.4% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 31 | 0.9% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 19 | 0.6% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 10 | 0.3% | `core::ptr::drop_in_place<styletrace::resolver::tracer::context::TraceSession>` |
| 9 | 0.3% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 9 | 0.3% | `core::ptr::drop_in_place<alloc::vec::Vec<indexmap::Bucket<alloc::string::String,serde_json::value::Value>>>` |
| 6 | 0.2% | `<hashbrown::raw::RawTable<T,A> as core::ops::drop::Drop>::drop` |

## Callers of `kevent`

Inclusive 224wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 224 | 6.5% | `uv__io_poll` |

## Callers of `tiny_free_no_lock`

Inclusive 321wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 321 | 9.4% | `free_tiny` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 133wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 28 | 0.8% | `0x7ff7be9c451f` |
| 11 | 0.3% | `core::slice::sort::stable::drift::sort` |
| 10 | 0.3% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 9 | 0.3% | `0x7ff7be9c54df` |
| 3 | 0.1% | `0x7ff7be9b93df` |
| 3 | 0.1% | `0x7ff7be9b8bbf` |
| 3 | 0.1% | `0x7ff7be9b897f` |
| 3 | 0.1% | `0x7ff7be9b9e2f` |

## Callers of `tiny_malloc_from_free_list`

Inclusive 283wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 283 | 8.3% | `tiny_malloc_should_clear` |

## Callers of `stat$INODE64`

Inclusive 125wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 75 | 2.2% | `std::path::Path::is_file` |
| 39 | 1.1% | `std::path::Path::is_dir` |
| 9 | 0.3% | `std::sys::fs::metadata` |
| 2 | 0.1% | `uv__fs_work` |

## Callers of `__open`

Inclusive 116wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 116 | 3.4% | `open` |

## Callers of `tiny_free_list_add_ptr`

Inclusive 106wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 90 | 2.6% | `tiny_free_no_lock` |
| 15 | 0.4% | `tiny_malloc_from_free_list` |
| 1 | 0.0% | `tiny_try_realloc_in_place` |

## Callers of `set_tiny_meta_header_in_use`

Inclusive 105wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 104 | 3.0% | `tiny_malloc_from_free_list` |
| 1 | 0.0% | `tiny_try_realloc_in_place` |

## Callers of `rack_get_thread_index`

Inclusive 105wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 105 | 3.1% | `tiny_malloc_should_clear` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 162wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 88 | 2.6% | `styletrace::resolver::tracer::resolve::resolve_combined_props` |
| 31 | 0.9% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 31 | 0.9% | `styletrace::resolver::tracer::resolve::resolve_combined_literals` |
| 10 | 0.3% | `styletrace::analysis::parser::component::component_from_function_like` |
| 1 | 0.0% | `tasty::ast::resolve::index::ExportFold::collect` |
| 1 | 0.0% | `tasty::scan::scan_typescript_bundle` |

## Callers of `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next`

Inclusive 130wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 78 | 2.3% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 10 | 0.3% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 9 | 0.3% | `styletrace::resolver::tracer::resolve::resolve_combined_props` |
| 8 | 0.2% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 6 | 0.2% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 3 | 0.1% | `core::ptr::drop_in_place<styletrace::resolver::tracer::context::TraceSession>` |
| 3 | 0.1% | `styletrace::analysis::parser::component::component_from_expression` |
| 2 | 0.1% | `styletrace::resolver::tracer::resolve::resolve_prop_names` |

## Callers of `oxc_parser::lexer::Lexer::next_token`

Inclusive 84wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_lhs_expression_or_higher` |
| 7 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_member_expression_rest` |
| 6 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_identifier_expression` |
| 6 | 0.2% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type` |
| 5 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_literal_string` |
| 5 | 0.1% | `oxc_parser::cursor::<impl oxc_parser::ParserImpl>::parse_normal_list` |
| 5 | 0.1% | `oxc_parser::js::function::<impl oxc_parser::ParserImpl>::parse_function_body` |
| 3 | 0.1% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_type_arguments_of_type_reference` |

## Callers of `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push`

Inclusive 116wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 116 | 3.4% | `alloc::collections::btree::map::BTreeMap<K,V,A>::bulk_build_from_sorted_iter` |

## Callers of `<alloc::string::String as core::clone::Clone>::clone`

Inclusive 636wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 540 | 15.8% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 86 | 2.5% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 2 | 0.1% | `tasty::ast::extract::pipeline::extract_file` |
| 2 | 0.1% | `<tasty::model::TypeRef as core::clone::Clone>::clone` |
| 1 | 0.0% | `styletrace::analysis::walk::jsx::collect_edges_from_jsx_element` |
| 1 | 0.0% | `module_graph::walk::BindingWalk<L,F>::resolve_export` |
| 1 | 0.0% | `<atomic::extract::resolver::source::AtomicFs as module_graph::fs::FileSystem>::read_to_string` |
| 1 | 0.0% | `atomic::runtime::builder::PlanBuilder::build_keyed` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 62wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 24 | 0.7% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 11 | 0.3% | `std::path::Path::_join` |
| 5 | 0.1% | `core::slice::sort::stable::drift::sort` |
| 4 | 0.1% | `std::path::PathBuf::_push` |
| 3 | 0.1% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.1% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 2 | 0.1% | `module_graph::key::join_under` |
| 2 | 0.1% | `atomic::extract_parallel::FileOut::commit` |

## Callers of `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold`

Inclusive 563wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 562 | 16.4% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |
| 1 | 0.0% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |

## Callers of `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler`

Inclusive 16wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.1% | `oxc_parser::lexer::byte_handlers::IDT` |
| 2 | 0.1% | `oxc_parser::lexer::byte_handlers::L_D` |
| 2 | 0.1% | `oxc_parser::lexer::byte_handlers::L_F` |
| 2 | 0.1% | `oxc_parser::lexer::byte_handlers::L_G` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_E` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_I` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_Y` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_N` |

## Callers of `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize`

Inclusive 77wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 77 | 2.2% | `serde_json::de::from_trait` |

## Callers of `core::iter::traits::iterator::Iterator::eq_by`

Inclusive 21wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 21 | 0.6% | `tasty::scanner::packages::relative::push_unique_candidate` |

## Malloc-family leaves by nearest atomic/canon ancestor

1056wt of malloc-family leaves; 15wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 726 | 21.2% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 24 | 0.7% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 21 | 0.6% | `module_graph::walk::BindingWalk<L,F>::record_copy` |
| 21 | 0.6% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 20 | 0.6% | `styletrace::resolver::tracer::resolve::resolve_prop_names` |
| 19 | 0.6% | `styletrace::resolver::tracer::context::TraceContext::resolve_declaration` |
| 18 | 0.5% | `styletrace::resolver::tracer::collect_style_prop_names` |
| 17 | 0.5% | `styletrace::resolver::tracer::resolve::resolve_literal_names` |
| 12 | 0.4% | `module_graph::walk::BindingWalk<L,F>::resolve_export` |
| 10 | 0.3% | `tasty::scanner::packages::relative::declaration_candidates` |
| 9 | 0.3% | `styletrace::analysis::parser::component::component_from_expression` |
| 9 | 0.3% | `serde_core::de::impls::<impl serde_core::de::Deserialize for alloc::string::String>::deserialize` |
| 9 | 0.3% | `tasty::scan::scan_typescript_bundle` |
| 8 | 0.2% | `tasty::scanner::packages::package_entry::find_installed_declaration_provider` |
| 7 | 0.2% | `tasty::generator::util::emit_field` |
| 6 | 0.2% | `styletrace::analysis::parser::component::component_from_function_like` |
| 6 | 0.2% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 6 | 0.2% | `atomic::extract::identity::IdentityGraph::resolve` |

## memmove leaves by nearest .node ancestor

51wt of memmove leaves; 12wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 19 | 0.6% | `<alloc::string::String as core::clone::Clone>::clone` |
| 4 | 0.1% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 2 | 0.1% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_block` |
| 2 | 0.1% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |
| 2 | 0.1% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 1 | 0.0% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 1 | 0.0% | `atomic::scan::scan` |
| 1 | 0.0% | `styletrace::resolver::parser::property_name` |
| 1 | 0.0% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 1 | 0.0% | `atomic::extract::scope::table::ScopeTable::declare` |
| 1 | 0.0% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 1 | 0.0% | `std::path::PathBuf::_push` |
| 1 | 0.0% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 1 | 0.0% | `std::path::Path::is_dir` |

## memcmp leaves by nearest .node ancestor

133wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 65 | 1.9% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 40 | 1.2% | `core::slice::sort::stable::drift::sort` |
| 9 | 0.3% | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 9 | 0.3% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 2 | 0.1% | `<alloc::collections::btree::set::Difference<T,A> as core::iter::traits::iterator::Iterator>::next` |
| 2 | 0.1% | `tasty::scanner::packages::relative::candidate_matches` |
| 2 | 0.1% | `tasty::ast::resolve::index::ExportFold::collect` |
| 1 | 0.0% | `atomic::extract::constants::index::LocalConstants::merge` |
| 1 | 0.0% | `oxc_parser::module_record::ModuleRecordBuilder::add_module_request` |
| 1 | 0.0% | `<std::sys::fs::unix::ReadDir as core::iter::traits::iterator::Iterator>::next` |
| 1 | 0.0% | `<core::str::pattern::CharSearcher as core::str::pattern::Searcher>::next_match` |

## File opens by issuing frame

116wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 106 | 3.1% | `std::sys::fs::unix::File::open_c [reference-native.darwin-x64.node]` |
| 10 | 0.3% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

1080wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 1072 | 31.3% | `reference_native::atomic::__napi__compile_system → atomic::compile` |
| 1046 | 30.5% | `atomic::compile → std::thread::scoped::scope` |
| 1016 | 29.6% | `std::thread::scoped::scope → atomic::phase_parallel::drive_rounds` |
| 546 | 15.9% | `atomic::phase_parallel::drive_rounds → atomic::phase_merge::publish` |
| 544 | 15.9% | `atomic::phase_merge::publish → atomic::hosts::resolve_prepared` |
| 543 | 15.8% | `atomic::hosts::resolve_prepared → styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 543 | 15.8% | `styletrace::analysis::surface::trace_style_bindings_with_modules → styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 542 | 15.8% | `styletrace::analysis::surface::SurfaceTraceSession::trace_with → styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 533 | 15.6% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded → styletrace::analysis::parser::parse_trace_module` |
| 526 | 15.3% | `styletrace::analysis::parser::parse_trace_module → styletrace::analysis::parser::fold_trace_module` |
| 453 | 13.2% | `styletrace::analysis::parser::types::resolve_style_props_from_type_annotation → styletrace::resolver::tracer::collect_style_prop_names` |
| 414 | 12.1% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings → styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 410 | 12.0% | `styletrace::resolver::tracer::collect_style_prop_names → styletrace::resolver::tracer::resolve::resolve_reference_props` |
| 375 | 10.9% | `styletrace::resolver::tracer::resolve::resolve_reference_props → styletrace::resolver::tracer::resolve::resolve_decl_props` |
| 372 | 10.9% | `styletrace::analysis::parser::fold_trace_module → styletrace::analysis::parser::collect_variable_symbols` |
| 372 | 10.9% | `styletrace::analysis::parser::collect_variable_symbols → styletrace::analysis::parser::component::component_from_expression` |
| 337 | 9.8% | `styletrace::resolver::tracer::resolve::resolve_decl_props → styletrace::resolver::tracer::resolve::resolve_combined_props` |
| 321 | 9.4% | `atomic::phase_parallel::drive_rounds → std::sync::mpmc::list::Channel<T>::recv` |
| 321 | 9.4% | `std::sync::mpmc::list::Channel<T>::recv → std::sync::mpmc::list::Channel<T>::recv::{{closure}}` |
| 321 | 9.4% | `std::sync::mpmc::list::Channel<T>::recv::{{closure}} → std::thread::thread::Thread::park` |
| 317 | 9.3% | `styletrace::resolver::tracer::resolve::resolve_combined_props → styletrace::resolver::tracer::resolve::resolve_prop_names` |
| 277 | 8.1% | `styletrace::resolver::tracer::resolve::resolve_prop_names → styletrace::resolver::tracer::resolve::resolve_decl_props` |
| 239 | 7.0% | `styletrace::analysis::parser::component::component_from_function_like → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |
| 230 | 6.7% | `styletrace::analysis::parser::component::component_from_expression → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |
| 193 | 5.6% | `styletrace::resolver::tracer::resolve::resolve_prop_names → styletrace::resolver::tracer::resolve::resolve_prop_names` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 1463 | 1113 | 76% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 636 | 593 | 93% | `<alloc::string::String as core::clone::Clone>::clone` |
| 563 | 543 | 96% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 116 | 79 | 68% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 130 | 62 | 48% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 62 | 42 | 68% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 77 | 41 | 53% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 162 | 14 | 9% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 12 | 6 | 50% | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Mut,K,V,alloc::collections::btree::node::marker::Leaf>,alloc::collections::btree::node::marker::Edge>::insert_recursing` |
| 55 | 5 | 9% | `core::slice::sort::stable::drift::sort` |
| 84 | 2 | 2% | `oxc_parser::lexer::Lexer::next_token` |
| 16 | 0 | 0% | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 21 | 0 | 0% | `core::iter::traits::iterator::Iterator::eq_by` |
| 8 | 0 | 0% | `std::path::Components::parse_next_component_back` |
| 7 | 0 | 0% | `__rustc::__rust_alloc` |
