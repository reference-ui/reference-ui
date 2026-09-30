# Caller attribution: lib-styletrace (84faa918f)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `docs/evidence/flamegraph/styletrace-lib5`.
Derived 2026-09-30T16:10:12.322Z via `pnpm agentrs flame --callers docs/evidence/flamegraph/styletrace-lib5`; no re-record, bundle raws untouched.
Covers 3302 weight across 2895 main-thread samples. Shares below are of that weight unless noted.


## Callers of `free_tiny`

Inclusive 671wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 408 | 12.4% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 62 | 1.9% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 36 | 1.1% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 23 | 0.7% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 12 | 0.4% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 12 | 0.4% | `szone_realloc` |
| 11 | 0.3% | `core::ptr::drop_in_place<indexmap::inner::Core<alloc::string::String,serde_json::value::Value>>` |
| 9 | 0.3% | `core::ptr::drop_in_place<serde_json::value::Value>` |

## Callers of `tiny_malloc_should_clear`

Inclusive 720wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 720 | 21.8% | `szone_malloc_should_clear` |

## Callers of `semaphore_wait_trap`

Inclusive 279wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 279 | 8.4% | `_dispatch_sema4_wait` |

## Callers of `kevent`

Inclusive 214wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 214 | 6.5% | `uv__io_poll` |

## Callers of `tiny_malloc_from_free_list`

Inclusive 282wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 282 | 8.5% | `tiny_malloc_should_clear` |

## Callers of `__open`

Inclusive 131wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 131 | 4.0% | `open` |

## Callers of `stat$INODE64`

Inclusive 124wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 85 | 2.6% | `std::path::Path::is_file` |
| 37 | 1.1% | `std::path::Path::is_dir` |
| 2 | 0.1% | `uv__fs_work` |

## Callers of `tiny_free_no_lock`

Inclusive 295wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 295 | 8.9% | `free_tiny` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 113wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 33 | 1.0% | `0x7ff7b327a51f` |
| 9 | 0.3% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 7 | 0.2% | `0x7ff7b327b4df` |
| 4 | 0.1% | `0x7ff7b326fcdf` |
| 3 | 0.1% | `0x7ff7b327005f` |
| 3 | 0.1% | `<alloc::vec::into_iter::IntoIter<T,A> as core::iter::traits::iterator::Iterator>::try_fold` |
| 3 | 0.1% | `0x7ff7b327002f` |
| 3 | 0.1% | `0x7ff7b326e4df` |

## Callers of `rack_get_thread_index`

Inclusive 110wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 110 | 3.3% | `tiny_malloc_should_clear` |

## Callers of `set_tiny_meta_header_in_use`

Inclusive 106wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 106 | 3.2% | `tiny_malloc_from_free_list` |

## Callers of `tiny_free_list_add_ptr`

Inclusive 97wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 81 | 2.5% | `tiny_free_no_lock` |
| 14 | 0.4% | `tiny_malloc_from_free_list` |
| 2 | 0.1% | `tiny_try_realloc_in_place` |

## Callers of `oxc_parser::lexer::Lexer::next_token`

