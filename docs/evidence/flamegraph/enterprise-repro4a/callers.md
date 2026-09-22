# Caller attribution: enterprise (6f4cf1ba392f)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `../../../../../../../tmp/swarm-repro3-flame/enterprise-repro4a`.
Derived 2026-09-22T08:44:44.174Z via `pnpm agentrs flame --callers /tmp/swarm-repro3-flame/enterprise-repro4a --out /tmp/swarm-repro3-flame/enterprise-repro4a`; no re-record, bundle raws untouched.
Covers 1094 weight across 1070 main-thread samples. Shares below are of that weight unless noted.


## Callers of `__open`

Inclusive 244wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 244 | 22.3% | `open` |

## Callers of `nanov2_malloc_type`

Inclusive 83wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 12 | 1.1% | `<alloc::string::String as core::clone::Clone>::clone` |
| 12 | 1.1% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 9 | 0.8% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 6 | 0.5% | `atomic::resolve::resolve_want_with` |
| 4 | 0.4% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 4 | 0.4% | `atomic::extract::expressions::object::walk_style_object` |
| 4 | 0.4% | `atomic::atom::when::When::from_catalog` |
| 3 | 0.3% | `atomic::runtime::builder::PlanBuilder::convert_value` |

## Callers of `_platform_memmove$VARIANT$Haswell`

Inclusive 59wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `v8::internal::FactoryBase<v8::internal::Factory>::NewStringFromOneByte(v8::base::Vector<unsigned char const>, v8::internal::AllocationType)` |
| 5 | 0.5% | `szone_realloc` |
| 4 | 0.4% | `v8::internal::JsonStringifier::Extend()` |
| 3 | 0.3% | `v8::internal::LiteralBuffer::ExpandBuffer()` |
| 3 | 0.3% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.3% | `atomic::diagnostics::analysis::analyze` |
| 3 | 0.3% | `atomic::compile` |
| 3 | 0.3% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |

## Callers of `_nanov2_free`

Inclusive 44wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `core::ptr::drop_in_place<serde_json::value::Value>` |
| 3 | 0.3% | `core::ptr::drop_in_place<atomic::atom::want::Want>` |
| 2 | 0.2% | `atomic::compile` |
| 2 | 0.2% | `atomic::resolve::resolve_want_with` |
| 2 | 0.2% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 2 | 0.2% | `atomic::resolve::unit::css_value_from_authored` |
| 2 | 0.2% | `nanov2_realloc` |
| 2 | 0.2% | `<alloc::vec::Vec<T,A> as core::ops::drop::Drop>::drop` |

## Callers of `madvise`

Inclusive 40wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 40 | 3.7% | `mvm_madvise_plat` |

## Callers of `kevent`

Inclusive 38wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 38 | 3.5% | `uv__io_poll` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 36wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `0x7ff7b045fe8f` |
| 2 | 0.2% | `0x7ff7b04606bf` |
| 2 | 0.2% | `0x7ff7b045f55f` |
| 1 | 0.1% | `0x7ff7b045f63f` |
| 1 | 0.1% | `0x7ff7b045f71f` |
| 1 | 0.1% | `0x7ff7b045fdbf` |
| 1 | 0.1% | `0x7ff7b045fb4f` |
| 1 | 0.1% | `0x7ff7b045fedf` |

## Callers of `read`

Inclusive 31wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 31 | 2.8% | `uv__fs_work` |

## Callers of `__write_nocancel`

Inclusive 21wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 21 | 1.9% | `_swrite` |

## Callers of `__close_nocancel`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 13 | 1.2% | `uv__fs_work` |

## Callers of `__getdirentries64`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 1.0% | `_readdir_unlocked$INODE64` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_expression`

Inclusive 20wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 15 | 1.4% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 2 | 0.2% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `<atomic::extract::constants::collect::ConstCollector as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `<atomic::diagnostics::analysis::css::CssVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |

## Callers of `core::hash::BuildHasher::hash_one`

Inclusive 8wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 2 | 0.2% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 2 | 0.2% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 1 | 0.1% | `indexmap::map::IndexMap<K,V,S>::get` |
| 1 | 0.1% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 1 | 0.1% | `hashbrown::rustc_entry::<impl hashbrown::map::HashMap<K,V,S,A>>::rustc_entry` |
| 1 | 0.1% | `atomic::diagnostics::proof::render::Proof::collect` |

