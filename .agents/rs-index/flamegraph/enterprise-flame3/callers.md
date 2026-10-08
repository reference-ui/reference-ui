# Caller attribution: enterprise (latest)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `docs/evidence/flamegraph/enterprise-flame3`.
Derived 2026-09-21T18:37:11.822Z via `pnpm agentrs flame --callers docs/evidence/flamegraph/enterprise-flame3`; no re-record, bundle raws untouched.
Covers 1349 weight across 1329 main-thread samples. Shares below are of that weight unless noted.


## Callers of `__open`

Inclusive 251wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 251 | 18.6% | `open` |

## Callers of `nanov2_malloc_type`

Inclusive 127wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 26 | 1.9% | `<alloc::string::String as core::clone::Clone>::clone` |
| 22 | 1.6% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 13 | 1.0% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 7 | 0.5% | `canon::css::values::lengths::is_length` |
| 7 | 0.5% | `atomic::resolve::authored_key` |
| 7 | 0.5% | `atomic::runtime::serializer::serialize_lookup_key` |
| 5 | 0.4% | `alloc::fmt::format::format_inner` |
| 2 | 0.1% | `operator new(unsigned long)` |

## Callers of `_nanov2_free`

Inclusive 87wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 10 | 0.7% | `nanov2_realloc` |
| 5 | 0.4% | `core::ptr::drop_in_place<atomic::atom::want::Want>` |
| 4 | 0.3% | `<hashbrown::raw::RawTable<T,A> as core::ops::drop::Drop>::drop` |
| 4 | 0.3% | `<alloc::vec::Vec<T,A> as core::ops::drop::Drop>::drop` |
| 4 | 0.3% | `atomic::compile` |
| 4 | 0.3% | `core::ptr::drop_in_place<serde_json::value::Value>` |
| 3 | 0.2% | `module_graph::ladder::SpecifierLadder<F>::package_hit` |
| 3 | 0.2% | `atomic::extract::expressions::object::walk_style_object` |

## Callers of `_platform_memmove$VARIANT$Haswell`

Inclusive 70wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `v8::internal::FactoryBase<v8::internal::Factory>::NewStringFromOneByte(v8::base::Vector<unsigned char const>, v8::internal::AllocationType)` |
| 5 | 0.4% | `szone_realloc` |
| 5 | 0.4% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 4 | 0.3% | `atomic::diagnostics::analysis::analyze` |
| 4 | 0.3% | `atomic::compile` |
| 3 | 0.2% | `v8::internal::JsonStringifier::Extend()` |
| 3 | 0.2% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.2% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 52wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.3% | `0x7ff7b4494d8f` |
| 4 | 0.3% | `0x7ff7b449537f` |
| 3 | 0.2% | `0x7ff7b4494cef` |
| 2 | 0.1% | `0x7ff7b4494f8f` |
| 2 | 0.1% | `canon::css::values::lengths::is_length` |
| 2 | 0.1% | `0x7ff7b449538f` |
| 2 | 0.1% | `0x7ff7b4494eef` |
| 2 | 0.1% | `0x7ff7b4494c8f` |

## Callers of `madvise`

Inclusive 36wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 36 | 2.7% | `mvm_madvise_plat` |

## Callers of `kevent`

Inclusive 33wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 33 | 2.4% | `uv__io_poll` |

## Callers of `read`

Inclusive 27wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 27 | 2.0% | `uv__fs_work` |

## Callers of `canon::dialect::resolve_alias`

Inclusive 33wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 17 | 1.3% | `canon::resolve_canonical_prop` |
| 5 | 0.4% | `canon::is_known_style_prop` |
| 4 | 0.3% | `canon::css::native_longhands_for_prop` |
| 4 | 0.3% | `canon::css::is_color_prop` |
| 1 | 0.1% | `canon::css::property_cascade_rank` |
| 1 | 0.1% | `canon::to_css_declaration_property` |
| 1 | 0.1% | `canon::class_prefix_for_prop` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_expression`

Inclusive 44wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 33 | 2.4% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 4 | 0.3% | `<atomic::extract::scope::call_init::CallInitPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 2 | 0.1% | `<atomic::extract::constants::collect::ConstCollector as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 2 | 0.1% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `<atomic::diagnostics::analysis::css::CssVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_statement` |
| 1 | 0.1% | `atomic::extract::harvest::literals::collect_pool` |

## Callers of `nanov2_malloc`

Inclusive 19wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 19 | 1.4% | `nanov2_realloc` |

## Callers of `canon::css::find_property`

Inclusive 21wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.7% | `canon::is_known_style_prop` |
| 6 | 0.4% | `canon::css::native_longhands_for_prop` |
| 3 | 0.2% | `canon::css::property_cascade_rank` |
| 2 | 0.1% | `canon::to_css_declaration_property` |
| 1 | 0.1% | `canon::class_prefix_for_prop` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 63wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 35 | 2.6% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 8 | 0.6% | `std::path::PathBuf::_push` |
| 5 | 0.4% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 3 | 0.2% | `atomic::extract::extract_with_context` |
| 2 | 0.1% | `atomic::diagnostics::analysis::analyze` |
| 2 | 0.1% | `canon::dialect::resolve_alias` |
| 1 | 0.1% | `std::path::Path::_join` |
| 1 | 0.1% | `std::path::compare_components` |

## Callers of `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.7% | `core::hash::BuildHasher::hash_one` |

