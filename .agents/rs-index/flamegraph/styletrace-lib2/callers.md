# Caller attribution: lib-styletrace (488bcfd7a)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `../../../../tmp/styletrace-perf-mission/docs/EVIDENCE/flamegraph/styletrace-lib2`.
Derived 2026-09-30T12:45:32.042Z via `pnpm agentrs flame --callers /tmp/styletrace-perf-mission/docs/EVIDENCE/flamegraph/styletrace-lib2`; no re-record, bundle raws untouched.
Covers 4135 weight across 3466 main-thread samples. Shares below are of that weight unless noted.


## Callers of `semaphore_wait_trap`

Inclusive 556wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 556 | 13.4% | `_dispatch_sema4_wait` |

## Callers of `free_tiny`

Inclusive 853wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 414 | 10.0% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 164 | 4.0% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 102 | 2.5% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 23 | 0.6% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 15 | 0.4% | `core::ptr::drop_in_place<alloc::vec::Vec<indexmap::Bucket<alloc::string::String,serde_json::value::Value>>>` |
| 11 | 0.3% | `<hashbrown::raw::RawTable<T,A> as core::ops::drop::Drop>::drop` |
| 9 | 0.2% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeDeclaration>` |
| 8 | 0.2% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |

## Callers of `tiny_malloc_should_clear`

Inclusive 883wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 883 | 21.4% | `szone_malloc_should_clear` |

## Callers of `kevent`

Inclusive 216wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 216 | 5.2% | `uv__io_poll` |

## Callers of `tiny_malloc_from_free_list`

Inclusive 354wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 354 | 8.6% | `tiny_malloc_should_clear` |

## Callers of `tiny_free_no_lock`

Inclusive 394wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 394 | 9.5% | `free_tiny` |

## Callers of `stat$INODE64`

Inclusive 154wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 97 | 2.3% | `std::path::Path::is_file` |
| 51 | 1.2% | `std::path::Path::is_dir` |
| 5 | 0.1% | `std::sys::fs::metadata` |
| 1 | 0.0% | `uv__fs_work` |

## Callers of `rack_get_thread_index`

Inclusive 141wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 141 | 3.4% | `tiny_malloc_should_clear` |

## Callers of `__open`

Inclusive 132wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 132 | 3.2% | `open` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 131wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 34 | 0.8% | `0x7ff7b8a1beef` |
| 13 | 0.3% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 9 | 0.2% | `0x7ff7b8a1ceaf` |
| 5 | 0.1% | `core::slice::sort::stable::drift::sort` |
| 2 | 0.0% | `0x7ff7b8a11a9f` |
| 2 | 0.0% | `0x7ff7b8a11b7f` |
| 2 | 0.0% | `0x7ff7b8a1040f` |
| 2 | 0.0% | `0x7ff7b8a0ff6f` |

## Callers of `tiny_free_list_add_ptr`

Inclusive 125wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 117 | 2.8% | `tiny_free_no_lock` |
| 8 | 0.2% | `tiny_malloc_from_free_list` |

## Callers of `set_tiny_meta_header_in_use`

Inclusive 114wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 113 | 2.7% | `tiny_malloc_from_free_list` |
| 1 | 0.0% | `tiny_try_realloc_in_place` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 159wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 93 | 2.2% | `styletrace::resolver::tracer::resolve::resolve_combined_props` |
| 31 | 0.7% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 16 | 0.4% | `styletrace::resolver::tracer::resolve::resolve_combined_literals` |
| 14 | 0.3% | `styletrace::analysis::parser::component::component_from_function_like` |
| 1 | 0.0% | `atomic::phase_merge::publish` |
| 1 | 0.0% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 1 | 0.0% | `tasty::ast::extract::module_bindings::exports::record_named_reexports` |
| 1 | 0.0% | `tasty::ast::extract::pipeline::extract_file` |

## Callers of `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next`

Inclusive 158wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 83 | 2.0% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 45 | 1.1% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 10 | 0.2% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 5 | 0.1% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 3 | 0.1% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 2 | 0.0% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 2 | 0.0% | `styletrace::resolver::tracer::resolve::resolve_combined_props` |
| 2 | 0.0% | `styletrace::resolver::tracer::resolve::resolve_combined_literals` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 68wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 15 | 0.4% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 11 | 0.3% | `std::path::Path::_join` |
| 10 | 0.2% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 10 | 0.2% | `core::slice::sort::stable::drift::sort` |
| 7 | 0.2% | `<alloc::string::String as core::clone::Clone>::clone` |
| 7 | 0.2% | `tasty::generator::util::emit_object` |
| 1 | 0.0% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 1 | 0.0% | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |

## Callers of `oxc_parser::lexer::Lexer::next_token`

Inclusive 90wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 15 | 0.4% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_lhs_expression_or_higher` |
| 8 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_literal_string` |
| 6 | 0.1% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type_name` |
| 6 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_member_expression_rest` |
| 6 | 0.1% | `oxc_parser::js::function::<impl oxc_parser::ParserImpl>::parse_function_body` |
| 5 | 0.1% | `oxc_parser::cursor::<impl oxc_parser::ParserImpl>::parse_normal_list` |
| 5 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_identifier_expression` |
| 3 | 0.1% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_block` |

## Callers of `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push`

Inclusive 156wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 156 | 3.8% | `alloc::collections::btree::map::BTreeMap<K,V,A>::bulk_build_from_sorted_iter` |

## Callers of `<alloc::string::String as core::clone::Clone>::clone`

Inclusive 805wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 532 | 12.9% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 228 | 5.5% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 17 | 0.4% | `<styletrace::resolver::model::TypeExpr as core::clone::Clone>::clone` |
| 12 | 0.3% | `<hashbrown::raw::RawTable<T,A> as core::clone::Clone>::clone` |
| 5 | 0.1% | `<alloc::vec::Vec<T,A> as core::clone::Clone>::clone` |
| 2 | 0.0% | `tasty::ast::extract::pipeline::extract_file` |
| 1 | 0.0% | `module_graph::walk::BindingWalk<L,F>::resolve_export` |
| 1 | 0.0% | `<module_graph::walk::Refused as core::clone::Clone>::clone` |

## Callers of `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold`

Inclusive 557wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 557 | 13.5% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |

## Callers of `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler`

Inclusive 14wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.1% | `oxc_parser::lexer::byte_handlers::IDT` |
| 2 | 0.0% | `oxc_parser::lexer::byte_handlers::L_E` |
| 2 | 0.0% | `oxc_parser::lexer::byte_handlers::L_P` |
| 2 | 0.0% | `oxc_parser::lexer::byte_handlers::L_B` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_C` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_I` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_U` |

