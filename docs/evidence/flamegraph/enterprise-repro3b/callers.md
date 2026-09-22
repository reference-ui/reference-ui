# Caller attribution: enterprise (3dd32a659715)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `../../../../../../../tmp/swarm-repro2-flame/enterprise-repro3b`.
Derived 2026-09-22T02:04:09.317Z via `pnpm agentrs flame --callers /tmp/swarm-repro2-flame/enterprise-repro3b --out /tmp/swarm-repro2-flame/enterprise-repro3b`; no re-record, bundle raws untouched.
Covers 1153 weight across 1129 main-thread samples. Shares below are of that weight unless noted.


## Callers of `__open`

Inclusive 244wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 244 | 21.2% | `open` |

## Callers of `nanov2_malloc_type`

Inclusive 87wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 1.0% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 10 | 0.9% | `<alloc::string::String as core::clone::Clone>::clone` |
| 9 | 0.8% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 6 | 0.5% | `atomic::resolve::resolve_want_with` |
| 5 | 0.4% | `atomic::resolve::authored_key` |
| 3 | 0.3% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 3 | 0.3% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 3 | 0.3% | `module_graph::ladder::join_with` |

## Callers of `_nanov2_free`

Inclusive 57wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.6% | `core::ptr::drop_in_place<atomic::diagnostics::facts::OwnedLookupKey>` |
| 4 | 0.3% | `nanov2_realloc` |
| 3 | 0.3% | `module_graph::ladder::SpecifierLadder<F>::resolve` |
| 3 | 0.3% | `atomic::resolve::resolve_want_with` |
| 3 | 0.3% | `core::ptr::drop_in_place<atomic::atom::when::When>` |
| 3 | 0.3% | `core::ptr::drop_in_place<atomic::atom::decl::Atom>` |
| 2 | 0.2% | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_type_or_type_predicate` |
| 2 | 0.2% | `module_graph::key::normalize_str` |

## Callers of `_platform_memmove$VARIANT$Haswell`

Inclusive 51wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `v8::internal::JsonStringifier::Extend()` |
| 5 | 0.4% | `v8::internal::FactoryBase<v8::internal::Factory>::NewStringFromOneByte(v8::base::Vector<unsigned char const>, v8::internal::AllocationType)` |
| 4 | 0.3% | `v8::internal::JsonStringifier::SerializeString<false>(v8::internal::Handle<v8::internal::String>)` |
| 4 | 0.3% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 0.3% | `v8::internal::LiteralBuffer::ExpandBuffer()` |
| 3 | 0.3% | `v8::internal::Utf8DecoderBase<v8::internal::Utf8Decoder>::Decode<unsigned char>(unsigned char*, v8::base::Vector<unsigned char const>)` |
| 3 | 0.3% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 3 | 0.3% | `atomic::compile` |

## Callers of `kevent`

Inclusive 40wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 40 | 3.5% | `uv__io_poll` |

## Callers of `madvise`

Inclusive 37wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 37 | 3.2% | `mvm_madvise_plat` |

## Callers of `read`

Inclusive 24wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 23 | 2.0% | `uv__fs_work` |
| 1 | 0.1% | `uv__stream_io` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 21wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `0x7ff7b6e04b0f` |
| 2 | 0.2% | `0x7ff7b6e056ef` |
| 2 | 0.2% | `0x7ff7b6e044df` |
| 2 | 0.2% | `0x7ff7b6e037cf` |
| 1 | 0.1% | `0x7ff7b6e0468f` |
| 1 | 0.1% | `0x7ff7b6e049cf` |
| 1 | 0.1% | `canon::css::find_property` |
| 1 | 0.1% | `0x7ff7b6e04def` |

## Callers of `__close_nocancel`

Inclusive 17wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 17 | 1.5% | `uv__fs_work` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_expression`

