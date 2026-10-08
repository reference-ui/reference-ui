# Caller attribution: enterprise (b8a75b0bd74c)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `docs/evidence/flamegraph/enterprise-repro5a`.
Derived 2026-09-22T12:41:17.778Z via `pnpm agentrs flame --callers docs/evidence/flamegraph/enterprise-repro5a --out docs/evidence/flamegraph/enterprise-repro5a`; no re-record, bundle raws untouched.
Covers 1085 weight across 1058 main-thread samples. Shares below are of that weight unless noted.


## Callers of `__open`

Inclusive 241wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 241 | 22.2% | `open` |

## Callers of `nanov2_malloc_type`

Inclusive 73wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 1.0% | `<alloc::string::String as core::clone::Clone>::clone` |
| 9 | 0.8% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 8 | 0.7% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 5 | 0.5% | `atomic::resolve::resolve_want_with` |
| 5 | 0.5% | `atomic::runtime::serializer::serialize_lookup_key` |
| 4 | 0.4% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 3 | 0.3% | `alloc::fmt::format::format_inner` |
| 2 | 0.2% | `operator new(unsigned long)` |

## Callers of `_platform_memmove$VARIANT$Haswell`

Inclusive 48wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `atomic::diagnostics::analysis::analyze` |
| 4 | 0.4% | `v8::internal::LiteralBuffer::ExpandBuffer()` |
| 4 | 0.4% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 0.3% | `v8::internal::JsonStringifier::Extend()` |
| 3 | 0.3% | `v8::internal::FactoryBase<v8::internal::Factory>::NewStringFromOneByte(v8::base::Vector<unsigned char const>, v8::internal::AllocationType)` |
| 3 | 0.3% | `atomic::compile` |
| 3 | 0.3% | `szone_realloc` |
| 3 | 0.3% | `atomic::extract::extract_with_context` |

## Callers of `_nanov2_free`

Inclusive 44wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.6% | `core::ptr::drop_in_place<atomic::atom::want::Want>` |
| 4 | 0.4% | `atomic::compile` |
| 3 | 0.3% | `atomic::extract::expressions::object::walk_style_object` |
| 3 | 0.3% | `atomic::resolve::resolve_want_with` |
| 2 | 0.2% | `atomic::extract::expressions::responsive::walk_object` |
| 2 | 0.2% | `<alloc::vec::Vec<T,A> as core::ops::drop::Drop>::drop` |
| 1 | 0.1% | `core::ptr::drop_in_place<oxc_diagnostics::OxcDiagnostic>` |
| 1 | 0.1% | `atomic::extract::resolver::staging::StagingPlan::census` |

## Callers of `kevent`

Inclusive 38wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 38 | 3.5% | `uv__io_poll` |

## Callers of `madvise`

Inclusive 36wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 36 | 3.3% | `mvm_madvise_plat` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 32wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.6% | `0x7ff7b2a6d6cf` |
| 2 | 0.2% | `0x7ff7b2a6cd8f` |
| 2 | 0.2% | `0x7ff7b2a6d58f` |
| 1 | 0.1% | `0x7ff7b2a72f3f` |
| 1 | 0.1% | `0x7ff7b2a6c34f` |
| 1 | 0.1% | `0x7ff7b2a6c58f` |
| 1 | 0.1% | `atomic::extract::constants::index::LocalConstants::merge` |
| 1 | 0.1% | `0x7ff7b2a6ceff` |

## Callers of `read`

Inclusive 21wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 21 | 1.9% | `uv__fs_work` |

## Callers of `__close_nocancel`

Inclusive 16wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 16 | 1.5% | `uv__fs_work` |

## Callers of `__write_nocancel`

Inclusive 15wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 15 | 1.4% | `_swrite` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_expression`

Inclusive 22wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 14 | 1.3% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 2 | 0.2% | `<atomic::extract::constants::collect::ConstCollector as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 2 | 0.2% | `<atomic::diagnostics::analysis::css::CssVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 2 | 0.2% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 2 | 0.2% | `<atomic::extract::scope::call_init::CallInitPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |

## Callers of `__getdirentries64`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.8% | `_readdir_unlocked$INODE64` |

## Callers of `core::hash::BuildHasher::hash_one`

Inclusive 10wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 2 | 0.2% | `hashbrown::rustc_entry::<impl hashbrown::map::HashMap<K,V,S,A>>::rustc_entry` |
| 2 | 0.2% | `atomic::diagnostics::proof::render::Proof::collect` |
| 1 | 0.1% | `module_graph::ladder::SpecifierLadder<F>::package_hit` |
| 1 | 0.1% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 1 | 0.1% | `atomic::compile` |