## Callers of `std::path::compare_components`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 3 | 0.3% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 1 | 0.1% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::component_is_traced` |

## Callers of `canon::css::find_property`

Inclusive 14wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 10 | 0.9% | `canon::is_known_style_prop` |
| 2 | 0.2% | `canon::to_css_declaration_property` |
| 1 | 0.1% | `atomic::resolve::shorthands::expand_shorthand` |
| 1 | 0.1% | `canon::class_prefix_for_prop` |

## Callers of `oxc_parser::module_record::ModuleRecordBuilder::add_module_request`

Inclusive 5wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `oxc_parser::module_record::ModuleRecordBuilder::visit_import_declaration` |

## Callers of `alloc::collections::btree::map::entry::Entry<K,V,A>::or_default`

Inclusive 6wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `atomic::extract::constants::index::LocalConstants::insert_scalar` |
| 1 | 0.1% | `atomic::extract::constants::index::LocalConstants::merge` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 14wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `styletrace::analysis::surface::trace_style_bindings_with_surface` |
| 4 | 0.4% | `module_graph::record::ExportTable::insert_local` |
| 2 | 0.2% | `module_graph::record::collect::insert_var_names` |
| 2 | 0.2% | `module_graph::record::collect::statement` |
| 1 | 0.1% | `oxc_ast_visit::generated::visit::walk::walk_expression` |

## Callers of `canon::css::values::lengths::is_length`

Inclusive 6wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `canon::css::values::classify::classify_css_value` |
| 2 | 0.2% | `atomic::extract::harvest::classify::classify_harvest_value` |

## Callers of `atomic::resolve::resolve_want_with`

Inclusive 75wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 41 | 3.7% | `atomic::compile` |
| 27 | 2.5% | `atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 7 | 0.6% | `atomic::recipes::push_rule` |

## Callers of `oxc_parser::lexer::Lexer::next_token`

Inclusive 6wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_primary_expression` |
| 1 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_literal_string` |
| 1 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_member_expression_rest` |

## Malloc-family leaves by nearest atomic/canon ancestor

161wt of malloc-family leaves; 2wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 31 | 2.8% | `atomic::compile` |
| 11 | 1.0% | `atomic::resolve::resolve_want_with` |
| 9 | 0.8% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 6 | 0.5% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 6 | 0.5% | `atomic::extract::expressions::object::walk_style_object` |
| 4 | 0.4% | `atomic::sources::collect` |
| 4 | 0.4% | `atomic::extract::resolver::ValueGraph::new` |
| 4 | 0.4% | `atomic::atom::when::When::from_catalog` |
| 4 | 0.4% | `atomic::runtime::builder::PlanBuilder::convert_value` |
| 3 | 0.3% | `serde_core::de::impls::<impl serde_core::de::Deserialize for core::option::Option<T>>::deserialize` |
| 3 | 0.3% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 3 | 0.3% | `atomic::resolve::conditions::lower_when` |
| 3 | 0.3% | `atomic::recipes::compile_one` |
| 3 | 0.3% | `atomic::runtime::serializer::serialize_lookup_key` |
| 3 | 0.3% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 3 | 0.3% | `reference_virtual_native::atomic::__napi__compile_system` |
| 2 | 0.2% | `module_graph::record::ExportTable::insert_local` |
| 2 | 0.2% | `atomic::extract::constants::index::LocalConstants::insert_scalar` |

## memmove leaves by nearest .node ancestor