## Callers of `std::path::Components::parse_next_component_back`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 0.3% | `<std::path::Components as core::iter::traits::double_ended::DoubleEndedIterator>::next_back` |

## Callers of `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize`

Inclusive 39wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 39 | 0.9% | `serde_json::de::from_trait` |

## Malloc-family leaves by nearest atomic/canon ancestor

1260wt of malloc-family leaves; 13wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 681 | 16.5% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 304 | 7.4% | `styletrace::resolver::tracer::context::TraceContext::resolve_declaration` |
| 28 | 0.7% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 20 | 0.5% | `module_graph::walk::BindingWalk<L,F>::record_copy` |
| 19 | 0.5% | `styletrace::resolver::tracer::collect_style_prop_names` |
| 14 | 0.3% | `styletrace::resolver::tracer::resolve::resolve_literal_names` |
| 14 | 0.3% | `styletrace::resolver::tracer::resolve::resolve_prop_names` |
| 12 | 0.3% | `module_graph::walk::BindingWalk<L,F>::resolve_export` |
| 10 | 0.2% | `serde_core::de::impls::<impl serde_core::de::Deserialize for alloc::string::String>::deserialize` |
| 10 | 0.2% | `tasty::scan::scan_typescript_bundle` |
| 7 | 0.2% | `styletrace::analysis::parser::component::component_from_function_like` |
| 7 | 0.2% | `module_graph::ladder::package::field_entries` |
| 7 | 0.2% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 6 | 0.1% | `styletrace::analysis::parser::component::component_from_expression` |
| 6 | 0.1% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 6 | 0.1% | `atomic::extract::identity::IdentityGraph::resolve` |
| 6 | 0.1% | `tasty::scanner::paths::package::external_package_path_for_file_id` |
| 6 | 0.1% | `tasty::scanner::packages::package_entry::find_installed_declaration_provider` |

## memmove leaves by nearest .node ancestor