## Callers of `canon::css::values::lengths::is_length`

Inclusive 10wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.6% | `canon::css::values::classify::classify_css_value` |
| 4 | 0.4% | `atomic::extract::harvest::classify::classify_harvest_value` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 21wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 10 | 0.9% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 3 | 0.3% | `atomic::extract::extract_with_context` |
| 2 | 0.2% | `atomic::diagnostics::analysis::analyze` |
| 2 | 0.2% | `atomic::stylesheet::cascade::push_declaration` |
| 1 | 0.1% | `module_graph::key::normalize_str` |
| 1 | 0.1% | `module_graph::ladder::SpecifierLadder<F>::resolve` |
| 1 | 0.1% | `canon::css::find_property` |
| 1 | 0.1% | `core::ptr::drop_in_place<(atomic::atom::decl::Atom,())>` |

## Callers of `canon::css::is_color_prop`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.6% | `atomic::resolve::tokens::lookup_entry` |
| 4 | 0.4% | `atomic::resolve::tokens::resolve_token_value` |
| 2 | 0.2% | `atomic::resolve::unit::css_value_from_authored` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `styletrace::analysis::surface::trace_style_bindings_with_surface` |
| 2 | 0.2% | `module_graph::record::collect::insert_var_names` |
| 2 | 0.2% | `module_graph::record::ExportTable::insert_local` |
| 2 | 0.2% | `atomic::runtime::serializer::canonical_json_value` |
| 1 | 0.1% | `module_graph::record::collect::statement` |
| 1 | 0.1% | `oxc_ast_visit::generated::visit::walk::walk_expression` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_statement`

Inclusive 21wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 16 | 1.5% | `atomic::extract::harvest::literals::collect_pool` |
| 2 | 0.2% | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 2 | 0.2% | `atomic::extract::scope::collect::collect_inner` |
| 1 | 0.1% | `atomic::diagnostics::analysis::css::expectations` |

## Callers of `canon::dialect::resolve_alias`

Inclusive 7wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `canon::css::is_color_prop` |
| 2 | 0.2% | `canon::resolve_canonical_prop` |
| 1 | 0.1% | `canon::is_known_style_prop` |
| 1 | 0.1% | `canon::css::is_unitless_prop` |

## Callers of `oxc_allocator::bump::Bump::alloc_layout_slow`

Inclusive 4wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_import_specifiers` |

## Callers of `hashbrown::map::HashMap<K,V,S,A>::insert`