59wt of memmove leaves; 22wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 3 | 0.3% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.3% | `atomic::diagnostics::analysis::analyze` |
| 3 | 0.3% | `atomic::compile` |
| 3 | 0.3% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 2 | 0.2% | `atomic::extract::extract_with_context` |
| 2 | 0.2% | `atomic::stylesheet::layers::wrap_package_layer` |
| 1 | 0.1% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::next` |
| 1 | 0.1% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |
| 1 | 0.1% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 1 | 0.1% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |
| 1 | 0.1% | `hashbrown::raw::RawIterRange<T>::fold_impl` |
| 1 | 0.1% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |

## memcmp leaves by nearest .node ancestor

36wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.7% | `canon::css::is_color_prop` |
| 7 | 0.6% | `canon::css::find_property` |
| 4 | 0.4% | `canon::dialect::resolve_alias` |
| 4 | 0.4% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 2 | 0.2% | `canon::is_known_style_prop` |
| 2 | 0.2% | `atomic::extract::harvest::literals::collect_pool` |
| 2 | 0.2% | `canon::css::unrealizable::is_unrealizable_extension` |
| 1 | 0.1% | `core::slice::sort::shared::smallsort::small_sort_general` |
| 1 | 0.1% | `<atomic::extract::resolver::source::AtomicFs as module_graph::fs::FileSystem>::read_to_string` |
| 1 | 0.1% | `base_system::condition_map::ConditionMap::get` |
| 1 | 0.1% | `canon::css::is_unitless_prop` |
| 1 | 0.1% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 1 | 0.1% | `core::slice::sort::stable::quicksort::quicksort` |
| 1 | 0.1% | `core::slice::sort::shared::smallsort::small_sort_general_with_scratch` |

## File opens by issuing frame

244wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 244 | 22.3% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

518wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 475 | 43.4% | `reference_virtual_native::atomic::__napi__compile_system → atomic::compile` |
| 60 | 5.5% | `atomic::compile → atomic::extract::extract_with_context` |
| 56 | 5.1% | `atomic::compile → atomic::runtime::builder::PlanBuilder::build_keyed` |
| 54 | 4.9% | `oxc_ast_visit::generated::visit::walk::walk_function → oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 52 | 4.8% | `oxc_ast_visit::generated::visit::walk::walk_declaration → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 52 | 4.8% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 46 | 4.2% | `atomic::runtime::builder::PlanBuilder::build_keyed → atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 41 | 3.7% | `atomic::compile → <alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 41 | 3.7% | `atomic::compile → atomic::resolve::resolve_want_with` |
| 35 | 3.2% | `atomic::extract::extract_with_context → oxc_ast_visit::generated::visit::walk::walk_function` |
| 34 | 3.1% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 34 | 3.1% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 32 | 2.9% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression → atomic::extract::css::extract` |
| 32 | 2.9% | `atomic::extract::css::extract → atomic::extract::css::handle_css_arg` |
| 31 | 2.8% | `atomic::compile → atomic::hosts::resolve` |
| 31 | 2.8% | `atomic::extract::css::handle_css_arg → atomic::extract::expressions::object::walk_style_object` |
| 31 | 2.8% | `atomic::compile → atomic::stylesheet::emitter::build_stylesheets_with` |
| 29 | 2.7% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter → <core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 27 | 2.5% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold → oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 27 | 2.5% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration` |
| 27 | 2.5% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration` |
| 27 | 2.5% | `atomic::runtime::builder::PlanBuilder::resolve_entry → atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 27 | 2.5% | `atomic::runtime::builder::resolve_with_unique_diagnostics → atomic::resolve::resolve_want_with` |
| 26 | 2.4% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration → oxc_parser::ts::statement::<impl oxc_parser::ParserImpl>::parse_declaration` |
| 23 | 2.1% | `atomic::resolve::resolve_want_with → atomic::resolve::tokens::resolve_token_value` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 75 | 26 | 35% | `atomic::resolve::resolve_want_with` |
| 22 | 6 | 27% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 14 | 4 | 29% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 20 | 2 | 10% | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 6 | 1 | 17% | `alloc::collections::btree::map::entry::Entry<K,V,A>::or_default` |
| 8 | 0 | 0% | `core::hash::BuildHasher::hash_one` |
| 9 | 0 | 0% | `std::path::compare_components` |
| 14 | 0 | 0% | `canon::css::find_property` |
| 5 | 0 | 0% | `oxc_parser::module_record::ModuleRecordBuilder::add_module_request` |
| 6 | 0 | 0% | `canon::css::values::lengths::is_length` |
| 6 | 0 | 0% | `oxc_parser::lexer::Lexer::next_token` |
| 4 | 0 | 0% | `canon::css::values::named_colors::is_named_color` |
| 3 | 0 | 0% | `atomic::includes::glob::match_from` |
| 3 | 0 | 0% | `oxc_parser::js::object::<impl oxc_parser::ParserImpl>::parse_property_name` |
| 4 | 0 | 0% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_member_expression_rest` |
