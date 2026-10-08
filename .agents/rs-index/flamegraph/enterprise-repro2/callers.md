# Caller attribution: enterprise (810b8b5b4744)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `../../../../../../../tmp/swarm-repro-flame/enterprise-repro2`.
Derived 2026-09-21T23:05:52.911Z via `pnpm agentrs flame --callers /tmp/swarm-repro-flame/enterprise-repro2`; no re-record, bundle raws untouched.
Covers 1218 weight across 1196 main-thread samples. Shares below are of that weight unless noted.


## Callers of `__open`

Inclusive 251wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 251 | 20.6% | `open` |

## Callers of `nanov2_malloc_type`

Inclusive 97wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 15 | 1.2% | `<alloc::string::String as core::clone::Clone>::clone` |
| 13 | 1.1% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 11 | 0.9% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 5 | 0.4% | `module_graph::key::normalize_str` |
| 5 | 0.4% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 4 | 0.3% | `atomic::extract::expressions::literal::push_string_want` |
| 4 | 0.3% | `atomic::resolve::resolve_want_with` |
| 3 | 0.2% | `alloc::str::join_generic_copy` |

## Callers of `_nanov2_free`

Inclusive 61wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `core::ptr::drop_in_place<atomic::atom::want::Want>` |
| 4 | 0.3% | `nanov2_realloc` |
| 4 | 0.3% | `module_graph::ladder::SpecifierLadder<F>::resolve` |
| 3 | 0.2% | `atomic::includes::IncludeScope::matches_file` |
| 3 | 0.2% | `<hashbrown::raw::RawTable<T,A> as core::ops::drop::Drop>::drop` |
| 3 | 0.2% | `<alloc::vec::Vec<T,A> as core::ops::drop::Drop>::drop` |
| 3 | 0.2% | `atomic::compile` |
| 3 | 0.2% | `atomic::resolve::resolve_want_with` |

## Callers of `_platform_memmove$VARIANT$Haswell`

Inclusive 53wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.3% | `v8::internal::JsonStringifier::Extend()` |
| 4 | 0.3% | `v8::internal::FactoryBase<v8::internal::Factory>::NewStringFromOneByte(v8::base::Vector<unsigned char const>, v8::internal::AllocationType)` |
| 4 | 0.3% | `atomic::compile` |
| 3 | 0.2% | `v8::internal::LiteralBuffer::ExpandBuffer()` |
| 3 | 0.2% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 3 | 0.2% | `atomic::resolve::resolve_want_with` |
| 2 | 0.2% | `v8::internal::Scavenger::ScavengeObject<v8::internal::FullHeapObjectSlot>(v8::internal::FullHeapObjectSlot, v8::internal::Tagged<v8::internal::HeapObject>)` |
| 2 | 0.2% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |

## Callers of `madvise`

Inclusive 41wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 41 | 3.4% | `mvm_madvise_plat` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 39wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `0x7ff7bc2e7bef` |
| 4 | 0.3% | `0x7ff7bc2e857f` |
| 3 | 0.2% | `0x7ff7bc2e7a8f` |
| 3 | 0.2% | `canon::css::find_property` |
| 2 | 0.2% | `0x7ff7bc2e7f3f` |
| 2 | 0.2% | `0x7ff7bc2e807f` |
| 1 | 0.1% | `Builtins_StringIndexOf` |
| 1 | 0.1% | `0x7ff7bc2e55ef` |

## Callers of `kevent`

Inclusive 37wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 37 | 3.0% | `uv__io_poll` |

## Callers of `read`

Inclusive 20wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 20 | 1.6% | `uv__fs_work` |

## Callers of `__write_nocancel`

Inclusive 18wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 18 | 1.5% | `_swrite` |

## Callers of `__close_nocancel`

Inclusive 16wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 16 | 1.3% | `uv__fs_work` |

## Callers of `canon::css::find_property`