Inclusive 29wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 19 | 1.6% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 4 | 0.3% | `<atomic::extract::constants::collect::ConstCollector as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 2 | 0.2% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::diagnostics::analysis::css::CssVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::extract::scope::call_init::CallInitPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `oxc_ast_visit::generated::visit::walk::walk_function` |

## Callers of `__write_nocancel`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 12 | 1.0% | `_swrite` |

## Callers of `__getdirentries64`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 12 | 1.0% | `_readdir_unlocked$INODE64` |

## Callers of `canon::css::values::lengths::is_length`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.6% | `atomic::extract::harvest::classify::classify_harvest_value` |
| 6 | 0.5% | `canon::css::values::classify::classify_css_value` |

## Callers of `core::hash::BuildHasher::hash_one`

Inclusive 10wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.3% | `atomic::diagnostics::proof::render::Proof::collect` |
| 2 | 0.2% | `hashbrown::rustc_entry::<impl hashbrown::map::HashMap<K,V,S,A>>::rustc_entry` |
| 2 | 0.2% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 1 | 0.1% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 1 | 0.1% | `indexmap::map::IndexMap<K,V,S>::insert_full` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 25wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 1.0% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 2 | 0.2% | `atomic::diagnostics::analysis::analyze` |
| 2 | 0.2% | `atomic::extract::extract_with_context` |
| 2 | 0.2% | `atomic::stylesheet::cascade::push_declaration` |
| 1 | 0.1% | `std::path::Path::_join` |
| 1 | 0.1% | `atomic::includes::FileMatcher::matches_file` |
| 1 | 0.1% | `<alloc::string::String as core::fmt::Write>::write_char` |
| 1 | 0.1% | `canon::css::find_property` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `module_graph::record::ExportTable::insert_local` |
| 4 | 0.3% | `styletrace::analysis::surface::trace_style_bindings_with_surface` |
| 1 | 0.1% | `module_graph::record::collect::insert_var_names` |
| 1 | 0.1% | `atomic::runtime::serializer::canonical_json_value` |

## Callers of `canon::css::values::named_colors::is_named_color`

Inclusive 7wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.6% | `canon::css::values::classify::classify_css_value` |

## Callers of `std::path::compare_components`

Inclusive 6wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.3% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 2 | 0.2% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |

## Callers of `canon::css::find_property`

Inclusive 14wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 1.0% | `canon::is_known_style_prop` |
| 2 | 0.2% | `atomic::resolve::shorthands::expand_shorthand` |
| 1 | 0.1% | `canon::class_prefix_for_prop` |

## Callers of `indexmap::map::IndexMap<K,V,S>::insert_full`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `atomic::diagnostics::analysis::structured::responsive_object_value` |
| 2 | 0.2% | `atomic::extract::expressions::ast_value::ast_to_json_value` |
| 2 | 0.2% | `atomic::recipes::compile_one` |
| 1 | 0.1% | `atomic::extract::recipes::walk::walk_recipe_object` |
| 1 | 0.1% | `<indexmap::map::IndexMap<K,V,S> as core::iter::traits::collect::FromIterator<(K,V)>>::from_iter` |

## Callers of `atomic::diagnostics::site::LineIndex::line_col`

Inclusive 5wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |

## Malloc-family leaves by nearest atomic/canon ancestor

184wt of malloc-family leaves; 8wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 21 | 1.8% | `atomic::resolve::resolve_want_with` |
| 16 | 1.4% | `atomic::assembly::AssembleCtx::finish` |
| 9 | 0.8% | `atomic::resolve::authored_key` |
| 8 | 0.7% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 7 | 0.6% | `atomic::compile` |
| 7 | 0.6% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 5 | 0.4% | `module_graph::key::normalize_str` |
| 5 | 0.4% | `module_graph::ladder::SpecifierLadder<F>::resolve` |
| 4 | 0.3% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 3 | 0.3% | `atomic::extract::constants::index::LocalConstants::insert_scalar` |
| 3 | 0.3% | `atomic::extract::expressions::literal::push_string_want` |
| 3 | 0.3% | `module_graph::ladder::join_with` |
| 3 | 0.3% | `atomic::extract::harvest::mint::mint` |
| 3 | 0.3% | `atomic::runtime::serializer::canonical_json_value` |
| 3 | 0.3% | `atomic::resolve::conditions::lower_when` |
| 3 | 0.3% | `atomic::runtime::serializer::serialize_lookup_key` |
| 3 | 0.3% | `atomic::stylesheet::emitter::append_recipes_layer` |
| 2 | 0.2% | `atomic::sources::collect` |

## memmove leaves by nearest .node ancestor

51wt of memmove leaves; 21wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.3% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 0.3% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 3 | 0.3% | `atomic::compile` |
| 2 | 0.2% | `<alloc::string::String as core::clone::Clone>::clone` |
| 2 | 0.2% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 2 | 0.2% | `<&mut serde_json::ser::Serializer<W,F> as serde_core::ser::Serializer>::serialize_str` |
| 2 | 0.2% | `atomic::stylesheet::layers::wrap_package_layer` |
| 2 | 0.2% | `napi::bindgen_runtime::js_values::string::<impl napi::bindgen_runtime::js_values::ToNapiValue for &alloc::string::String>::to_napi_value` |
| 1 | 0.1% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |
| 1 | 0.1% | `alloc::str::join_generic_copy` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 1 | 0.1% | `atomic::diagnostics::analysis::analyze` |
| 1 | 0.1% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 1 | 0.1% | `atomic::extract::extract_with_context` |

## memcmp leaves by nearest .node ancestor

21wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.6% | `canon::css::find_property` |
| 4 | 0.3% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 2 | 0.2% | `atomic::extract::constants::index::LocalConstants::merge` |
| 2 | 0.2% | `canon::css::is_color_prop` |
| 1 | 0.1% | `core::slice::sort::unstable::quicksort::quicksort` |
| 1 | 0.1% | `base_system::tokens::TokenDictionary::get_in_category` |
| 1 | 0.1% | `canon::css::is_unitless_prop` |
| 1 | 0.1% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 1 | 0.1% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 1 | 0.1% | `canon::is_known_style_prop` |

## File opens by issuing frame

244wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 244 | 21.2% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

576wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 533 | 46.2% | `reference_virtual_native::atomic::__napi__compile_system → atomic::compile` |
| 213 | 18.5% | `atomic::compile → atomic::assembly::AssembleCtx::finish` |
| 66 | 5.7% | `atomic::assembly::AssembleCtx::finish → atomic::runtime::builder::PlanBuilder::build_keyed` |
| 61 | 5.3% | `oxc_ast_visit::generated::visit::walk::walk_function → oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 54 | 4.7% | `atomic::assembly::AssembleCtx::finish → atomic::resolve::resolve_want_with` |
| 52 | 4.5% | `atomic::compile → atomic::extract::extract_with_context` |
| 52 | 4.5% | `atomic::runtime::builder::PlanBuilder::build_keyed → atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 48 | 4.2% | `oxc_ast_visit::generated::visit::walk::walk_declaration → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 48 | 4.2% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 35 | 3.0% | `atomic::runtime::builder::PlanBuilder::resolve_entry → atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 34 | 2.9% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 34 | 2.9% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 34 | 2.9% | `atomic::runtime::builder::resolve_with_unique_diagnostics → atomic::resolve::resolve_want_with` |
| 32 | 2.8% | `atomic::assembly::AssembleCtx::finish → atomic::stylesheet::emitter::build_stylesheets_with` |
| 31 | 2.7% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration` |
| 31 | 2.7% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration` |
| 31 | 2.7% | `atomic::compile → atomic::hosts::resolve` |
| 31 | 2.7% | `atomic::extract::extract_with_context → oxc_ast_visit::generated::visit::walk::walk_function` |
| 30 | 2.6% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration → oxc_parser::ts::statement::<impl oxc_parser::ParserImpl>::parse_declaration` |
| 29 | 2.5% | `atomic::compile → atomic::extract::resolver::ValueGraph::resolve_file_imports` |
| 29 | 2.5% | `atomic::extract::resolver::ValueGraph::resolve_file_imports → <hashbrown::map::HashMap<K,V,S,A> as core::iter::traits::collect::Extend<(K,V)>>::extend` |
| 27 | 2.3% | `atomic::compile → <alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 27 | 2.3% | `oxc_ast_visit::generated::visit::walk::walk_expression → oxc_ast_visit::generated::visit::walk::walk_expression` |
| 27 | 2.3% | `<hashbrown::map::HashMap<K,V,S,A> as core::iter::traits::collect::Extend<(K,V)>>::extend → atomic::extract::resolver::ValueGraph::resolve_binding` |
| 27 | 2.3% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression → atomic::extract::css::extract` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 25 | 17 | 68% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 22 | 7 | 32% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 10 | 4 | 40% | `core::slice::sort::stable::quicksort::quicksort` |
| 9 | 2 | 22% | `indexmap::map::IndexMap<K,V,S>::insert_full` |
| 6 | 2 | 33% | `atomic::diagnostics::site::LineIndex::for_source` |
| 29 | 1 | 3% | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 12 | 1 | 8% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 14 | 1 | 7% | `canon::css::find_property` |
| 5 | 1 | 20% | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 5 | 1 | 20% | `alloc::collections::btree::map::entry::Entry<K,V,A>::or_default` |
| 13 | 0 | 0% | `canon::css::values::lengths::is_length` |
| 10 | 0 | 0% | `core::hash::BuildHasher::hash_one` |
| 7 | 0 | 0% | `canon::css::values::named_colors::is_named_color` |
| 6 | 0 | 0% | `std::path::compare_components` |
| 5 | 0 | 0% | `atomic::diagnostics::site::LineIndex::line_col` |