## Callers of `canon::css::values::lengths::is_length`

Inclusive 25wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 14 | 1.0% | `canon::css::values::classify::classify_css_value` |
| 11 | 0.8% | `atomic::extract::harvest::classify::classify_harvest_value` |

## Callers of `std::path::compare_components`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `core::slice::sort::stable::quicksort::quicksort` |
| 3 | 0.2% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 2 | 0.1% | `core::slice::sort::shared::smallsort::small_sort_general_with_scratch` |
| 2 | 0.1% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 1 | 0.1% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::component_is_traced` |

## Callers of `oxc_parser::lexer::Lexer::next_token`

Inclusive 17wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.6% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_primary_expression` |
| 4 | 0.3% | `core::ops::function::FnMut::call_mut` |
| 2 | 0.1% | `oxc_parser::js::function::<impl oxc_parser::ParserImpl>::parse_formal_parameters` |
| 1 | 0.1% | `oxc_parser::js::declaration::<impl oxc_parser::ParserImpl>::parse_variable_declarator` |
| 1 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_identifier_expression` |
| 1 | 0.1% | `oxc_parser::js::object::<impl oxc_parser::ParserImpl>::parse_property_name` |

## Callers of `core::hash::BuildHasher::hash_one`

Inclusive 18wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.5% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 5 | 0.4% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 0.2% | `module_graph::ladder::memo::cached` |
| 1 | 0.1% | `styletrace::analysis::parser::parse_trace_module` |
| 1 | 0.1% | `atomic::extract::resolver::source::AtomicFs::content` |
| 1 | 0.1% | `atomic::resolve::conditions::lower_when` |

## Callers of `alloc::slice::<impl [T]>::sort_by::{{closure}}`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.7% | `core::slice::sort::stable::quicksort::quicksort` |
| 2 | 0.1% | `core::slice::sort::shared::smallsort::small_sort_general_with_scratch` |
| 1 | 0.1% | `core::slice::sort::shared::smallsort::insertion_sort_shift_left` |
| 1 | 0.1% | `core::slice::sort::stable::drift::sort` |

## Malloc-family leaves by nearest atomic/canon ancestor

262wt of malloc-family leaves; 4wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 20 | 1.5% | `atomic::assembly::AssembleCtx::finish` |
| 19 | 1.4% | `atomic::resolve::resolve_want_with` |
| 15 | 1.1% | `atomic::compile` |
| 10 | 0.7% | `canon::css::values::lengths::is_length` |
| 9 | 0.7% | `atomic::resolve::authored_key` |
| 9 | 0.7% | `atomic::runtime::serializer::canonical_json_value` |
| 8 | 0.6% | `atomic::includes::IncludeScope::matches_file` |
| 8 | 0.6% | `module_graph::ladder::SpecifierLadder<F>::resolve` |
| 8 | 0.6% | `atomic::runtime::serializer::serialize_lookup_key` |
| 7 | 0.5% | `module_graph::key::normalize_str` |
| 6 | 0.4% | `module_graph::ladder::SpecifierLadder<F>::package_hit` |
| 6 | 0.4% | `atomic::extract::expressions::object::walk_style_object` |
| 6 | 0.4% | `atomic::resolve::tokens::format_entry` |
| 6 | 0.4% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 5 | 0.4% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 5 | 0.4% | `atomic::stylesheet::cascade::write_utilities` |
| 4 | 0.3% | `module_graph::ladder::package::types_package_name` |
| 4 | 0.3% | `atomic::stylesheet::name::selector_with_system` |

## memmove leaves by nearest .node ancestor

70wt of memmove leaves; 19wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.4% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 5 | 0.4% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 4 | 0.3% | `atomic::diagnostics::analysis::analyze` |
| 4 | 0.3% | `atomic::compile` |
| 3 | 0.2% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.2% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 0.2% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 2 | 0.1% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 2 | 0.1% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 2 | 0.1% | `atomic::stylesheet::layers::wrap_package_layer` |
| 2 | 0.1% | `napi::bindgen_runtime::js_values::string::<impl napi::bindgen_runtime::js_values::ToNapiValue for &alloc::string::String>::to_napi_value` |
| 1 | 0.1% | `atomic::includes::trim_slashes` |
| 1 | 0.1% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 1 | 0.1% | `oxc_parser::module_record::ModuleRecordBuilder::build` |

## memcmp leaves by nearest .node ancestor

52wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.7% | `canon::css::find_property` |
| 8 | 0.6% | `canon::dialect::resolve_alias` |
| 6 | 0.4% | `canon::css::values::lengths::is_length` |
| 5 | 0.4% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 4 | 0.3% | `atomic::diagnostics::proof::render::render_with` |
| 3 | 0.2% | `canon::css::values::named_colors::is_named_color` |
| 2 | 0.1% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 2 | 0.1% | `canon::css::is_color_prop` |
| 2 | 0.1% | `atomic::stylesheet::cascade::CascadeKey::from_atom` |
| 1 | 0.1% | `atomic::extract::constants::index::LocalConstants::merge` |
| 1 | 0.1% | `canon::is_known_style_prop` |
| 1 | 0.1% | `module_graph::ladder::memo::cached` |
| 1 | 0.1% | `atomic::extract::scope::collect::clear::clear_unbound_calls` |
| 1 | 0.1% | `hashbrown::map::HashMap<K,V,S,A>::insert` |

## File opens by issuing frame

251wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 250 | 18.5% | `uv__fs_work [node]` |
| 1 | 0.1% | `std::sys::fs::unix::File::open_c [virtual-native.darwin-x64.node]` |

## Callees: hottest deduped native edges

778wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 729 | 54.0% | `reference_virtual_native::atomic::__napi__compile_system → atomic::compile` |
| 296 | 21.9% | `atomic::compile → atomic::assembly::AssembleCtx::finish` |
| 83 | 6.2% | `atomic::assembly::AssembleCtx::finish → atomic::runtime::builder::PlanBuilder::build_keyed` |
| 71 | 5.3% | `atomic::assembly::AssembleCtx::finish → atomic::resolve::resolve_want_with` |
| 67 | 5.0% | `oxc_ast_visit::generated::visit::walk::walk_function → oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 63 | 4.7% | `atomic::runtime::builder::PlanBuilder::build_keyed → atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 62 | 4.6% | `atomic::assembly::AssembleCtx::finish → atomic::stylesheet::emitter::build_stylesheets_with` |
| 56 | 4.2% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 56 | 4.2% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 53 | 3.9% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle → alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 51 | 3.8% | `atomic::compile → atomic::extract::extract_with_context` |
| 51 | 3.8% | `atomic::runtime::builder::PlanBuilder::resolve_entry → atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 51 | 3.8% | `atomic::runtime::builder::resolve_with_unique_diagnostics → atomic::resolve::resolve_want_with` |
| 51 | 3.8% | `atomic::stylesheet::emitter::build_stylesheets_with → atomic::stylesheet::cascade::write_utilities` |
| 49 | 3.6% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration` |
| 49 | 3.6% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration` |
| 49 | 3.6% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration → oxc_parser::ts::statement::<impl oxc_parser::ParserImpl>::parse_declaration` |
| 47 | 3.5% | `atomic::compile → atomic::hosts::resolve` |
| 46 | 3.4% | `oxc_ast_visit::generated::visit::walk::walk_declaration → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 46 | 3.4% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 44 | 3.3% | `atomic::compile → atomic::extract::resolver::ValueGraph::resolve_file_imports` |
| 43 | 3.2% | `atomic::resolve::resolve_want_with → atomic::resolve::tokens::resolve_token_value` |
| 42 | 3.1% | `atomic::extract::resolver::ValueGraph::resolve_file_imports → <hashbrown::map::HashMap<K,V,S,A> as core::iter::traits::collect::Extend<(K,V)>>::extend` |
| 41 | 3.0% | `oxc_ast_visit::generated::visit::walk::walk_expression → oxc_ast_visit::generated::visit::walk::walk_expression` |
| 39 | 2.9% | `atomic::compile → atomic::stream::merge_constants_ordered` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 63 | 53 | 84% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 44 | 14 | 32% | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 25 | 10 | 40% | `canon::css::values::lengths::is_length` |
| 29 | 4 | 14% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 33 | 2 | 6% | `canon::dialect::resolve_alias` |
| 30 | 2 | 7% | `core::ops::function::FnMut::call_mut` |
| 13 | 1 | 8% | `std::path::compare_components` |
| 21 | 0 | 0% | `canon::css::find_property` |
| 9 | 0 | 0% | `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write` |
| 17 | 0 | 0% | `oxc_parser::lexer::Lexer::next_token` |
| 18 | 0 | 0% | `core::hash::BuildHasher::hash_one` |
| 13 | 0 | 0% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 6 | 0 | 0% | `<std::path::Components as core::iter::traits::iterator::Iterator>::next` |
| 5 | 0 | 0% | `atomic::resolve::conditions::pseudoselectors::member_needs_is_wrap` |
| 4 | 0 | 0% | `oxc_parser::module_record::ModuleRecordBuilder::add_module_request` |