Inclusive 22wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 1.0% | `atomic::compile` |
| 3 | 0.3% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 2 | 0.2% | `styletrace::analysis::parser::collect_variable_symbols` |
| 2 | 0.2% | `atomic::diagnostics::proof::render::Proof::collect` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 1 | 0.1% | `styletrace::analysis::parser::trace_program` |
| 1 | 0.1% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::export_is_traced` |
| 1 | 0.1% | `atomic::extract::resolver::ValueGraph::resolve_binding` |

## Malloc-family leaves by nearest atomic/canon ancestor

143wt of malloc-family leaves; 5wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 32 | 2.9% | `atomic::compile` |
| 12 | 1.1% | `atomic::resolve::resolve_want_with` |
| 6 | 0.6% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 5 | 0.5% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 5 | 0.5% | `atomic::runtime::serializer::serialize_lookup_key` |
| 4 | 0.4% | `atomic::extract::expressions::object::walk_style_object` |
| 3 | 0.3% | `atomic::sources::collect` |
| 3 | 0.3% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 3 | 0.3% | `atomic::resolve::rhythm::resolve_rhythm` |
| 3 | 0.3% | `atomic::resolve::tokens::format_entry` |
| 3 | 0.3% | `atomic::resolve::conditions::lower_when` |
| 3 | 0.3% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 2 | 0.2% | `serde_core::de::impls::<impl serde_core::de::Deserialize for core::option::Option<T>>::deserialize` |
| 2 | 0.2% | `module_graph::record::ExportTable::insert_local` |
| 2 | 0.2% | `atomic::extract::resolver::ValueGraph::new` |
| 2 | 0.2% | `styletrace::analysis::parser::pipeline::util::record_pipeline_binding` |
| 2 | 0.2% | `atomic::extract::expressions::responsive::walk_object` |
| 2 | 0.2% | `atomic::extract::expressions::ast_value::ast_to_json_values` |

## memmove leaves by nearest .node ancestor

48wt of memmove leaves; 16wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `atomic::diagnostics::analysis::analyze` |
| 4 | 0.4% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 0.3% | `atomic::compile` |
| 3 | 0.3% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 3 | 0.3% | `atomic::extract::extract_with_context` |
| 2 | 0.2% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 2 | 0.2% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 1 | 0.1% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 1 | 0.1% | `<std::fs::ReadDir as core::iter::traits::iterator::Iterator>::next` |
| 1 | 0.1% | `alloc::str::join_generic_copy` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 1 | 0.1% | `hashbrown::raw::RawIterRange<T>::fold_impl` |
| 1 | 0.1% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 1 | 0.1% | `<alloc::string::String as core::clone::Clone>::clone` |

## memcmp leaves by nearest .node ancestor

32wt of memcmp leaves; 1wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `atomic::extract::constants::index::LocalConstants::merge` |
| 5 | 0.5% | `canon::css::find_property` |
| 3 | 0.3% | `canon::css::is_color_prop` |
| 3 | 0.3% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 2 | 0.2% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 2 | 0.2% | `canon::dialect::resolve_alias` |
| 1 | 0.1% | `core::slice::sort::unstable::quicksort::quicksort` |
| 1 | 0.1% | `core::slice::sort::shared::smallsort::small_sort_general` |
| 1 | 0.1% | `std::path::compare_components` |
| 1 | 0.1% | `atomic::extract::expressions::object::condition::is_condition_key` |
| 1 | 0.1% | `atomic::extract::harvest::literals::collect_pool` |
| 1 | 0.1% | `atomic::resolve::conditions::lower_when` |
| 1 | 0.1% | `canon::css::is_unitless_prop` |
| 1 | 0.1% | `atomic::runtime::builder::PlanBuilder::build_keyed` |

## File opens by issuing frame

241wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 241 | 22.2% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

507wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 465 | 42.9% | `reference_virtual_native::atomic::__napi__compile_system → atomic::compile` |
| 55 | 5.1% | `atomic::compile → atomic::extract::extract_with_context` |
| 54 | 5.0% | `atomic::compile → atomic::runtime::builder::PlanBuilder::build_keyed` |
| 47 | 4.3% | `oxc_ast_visit::generated::visit::walk::walk_function → oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 46 | 4.2% | `oxc_ast_visit::generated::visit::walk::walk_declaration → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 46 | 4.2% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 38 | 3.5% | `atomic::runtime::builder::PlanBuilder::build_keyed → atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 37 | 3.4% | `atomic::compile → <alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 36 | 3.3% | `atomic::compile → atomic::resolve::resolve_want_with` |
| 31 | 2.9% | `atomic::compile → atomic::hosts::resolve` |
| 31 | 2.9% | `atomic::compile → atomic::stylesheet::emitter::build_stylesheets_with` |
| 29 | 2.7% | `atomic::extract::extract_with_context → oxc_ast_visit::generated::visit::walk::walk_function` |
| 29 | 2.7% | `atomic::runtime::builder::PlanBuilder::resolve_entry → atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 29 | 2.7% | `atomic::runtime::builder::resolve_with_unique_diagnostics → atomic::resolve::resolve_want_with` |
| 28 | 2.6% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 28 | 2.6% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 28 | 2.6% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression → atomic::extract::css::extract` |
| 28 | 2.6% | `atomic::extract::css::extract → atomic::extract::css::handle_css_arg` |
| 26 | 2.4% | `atomic::extract::css::handle_css_arg → atomic::extract::expressions::object::walk_style_object` |
| 24 | 2.2% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration` |
| 24 | 2.2% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration` |
| 23 | 2.1% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter → <core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 23 | 2.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold → oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 23 | 2.1% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration → oxc_parser::ts::statement::<impl oxc_parser::ParserImpl>::parse_declaration` |
| 23 | 2.1% | `atomic::resolve::resolve_want_with → atomic::resolve::tokens::resolve_token_value` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 74 | 29 | 39% | `atomic::resolve::resolve_want_with` |
| 21 | 15 | 71% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 12 | 3 | 25% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 22 | 3 | 14% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 22 | 1 | 5% | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 21 | 1 | 5% | `oxc_ast_visit::generated::visit::walk::walk_statement` |
| 10 | 1 | 10% | `canon::css::find_property` |
| 10 | 0 | 0% | `core::hash::BuildHasher::hash_one` |
| 10 | 0 | 0% | `canon::css::values::lengths::is_length` |
| 12 | 0 | 0% | `canon::css::is_color_prop` |
| 7 | 0 | 0% | `canon::dialect::resolve_alias` |
| 4 | 0 | 0% | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 4 | 0 | 0% | `core::num::dec2flt::parse::parse_number` |
| 3 | 0 | 0% | `std::path::Components::parse_next_component_back` |
| 12 | 0 | 0% | `oxc_parser::lexer::Lexer::next_token` |
