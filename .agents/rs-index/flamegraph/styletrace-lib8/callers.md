# Caller attribution: lib-styletrace (ec4f6f725)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `docs/evidence/flamegraph/styletrace-lib8`.
Derived 2026-09-30T16:11:52.549Z via `pnpm agentrs flame --callers docs/evidence/flamegraph/styletrace-lib8`; no re-record, bundle raws untouched.
Covers 3263 weight across 2872 main-thread samples. Shares below are of that weight unless noted.


## Callers of `free_tiny`

Inclusive 681wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 414 | 12.7% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 71 | 2.2% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 40 | 1.2% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 22 | 0.7% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 11 | 0.3% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 10 | 0.3% | `szone_realloc` |
| 8 | 0.2% | `core::ptr::drop_in_place<alloc::vec::Vec<indexmap::Bucket<alloc::string::String,serde_json::value::Value>>>` |
| 7 | 0.2% | `core::ptr::drop_in_place<styletrace::resolver::tracer::context::TraceSession>` |

## Callers of `tiny_malloc_should_clear`

Inclusive 679wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 679 | 20.8% | `szone_malloc_should_clear` |

## Callers of `semaphore_wait_trap`

Inclusive 265wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 265 | 8.1% | `_dispatch_sema4_wait` |

## Callers of `kevent`

Inclusive 212wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 212 | 6.5% | `uv__io_poll` |

## Callers of `tiny_free_no_lock`

Inclusive 327wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 327 | 10.0% | `free_tiny` |

## Callers of `stat$INODE64`

Inclusive 137wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 96 | 2.9% | `std::path::Path::is_file` |
| 32 | 1.0% | `std::path::Path::is_dir` |
| 5 | 0.2% | `std::sys::fs::metadata` |
| 4 | 0.1% | `uv__fs_work` |

## Callers of `tiny_malloc_from_free_list`

Inclusive 269wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 269 | 8.2% | `tiny_malloc_should_clear` |

## Callers of `rack_get_thread_index`

Inclusive 125wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 124 | 3.8% | `tiny_malloc_should_clear` |
| 1 | 0.0% | `small_malloc_should_clear` |

## Callers of `__open`

Inclusive 125wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 125 | 3.8% | `open` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 95wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 25 | 0.8% | `0x7ff7bc62251f` |
| 11 | 0.3% | `0x7ff7bc6234df` |
| 7 | 0.2% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 4 | 0.1% | `core::slice::sort::stable::drift::sort` |
| 3 | 0.1% | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 2 | 0.1% | `0x7ff7bc61818f` |
| 2 | 0.1% | `0x7ff7bc615ebf` |
| 2 | 0.1% | `0x7ff7bc616bdf` |

## Callers of `set_tiny_meta_header_in_use`

Inclusive 94wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 94 | 2.9% | `tiny_malloc_from_free_list` |

## Callers of `tiny_free_list_add_ptr`

Inclusive 84wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 71 | 2.2% | `tiny_free_no_lock` |
| 13 | 0.4% | `tiny_malloc_from_free_list` |

## Callers of `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push`

Inclusive 138wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 138 | 4.2% | `alloc::collections::btree::map::BTreeMap<K,V,A>::bulk_build_from_sorted_iter` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 82wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 39 | 1.2% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 26 | 0.8% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 8 | 0.2% | `styletrace::analysis::parser::component::component_from_function_like` |
| 3 | 0.1% | `styletrace::resolver::tracer::resolve::take_or_extend_owned` |
| 2 | 0.1% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 2 | 0.1% | `tasty::scan::scan_typescript_bundle` |
| 1 | 0.0% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 1 | 0.0% | `<alloc::vec::into_iter::IntoIter<T,A> as core::iter::traits::iterator::Iterator>::fold` |

## Callers of `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next`

Inclusive 118wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 85 | 2.6% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 9 | 0.3% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 9 | 0.3% | `core::ptr::drop_in_place<styletrace::resolver::model::TypeExpr>` |
| 4 | 0.1% | `styletrace::analysis::parser::component::component_from_function_like` |
| 4 | 0.1% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 3 | 0.1% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 2 | 0.1% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 1 | 0.0% | `styletrace::resolver::tracer::builtins::resolve_builtin_props` |

## Callers of `oxc_parser::lexer::Lexer::next_token`

Inclusive 81wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 12 | 0.4% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_lhs_expression_or_higher` |
| 6 | 0.2% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type` |
| 5 | 0.2% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_primary_expression` |
| 4 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_literal_string` |
| 4 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_assignment_expression_or_higher_impl` |
| 4 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binary_expression_or_higher` |
| 3 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_member_expression_rest` |
| 3 | 0.1% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_non_array_type` |

## Callers of `<alloc::string::String as core::clone::Clone>::clone`