Inclusive 87wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 12 | 0.4% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_lhs_expression_or_higher` |
| 8 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_primary_expression` |
| 7 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_identifier_expression` |
| 5 | 0.2% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type` |
| 4 | 0.1% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_block` |
| 4 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_literal_string` |
| 4 | 0.1% | `core::ops::function::FnMut::call_mut` |
| 3 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_member_expression_rest` |

## Callers of `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push`

Inclusive 151wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 151 | 4.6% | `alloc::collections::btree::map::BTreeMap<K,V,A>::bulk_build_from_sorted_iter` |

## Callers of `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next`

Inclusive 99wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 70 | 2.1% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 8 | 0.2% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 7 | 0.2% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 5 | 0.2% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 3 | 0.1% | `styletrace::analysis::parser::component::component_from_expression` |
| 2 | 0.1% | `core::ptr::drop_in_place<styletrace::resolver::tracer::context::TraceSession>` |
| 1 | 0.0% | `styletrace::analysis::parser::component::component_from_function_like` |
| 1 | 0.0% | `core::ptr::drop_in_place<styletrace::analysis::model::PropBindings>` |

## Callers of `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold`

Inclusive 564wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 564 | 17.1% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 88wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 36 | 1.1% | `styletrace::resolver::tracer::resolve::take_or_extend` |
| 29 | 0.9% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 14 | 0.4% | `styletrace::analysis::parser::component::component_from_function_like` |
| 3 | 0.1% | `tasty::ast::resolve::index::ExportFold::collect` |
| 2 | 0.1% | `atomic::extract::scope::table::ScopeTable::declare` |
| 1 | 0.0% | `styletrace::resolver::tracer::resolve::take_or_extend_owned` |
| 1 | 0.0% | `atomic::extract::harvest::literals::HarvestPool::merge` |
| 1 | 0.0% | `tasty::ast::extract::module_bindings::exports::record_named_reexports` |

## Callers of `<alloc::string::String as core::clone::Clone>::clone`

Inclusive 621wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 531 | 16.1% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 66 | 2.0% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 8 | 0.2% | `styletrace::resolver::tracer::resolve::take_or_extend` |
| 2 | 0.1% | `styletrace::resolver::parser::parse_module` |
| 2 | 0.1% | `<alloc::vec::Vec<T,A> as core::clone::Clone>::clone` |
| 2 | 0.1% | `<atomic::extract::resolver::source::AtomicFs as module_graph::fs::FileSystem>::read_to_string` |
| 2 | 0.1% | `<T as alloc::slice::<impl [T]>::to_vec_in::ConvertVec>::to_vec` |
| 1 | 0.0% | `atomic::scan::scan` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 72wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 26 | 0.8% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 14 | 0.4% | `std::path::Path::_join` |
| 5 | 0.2% | `tasty::generator::util::emit_object` |
| 4 | 0.1% | `core::slice::sort::stable::drift::sort` |
| 3 | 0.1% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.1% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 2 | 0.1% | `std::path::PathBuf::_push` |
| 2 | 0.1% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |

## Callers of `core::slice::sort::stable::drift::sort`

Inclusive 58wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 58 | 1.8% | `core::slice::sort::stable::driftsort_main` |

## Callers of `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.2% | `oxc_parser::lexer::byte_handlers::IDT` |
| 2 | 0.1% | `oxc_parser::lexer::byte_handlers::L_S` |
| 2 | 0.1% | `oxc_parser::lexer::byte_handlers::L_N` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_V` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_T` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_R` |

## Callers of `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize`

Inclusive 71wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 71 | 2.2% | `serde_json::de::from_trait` |

## Malloc-family leaves by nearest atomic/canon ancestor

1010wt of malloc-family leaves; 7wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 677 | 20.5% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 29 | 0.9% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 23 | 0.7% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 22 | 0.7% | `styletrace::resolver::tracer::context::TraceContext::resolve_declaration` |
| 20 | 0.6% | `styletrace::resolver::tracer::resolve::take_or_extend` |
| 19 | 0.6% | `module_graph::walk::BindingWalk<L,F>::record_copy` |
| 18 | 0.5% | `styletrace::resolver::tracer::collect_style_prop_names` |
| 12 | 0.4% | `module_graph::walk::BindingWalk<L,F>::resolve_export` |
| 12 | 0.4% | `atomic::extract::identity::IdentityGraph::resolve` |
| 10 | 0.3% | `tasty::scan::scan_typescript_bundle` |
| 9 | 0.3% | `tasty::scanner::packages::package_entry::find_installed_declaration_provider` |
| 8 | 0.2% | `styletrace::resolver::parser::property_name` |
| 8 | 0.2% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 7 | 0.2% | `module_graph::ladder::package::field_entries` |
| 7 | 0.2% | `serde_core::de::impls::<impl serde_core::de::Deserialize for alloc::string::String>::deserialize` |
| 7 | 0.2% | `tasty::scanner::packages::relative::declaration_candidates` |
| 6 | 0.2% | `styletrace::resolver::tracer::resolve::resolve_literal_names_into` |
| 6 | 0.2% | `tasty::scanner::packages::relative::resolve_relative_import` |

## memmove leaves by nearest .node ancestor

52wt of memmove leaves; 16wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 13 | 0.4% | `<alloc::string::String as core::clone::Clone>::clone` |
| 6 | 0.2% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 4 | 0.1% | `std::path::Path::_join` |
| 4 | 0.1% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |
| 2 | 0.1% | `atomic::extract::scope::table::ScopeTable::declare` |
| 1 | 0.0% | `atomic::scan::scan` |
| 1 | 0.0% | `styletrace::resolver::parser::parse_module` |
| 1 | 0.0% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 1 | 0.0% | `alloc::str::join_generic_copy` |
| 1 | 0.0% | `napi::bindgen_runtime::js_values::string::<impl napi::bindgen_runtime::js_values::ToNapiValue for &alloc::string::String>::to_napi_value` |
| 1 | 0.0% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_block` |
| 1 | 0.0% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_import_specifiers` |

## memcmp leaves by nearest .node ancestor

113wt of memcmp leaves; 1wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 46 | 1.4% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 38 | 1.2% | `core::slice::sort::stable::drift::sort` |
| 10 | 0.3% | `<alloc::vec::into_iter::IntoIter<T,A> as core::iter::traits::iterator::Iterator>::try_fold` |
| 10 | 0.3% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 2 | 0.1% | `<std::path::Component as core::cmp::PartialEq>::eq` |
| 1 | 0.0% | `<alloc::collections::btree::set::Difference<T,A> as core::iter::traits::iterator::Iterator>::next` |
| 1 | 0.0% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 1 | 0.0% | `module_graph::record::ModuleRecord::import_edge` |
| 1 | 0.0% | `atomic::extract::scope::table::ScopeTable::root_pure_fn` |
| 1 | 0.0% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 1 | 0.0% | `<core::str::pattern::CharSearcher as core::str::pattern::Searcher>::next_match` |

## File opens by issuing frame

131wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 125 | 3.8% | `std::sys::fs::unix::File::open_c [reference-native.darwin-x64.node]` |
| 6 | 0.2% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

954wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 947 | 28.7% | `reference_native::atomic::__napi__compile_system → atomic::compile` |
| 920 | 27.9% | `atomic::compile → std::thread::scoped::scope` |
| 891 | 27.0% | `std::thread::scoped::scope → atomic::phase_parallel::drive_rounds` |
| 461 | 14.0% | `atomic::phase_parallel::drive_rounds → atomic::phase_merge::publish` |
| 458 | 13.9% | `atomic::phase_merge::publish → atomic::hosts::resolve_prepared` |
| 457 | 13.8% | `atomic::hosts::resolve_prepared → styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 457 | 13.8% | `styletrace::analysis::surface::trace_style_bindings_with_modules → styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 456 | 13.8% | `styletrace::analysis::surface::SurfaceTraceSession::trace_with → styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 449 | 13.6% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded → styletrace::analysis::parser::parse_trace_module` |
| 442 | 13.4% | `styletrace::analysis::parser::parse_trace_module → styletrace::analysis::parser::fold_trace_module` |
| 366 | 11.1% | `styletrace::analysis::parser::types::resolve_style_props_from_type_annotation → styletrace::resolver::tracer::collect_style_prop_names` |
| 348 | 10.5% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings → styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 325 | 9.8% | `styletrace::resolver::tracer::collect_style_prop_names → styletrace::resolver::tracer::resolve::resolve_reference_props` |
| 309 | 9.4% | `styletrace::analysis::parser::fold_trace_module → styletrace::analysis::parser::collect_variable_symbols` |
| 309 | 9.4% | `styletrace::analysis::parser::collect_variable_symbols → styletrace::analysis::parser::component::component_from_expression` |
| 285 | 8.6% | `styletrace::resolver::tracer::resolve::resolve_reference_props → styletrace::resolver::tracer::resolve::resolve_decl_props_into` |
| 284 | 8.6% | `styletrace::resolver::tracer::resolve::resolve_decl_props_into → styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 280 | 8.5% | `atomic::phase_parallel::drive_rounds → std::sync::mpmc::list::Channel<T>::recv` |
| 280 | 8.5% | `std::sync::mpmc::list::Channel<T>::recv → std::sync::mpmc::list::Channel<T>::recv::{{closure}}` |
| 280 | 8.5% | `std::sync::mpmc::list::Channel<T>::recv::{{closure}} → std::thread::thread::Thread::park` |
| 254 | 7.7% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into → styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 205 | 6.2% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into → styletrace::resolver::tracer::resolve::resolve_decl_props_into` |
| 195 | 5.9% | `styletrace::analysis::parser::component::component_from_function_like → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |
| 192 | 5.8% | `styletrace::analysis::parser::component::component_from_expression → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |
| 185 | 5.6% | `styletrace::resolver::tracer::context::TraceContext::resolve_declaration → styletrace::resolver::parser::parse_module` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 621 | 591 | 95% | `<alloc::string::String as core::clone::Clone>::clone` |
| 564 | 534 | 95% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 151 | 104 | 69% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 72 | 56 | 78% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 71 | 38 | 54% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 99 | 37 | 37% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 88 | 14 | 16% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 20 | 10 | 50% | `indexmap::map::IndexMap<K,V,S>::insert_full` |
| 123 | 7 | 6% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binary_expression_or_higher` |
| 58 | 5 | 9% | `core::slice::sort::stable::drift::sort` |
| 30 | 2 | 7% | `oxc_parser::jsx::<impl oxc_parser::ParserImpl>::parse_jsx_element` |
| 87 | 0 | 0% | `oxc_parser::lexer::Lexer::next_token` |
| 13 | 0 | 0% | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 8 | 0 | 0% | `std::path::Components::parse_next_component_back` |
| 6 | 0 | 0% | `oxc_parser::lexer::whitespace::<impl oxc_parser::lexer::Lexer>::line_break_handler` |