Inclusive 29wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 22 | 1.8% | `canon::is_known_style_prop` |
| 6 | 0.5% | `canon::css::native_longhands_for_prop` |
| 1 | 0.1% | `canon::class_prefix_for_prop` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_expression`

Inclusive 26wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 19 | 1.6% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 3 | 0.2% | `<atomic::extract::constants::collect::ConstCollector as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `atomic::extract::constants::collect::collect_local_constants` |
| 1 | 0.1% | `<atomic::diagnostics::analysis::css::CssVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `oxc_ast_visit::generated::visit::walk::walk_function` |

## Callers of `<std::path::Components as core::iter::traits::iterator::Iterator>::next`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.6% | `std::path::compare_components` |
| 3 | 0.2% | `module_graph::key::normalize_str` |
| 1 | 0.1% | `std::path::Path::_strip_prefix` |

## Callers of `canon::css::values::lengths::is_length`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.7% | `atomic::extract::harvest::classify::classify_harvest_value` |
| 3 | 0.2% | `canon::css::values::classify::classify_css_value` |

## Callers of `core::hash::BuildHasher::hash_one`

Inclusive 16wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 4 | 0.3% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 1 | 0.1% | `<styletrace::analysis::module_resolution::ModuleResolver as module_graph::fs::FileSystem>::is_dir` |
| 1 | 0.1% | `module_graph::graph::ModuleGraph<L>::ensure` |
| 1 | 0.1% | `module_graph::ladder::memo::cached` |
| 1 | 0.1% | `atomic::extract::harvest::literals::collect_pool` |
| 1 | 0.1% | `atomic::resolve::tokens::lookup_entry` |
| 1 | 0.1% | `indexmap::map::IndexMap<K,V,S>::insert_full` |

## Callers of `canon::dialect::resolve_alias`

Inclusive 10wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `canon::resolve_canonical_prop` |
| 2 | 0.2% | `canon::is_known_style_prop` |
| 1 | 0.1% | `canon::css::is_color_prop` |
| 1 | 0.1% | `canon::css::native_longhands_for_prop` |

## Callers of `oxc_allocator::bump::Bump::alloc_layout_slow`

Inclusive 8wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.6% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_import_specifiers` |
| 1 | 0.1% | `oxc_parser::js::binding::<impl oxc_parser::ParserImpl>::parse_binding_pattern_kind` |

## Callers of `hashbrown::map::HashMap<K,V,S,A>::insert`

Inclusive 20wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.3% | `hashbrown::raw::RawIterRange<T>::fold_impl` |
| 4 | 0.3% | `atomic::extract::harvest::mint::mint` |
| 2 | 0.2% | `atomic::diagnostics::analysis::record_declarator_shadow` |
| 2 | 0.2% | `atomic::diagnostics::proof::render::Proof::collect` |
| 1 | 0.1% | `atomic::extract::resolver::ValueGraph::new` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 1 | 0.1% | `styletrace::analysis::parser::trace_program` |
| 1 | 0.1% | `styletrace::analysis::parser::collect_variable_symbols` |

## Callers of `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.7% | `atomic::atom::set::AtomSet::insert` |

## Callers of `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write`

Inclusive 6wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `core::hash::BuildHasher::hash_one` |

## Malloc-family leaves by nearest atomic/canon ancestor

186wt of malloc-family leaves; 5wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 18 | 1.5% | `atomic::resolve::resolve_want_with` |
| 17 | 1.4% | `atomic::compile` |
| 16 | 1.3% | `atomic::assembly::AssembleCtx::finish` |
| 10 | 0.8% | `atomic::includes::IncludeScope::matches_file` |
| 6 | 0.5% | `atomic::resolve::conditions::lower_when` |
| 6 | 0.5% | `atomic::runtime::serializer::serialize_lookup_key` |
| 5 | 0.4% | `module_graph::key::normalize_str` |
| 5 | 0.4% | `atomic::extract::expressions::literal::push_string_want` |
| 5 | 0.4% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 4 | 0.3% | `atomic::extract::identity::normalize_path` |
| 4 | 0.3% | `atomic::extract::fold::key::fold_property_key` |
| 4 | 0.3% | `module_graph::ladder::SpecifierLadder<F>::resolve` |
| 4 | 0.3% | `atomic::resolve::authored_key` |
| 4 | 0.3% | `atomic::resolve::tokens::format_entry` |
| 3 | 0.2% | `atomic::sources::collect` |
| 3 | 0.2% | `atomic::extract::resolver::ValueGraph::new` |
| 3 | 0.2% | `atomic::diagnostics::analysis::conditions::static_key` |
| 3 | 0.2% | `atomic::extract::expressions::object::walk_style_object` |

## memmove leaves by nearest .node ancestor

53wt of memmove leaves; 16wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.3% | `atomic::compile` |
| 3 | 0.2% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 3 | 0.2% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 3 | 0.2% | `atomic::resolve::resolve_want_with` |
| 2 | 0.2% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 2 | 0.2% | `<alloc::string::String as core::clone::Clone>::clone` |
| 2 | 0.2% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 2 | 0.2% | `alloc::str::join_generic_copy` |
| 2 | 0.2% | `atomic::extract::extract_with_context` |
| 2 | 0.2% | `napi::bindgen_runtime::js_values::string::<impl napi::bindgen_runtime::js_values::ToNapiValue for &alloc::string::String>::to_napi_value` |
| 1 | 0.1% | `<serde_json::read::StrRead as serde_json::read::Read>::parse_str` |
| 1 | 0.1% | `atomic::includes::trim_slashes` |
| 1 | 0.1% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |

## memcmp leaves by nearest .node ancestor

39wt of memcmp leaves; 1wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 13 | 1.1% | `canon::css::find_property` |
| 5 | 0.4% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 3 | 0.2% | `atomic::extract::constants::index::LocalConstants::merge` |
| 2 | 0.2% | `std::path::compare_components` |
| 2 | 0.2% | `canon::dialect::resolve_alias` |
| 2 | 0.2% | `canon::css::is_color_prop` |
| 2 | 0.2% | `canon::is_known_style_prop` |
| 2 | 0.2% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 2 | 0.2% | `atomic::diagnostics::proof::render::render_with` |
| 1 | 0.1% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 1 | 0.1% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 1 | 0.1% | `atomic::extract::recipes::selection::resolve_all` |
| 1 | 0.1% | `core::slice::sort::stable::quicksort::quicksort` |
| 1 | 0.1% | `core::slice::sort::shared::smallsort::small_sort_general_with_scratch` |

## File opens by issuing frame

251wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 251 | 20.6% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

644wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 597 | 49.0% | `reference_virtual_native::atomic::__napi__compile_system → atomic::compile` |
| 236 | 19.4% | `atomic::compile → atomic::assembly::AssembleCtx::finish` |
| 70 | 5.7% | `atomic::assembly::AssembleCtx::finish → atomic::runtime::builder::PlanBuilder::build_keyed` |
| 57 | 4.7% | `oxc_ast_visit::generated::visit::walk::walk_function → oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 57 | 4.7% | `atomic::compile → atomic::extract::extract_with_context` |
| 56 | 4.6% | `atomic::assembly::AssembleCtx::finish → atomic::resolve::resolve_want_with` |
| 54 | 4.4% | `atomic::runtime::builder::PlanBuilder::build_keyed → atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 49 | 4.0% | `oxc_ast_visit::generated::visit::walk::walk_declaration → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 48 | 3.9% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 42 | 3.4% | `atomic::runtime::builder::PlanBuilder::resolve_entry → atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 42 | 3.4% | `atomic::runtime::builder::resolve_with_unique_diagnostics → atomic::resolve::resolve_want_with` |
| 37 | 3.0% | `atomic::assembly::AssembleCtx::finish → atomic::stylesheet::emitter::build_stylesheets_with` |
| 36 | 3.0% | `atomic::compile → atomic::sources::collect` |
| 36 | 3.0% | `atomic::compile → atomic::extract::resolver::ValueGraph::resolve_file_imports` |
| 34 | 2.8% | `atomic::compile → atomic::hosts::resolve` |
| 33 | 2.7% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 33 | 2.7% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 32 | 2.6% | `atomic::extract::resolver::ValueGraph::resolve_file_imports → <hashbrown::map::HashMap<K,V,S,A> as core::iter::traits::collect::Extend<(K,V)>>::extend` |
| 31 | 2.5% | `atomic::extract::extract_with_context → oxc_ast_visit::generated::visit::walk::walk_function` |
| 30 | 2.5% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle → alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 29 | 2.4% | `<hashbrown::map::HashMap<K,V,S,A> as core::iter::traits::collect::Extend<(K,V)>>::extend → atomic::extract::resolver::ValueGraph::resolve_binding` |
| 29 | 2.4% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression → atomic::extract::css::extract` |
| 29 | 2.4% | `atomic::extract::css::extract → atomic::extract::css::handle_css_arg` |
| 29 | 2.4% | `atomic::stylesheet::emitter::build_stylesheets_with → atomic::stylesheet::cascade::write_utilities` |
| 27 | 2.2% | `atomic::extract::css::handle_css_arg → atomic::extract::expressions::object::walk_style_object` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 35 | 30 | 86% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 15 | 5 | 33% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 29 | 1 | 3% | `canon::css::find_property` |
| 26 | 1 | 4% | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 8 | 1 | 13% | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 20 | 1 | 5% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 11 | 0 | 0% | `<std::path::Components as core::iter::traits::iterator::Iterator>::next` |
| 12 | 0 | 0% | `canon::css::values::lengths::is_length` |
| 16 | 0 | 0% | `core::hash::BuildHasher::hash_one` |
| 10 | 0 | 0% | `canon::dialect::resolve_alias` |
| 9 | 0 | 0% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 6 | 0 | 0% | `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write` |
| 8 | 0 | 0% | `oxc_parser::lexer::Lexer::next_token` |
| 8 | 0 | 0% | `canon::css::is_color_prop` |
| 13 | 0 | 0% | `std::path::compare_components` |