Inclusive 600wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 511 | 15.7% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 67 | 2.1% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 11 | 0.3% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 5 | 0.2% | `styletrace::resolver::parser::parse_module` |
| 1 | 0.0% | `<alloc::vec::Vec<T,A> as core::clone::Clone>::clone` |
| 1 | 0.0% | `atomic::extract::resolver::ValueGraph::resolve_binding` |
| 1 | 0.0% | `atomic::diagnostics::proof::render::Proof::collect` |
| 1 | 0.0% | `tasty::scan::scan_typescript_bundle` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 55wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 19 | 0.6% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 12 | 0.4% | `std::path::Path::_join` |
| 5 | 0.2% | `core::slice::sort::stable::drift::sort` |
| 4 | 0.1% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 4 | 0.1% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 3 | 0.1% | `<alloc::string::String as core::clone::Clone>::clone` |
| 2 | 0.1% | `serde_json::ser::format_escaped_str` |
| 1 | 0.0% | `module_graph::ladder::SpecifierLadder<F>::resolve` |

## Callers of `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold`

Inclusive 533wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 533 | 16.3% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |

## Callers of `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.1% | `oxc_parser::lexer::byte_handlers::L_E` |
| 2 | 0.1% | `oxc_parser::lexer::byte_handlers::IDT` |
| 2 | 0.1% | `oxc_parser::lexer::byte_handlers::L_A` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_S` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_O` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_N` |
| 1 | 0.0% | `oxc_parser::lexer::byte_handlers::L_I` |

## Callers of `std::path::Components::parse_next_component_back`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 0.3% | `<std::path::Components as core::iter::traits::double_ended::DoubleEndedIterator>::next_back` |

## Callers of `core::slice::sort::stable::drift::sort`

Inclusive 49wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 49 | 1.5% | `core::slice::sort::stable::driftsort_main` |

## Malloc-family leaves by nearest atomic/canon ancestor

982wt of malloc-family leaves; 8wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 664 | 20.3% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 32 | 1.0% | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 26 | 0.8% | `styletrace::resolver::tracer::collect_style_prop_names` |
| 19 | 0.6% | `module_graph::walk::BindingWalk<L,F>::record_copy` |
| 17 | 0.5% | `styletrace::resolver::tracer::context::TraceContext::resolve_declaration` |
| 17 | 0.5% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 15 | 0.5% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 12 | 0.4% | `module_graph::walk::BindingWalk<L,F>::resolve_export` |
| 12 | 0.4% | `atomic::extract::identity::IdentityGraph::resolve` |
| 10 | 0.3% | `styletrace::resolver::tracer::builtins::resolve_builtin_literals` |
| 10 | 0.3% | `styletrace::resolver::tracer::resolve::resolve_literal_names_into` |
| 10 | 0.3% | `serde_core::de::impls::<impl serde_core::de::Deserialize for alloc::string::String>::deserialize` |
| 9 | 0.3% | `tasty::scanner::packages::relative::declaration_candidates` |
| 8 | 0.2% | `styletrace::analysis::parser::component::component_from_expression` |
| 8 | 0.2% | `tasty::scanner::packages::package_entry::find_installed_declaration_provider` |
| 7 | 0.2% | `styletrace::resolver::parser::parse_module` |
| 6 | 0.2% | `tasty::scanner::packages::relative::resolve_relative_import` |
| 6 | 0.2% | `tasty::scan::scan_typescript_bundle` |

## memmove leaves by nearest .node ancestor

67wt of memmove leaves; 14wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 29 | 0.9% | `<alloc::string::String as core::clone::Clone>::clone` |
| 5 | 0.2% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 3 | 0.1% | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Mut,K,V,alloc::collections::btree::node::marker::Leaf>,alloc::collections::btree::node::marker::Edge>::insert_recursing` |
| 2 | 0.1% | `atomic::extract_parallel::FileOut::commit` |
| 2 | 0.1% | `tasty::generator::util::indent_block` |
| 1 | 0.0% | `std::path::PathBuf::_push` |
| 1 | 0.0% | `atomic::extract::scope::table::ScopeTable::declare` |
| 1 | 0.0% | `module_graph::ladder::package::root_targets` |
| 1 | 0.0% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 1 | 0.0% | `oxc_parser::cursor::<impl oxc_parser::ParserImpl>::parse_delimited_list` |
| 1 | 0.0% | `oxc_allocator::vec2::Vec<T,A>::remove` |
| 1 | 0.0% | `tasty::scanner::packages::package_entry::push_package_json_entries` |
| 1 | 0.0% | `std::path::PathBuf::_set_extension` |
| 1 | 0.0% | `tasty::scanner::packages::node_modules::installed_package_dirs` |

## memcmp leaves by nearest .node ancestor

95wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 33 | 1.0% | `core::slice::sort::stable::drift::sort` |
| 28 | 0.9% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 14 | 0.4% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 8 | 0.2% | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 4 | 0.1% | `<alloc::collections::btree::set::Difference<T,A> as core::iter::traits::iterator::Iterator>::next` |
| 3 | 0.1% | `tasty::ast::resolve::index::ExportFold::collect` |
| 2 | 0.1% | `tasty::scanner::workspace::crawler::Crawler::run` |
| 1 | 0.0% | `atomic::extract::constants::index::LocalConstants::get_object_prop` |
| 1 | 0.0% | `<std::path::Component as core::cmp::PartialEq>::eq` |
| 1 | 0.0% | `<core::str::pattern::CharSearcher as core::str::pattern::Searcher>::next_match` |

## File opens by issuing frame

125wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 125 | 3.8% | `std::sys::fs::unix::File::open_c [reference-native.darwin-x64.node]` |

## Callees: hottest deduped native edges

935wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 927 | 28.4% | `reference_native::atomic::__napi__compile_system → atomic::compile` |
| 903 | 27.7% | `atomic::compile → std::thread::scoped::scope` |
| 875 | 26.8% | `std::thread::scoped::scope → atomic::phase_parallel::drive_rounds` |
| 462 | 14.2% | `atomic::phase_parallel::drive_rounds → atomic::phase_merge::publish` |
| 460 | 14.1% | `atomic::phase_merge::publish → atomic::hosts::resolve_prepared` |
| 458 | 14.0% | `atomic::hosts::resolve_prepared → styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 458 | 14.0% | `styletrace::analysis::surface::trace_style_bindings_with_modules → styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 457 | 14.0% | `styletrace::analysis::surface::SurfaceTraceSession::trace_with → styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 446 | 13.7% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded → styletrace::analysis::parser::parse_trace_module` |
| 439 | 13.5% | `styletrace::analysis::parser::parse_trace_module → styletrace::analysis::parser::fold_trace_module` |
| 371 | 11.4% | `styletrace::analysis::parser::types::resolve_style_props_from_type_annotation → styletrace::resolver::tracer::collect_style_prop_names` |
| 347 | 10.6% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings → styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 319 | 9.8% | `styletrace::resolver::tracer::collect_style_prop_names → styletrace::resolver::tracer::resolve::resolve_reference_props` |
| 309 | 9.5% | `styletrace::analysis::parser::fold_trace_module → styletrace::analysis::parser::collect_variable_symbols` |
| 309 | 9.5% | `styletrace::analysis::parser::collect_variable_symbols → styletrace::analysis::parser::component::component_from_expression` |
| 278 | 8.5% | `styletrace::resolver::tracer::resolve::resolve_reference_props → styletrace::resolver::tracer::resolve::resolve_decl_props_into` |
| 278 | 8.5% | `styletrace::resolver::tracer::resolve::resolve_decl_props_into → styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 265 | 8.1% | `atomic::phase_parallel::drive_rounds → std::sync::mpmc::list::Channel<T>::recv` |
| 265 | 8.1% | `std::sync::mpmc::list::Channel<T>::recv → std::sync::mpmc::list::Channel<T>::recv::{{closure}}` |
| 265 | 8.1% | `std::sync::mpmc::list::Channel<T>::recv::{{closure}} → std::thread::thread::Thread::park` |
| 240 | 7.4% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into → styletrace::resolver::tracer::resolve::resolve_prop_names_into` |
| 202 | 6.2% | `styletrace::analysis::parser::component::component_from_function_like → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |
| 197 | 6.0% | `styletrace::resolver::tracer::resolve::resolve_prop_names_into → styletrace::resolver::tracer::resolve::resolve_decl_props_into` |
| 196 | 6.0% | `styletrace::resolver::tracer::context::TraceContext::resolve_declaration → styletrace::resolver::parser::parse_module` |
| 187 | 5.7% | `styletrace::analysis::parser::component::component_from_expression → styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 600 | 551 | 92% | `<alloc::string::String as core::clone::Clone>::clone` |
| 533 | 516 | 97% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 138 | 79 | 57% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 118 | 46 | 39% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 55 | 36 | 65% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 66 | 36 | 55% | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 82 | 13 | 16% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 25 | 13 | 52% | `indexmap::map::IndexMap<K,V,S>::insert_full` |
| 112 | 9 | 8% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binary_expression_or_higher` |
| 49 | 6 | 12% | `core::slice::sort::stable::drift::sort` |
| 81 | 1 | 1% | `oxc_parser::lexer::Lexer::next_token` |
| 11 | 0 | 0% | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 11 | 0 | 0% | `std::path::Components::parse_next_component_back` |
| 9 | 0 | 0% | `__rustc::__rust_dealloc` |
| 7 | 0 | 0% | `__rustc::__rdl_alloc` |