58wt of memmove leaves; 12wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 27 | 0.7% | `<alloc::string::String as core::clone::Clone>::clone` |
| 2 | 0.0% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 2 | 0.0% | `atomic::extract_parallel::FileOut::commit` |
| 1 | 0.0% | `atomic::scan::scan` |
| 1 | 0.0% | `alloc::collections::btree::node::BalancingContext<K,V>::bulk_steal_left` |
| 1 | 0.0% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type` |
| 1 | 0.0% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 1 | 0.0% | `std::path::PathBuf::_push` |
| 1 | 0.0% | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Mut,K,V,alloc::collections::btree::node::marker::Leaf>,alloc::collections::btree::node::marker::Edge>::insert_recursing` |
| 1 | 0.0% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 1 | 0.0% | `napi::bindgen_runtime::js_values::string::<impl napi::bindgen_runtime::js_values::ToNapiValue for &alloc::string::String>::to_napi_value` |
| 1 | 0.0% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_block` |
| 1 | 0.0% | `std::path::PathBuf::_set_extension` |
| 1 | 0.0% | `std::io::default_read_to_end::small_probe_read` |

## memcmp leaves by nearest .node ancestor

131wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 68 | 1.6% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 40 | 1.0% | `core::slice::sort::stable::drift::sort` |
| 10 | 0.2% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 6 | 0.1% | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 2 | 0.0% | `tasty::ast::resolve::index::ExportFold::collect` |
| 1 | 0.0% | `std::path::compare_components` |
| 1 | 0.0% | `canon::css::is_color_prop` |
| 1 | 0.0% | `<std::path::Component as core::cmp::PartialEq>::eq` |
| 1 | 0.0% | `alloc::collections::btree::search::<impl alloc::collections::btree::node::NodeRef<BorrowType,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::search_tree` |
| 1 | 0.0% | `<core::str::pattern::CharSearcher as core::str::pattern::Searcher>::next_match` |

## File opens by issuing frame

132wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 125 | 3.0% | `std::sys::fs::unix::File::open_c [reference-native.darwin-x64.node]` |
| 7 | 0.2% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

1742wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 1734 | 41.9% | `reference_native::atomic::__napi__compile_system → atomic::compile` |
| 1708 | 41.3% | `atomic::compile → std::thread::scoped::scope` |
| 1680 | 40.6% | `std::thread::scoped::scope → atomic::phase_parallel::drive_rounds` |
| 977 | 23.6% | `atomic::phase_parallel::drive_rounds → atomic::phase_merge::publish` |
| 975 | 23.6% | `atomic::phase_merge::publish → atomic::hosts::resolve_prepared` |
| 974 | 23.6% | `atomic::hosts::resolve_prepared → styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 974 | 23.6% | `styletrace::analysis::surface::trace_style_bindings_with_modules → styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 973 | 23.5% | `styletrace::analysis::surface::SurfaceTraceSession::trace_with → styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 965 | 23.3% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded → styletrace::analysis::parser::parse_trace_module` |
| 960 | 23.2% | `styletrace::analysis::parser::parse_trace_module → styletrace::analysis::parser::fold_trace_module` |
| 873 | 21.1% | `styletrace::analysis::parser::types::resolve_style_props_from_type_annotation → styletrace::resolver::tracer::collect_style_prop_names` |
| 836 | 20.2% | `styletrace::resolver::tracer::collect_style_prop_names → styletrace::resolver::tracer::resolve::resolve_reference_props` |
| 801 | 19.4% | `styletrace::resolver::tracer::resolve::resolve_reference_props → styletrace::resolver::tracer::resolve::resolve_decl_props` |
| 758 | 18.3% | `styletrace::resolver::tracer::resolve::resolve_decl_props → styletrace::resolver::tracer::resolve::resolve_combined_props` |
| 744 | 18.0% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings → styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 738 | 17.8% | `styletrace::resolver::tracer::resolve::resolve_combined_props → styletrace::resolver::tracer::resolve::resolve_prop_names` |
| 691 | 16.7% | `styletrace::analysis::parser::fold_trace_module → styletrace::analysis::parser::collect_variable_symbols` |
| 691 | 16.7% | `styletrace::analysis::parser::collect_variable_symbols → styletrace::analysis::parser::component::component_from_expression` |
| 680 | 16.4% | `styletrace::resolver::tracer::resolve::resolve_prop_names → styletrace::resolver::tracer::resolve::resolve_decl_props` |
| 556 | 13.4% | `atomic::phase_parallel::drive_rounds → std::sync::mpmc::list::Channel<T>::recv` |
| 556 | 13.4% | `std::sync::mpmc::list::Channel<T>::recv → std::sync::mpmc::list::Channel<T>::recv::{{closure}}` |
| 556 | 13.4% | `std::sync::mpmc::list::Channel<T>::recv::{{closure}} → std::thread::thread::Thread::park` |
| 491 | 11.9% | `styletrace::resolver::tracer::resolve::resolve_prop_names → styletrace::resolver::tracer::context::TraceContext::resolve_declaration` |
| 481 | 11.6% | `styletrace::resolver::tracer::resolve::resolve_prop_names → styletrace::resolver::tracer::resolve::resolve_prop_names` |
| 449 | 10.9% | `styletrace::analysis::parser::component::component_from_function_like → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 805 | 752 | 93% | `<alloc::string::String as core::clone::Clone>::clone` |
| 792 | 732 | 92% | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 557 | 534 | 96% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 267 | 264 | 99% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 169 | 165 | 98% | `<alloc::vec::Vec<T,A> as core::clone::Clone>::clone` |
| 156 | 117 | 75% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 158 | 60 | 38% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 68 | 34 | 50% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 159 | 26 | 16% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 39 | 22 | 56% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 15 | 7 | 47% | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Mut,K,V,alloc::collections::btree::node::marker::Leaf>,alloc::collections::btree::node::marker::Edge>::insert_recursing` |
| 90 | 1 | 1% | `oxc_parser::lexer::Lexer::next_token` |
| 14 | 0 | 0% | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 11 | 0 | 0% | `std::path::Components::parse_next_component_back` |
| 8 | 0 | 0% | `__rustc::__rust_alloc` |
