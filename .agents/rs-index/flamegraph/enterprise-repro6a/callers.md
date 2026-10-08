# Caller attribution: enterprise (ff64ab75b594)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `../../../../../../../tmp/swarm-reflame6/enterprise-repro6a`.
Derived 2026-09-22T13:33:39.029Z via `pnpm agentrs flame --callers /tmp/swarm-reflame6/enterprise-repro6a`; no re-record, bundle raws untouched.
Covers 1091 weight across 1068 main-thread samples. Shares below are of that weight unless noted.


## Callers of `__open`

Inclusive 245wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 245 | 22.5% | `open` |

## Callers of `_platform_memmove$VARIANT$Haswell`

Inclusive 56wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `v8::internal::LiteralBuffer::ExpandBuffer()` |
| 5 | 0.5% | `v8::internal::JsonStringifier::Extend()` |
| 4 | 0.4% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 4 | 0.4% | `atomic::compile` |
| 3 | 0.3% | `v8::internal::FactoryBase<v8::internal::Factory>::NewStringFromOneByte(v8::base::Vector<unsigned char const>, v8::internal::AllocationType)` |
| 3 | 0.3% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.3% | `atomic::diagnostics::analysis::analyze` |
| 2 | 0.2% | `v8::internal::FactoryBase<v8::internal::Factory>::NewOneByteInternalizedString(v8::base::Vector<unsigned char const>, unsigned int)` |

## Callers of `nanov2_malloc_type`

Inclusive 61wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 1.0% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 8 | 0.7% | `<alloc::string::String as core::clone::Clone>::clone` |
| 6 | 0.5% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 3 | 0.3% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 3 | 0.3% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 3 | 0.3% | `atomic::resolve::conditions::lower_when` |
| 2 | 0.2% | `operator new(unsigned long)` |
| 2 | 0.2% | `atomic::extract::expressions::literal::push_string_want` |

## Callers of `kevent`

Inclusive 37wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 37 | 3.4% | `uv__io_poll` |

## Callers of `_nanov2_free`

Inclusive 38wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `atomic::extract::expressions::responsive::walk_object` |
| 4 | 0.4% | `core::ptr::drop_in_place<atomic::atom::want::Want>` |
| 3 | 0.3% | `<hashbrown::raw::RawTable<T,A> as core::ops::drop::Drop>::drop` |
| 3 | 0.3% | `core::ptr::drop_in_place<atomic::atom::decl::Atom>` |
| 2 | 0.2% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 2 | 0.2% | `core::ptr::drop_in_place<atomic::diagnostics::proof::render::Proof>` |
| 2 | 0.2% | `<smallvec::SmallVec<A> as core::ops::drop::Drop>::drop` |
| 1 | 0.1% | `v8::internal::wasm::CompileLazy(v8::internal::Isolate*, v8::internal::Tagged<v8::internal::WasmTrustedInstanceData>, int)` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 36wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `0x7ff7befd36cf` |
| 4 | 0.4% | `0x7ff7befd358f` |
| 3 | 0.3% | `0x7ff7befd25af` |
| 2 | 0.2% | `0x7ff7befd270f` |
| 2 | 0.2% | `0x7ff7befd2d8f` |
| 2 | 0.2% | `0x7ff7befd30af` |
| 2 | 0.2% | `0x7ff7befd306f` |
| 1 | 0.1% | `core::slice::sort::unstable::quicksort::quicksort` |

## Callers of `madvise`

Inclusive 30wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 30 | 2.7% | `mvm_madvise_plat` |

## Callers of `read`

Inclusive 29wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 29 | 2.7% | `uv__fs_work` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_expression`

Inclusive 31wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 19 | 1.7% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 4 | 0.4% | `<atomic::extract::constants::collect::ConstCollector as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 4 | 0.4% | `<atomic::extract::scope::call_init::CallInitPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 1 | 0.1% | `<atomic::diagnostics::analysis::css::CssVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |

## Callers of `__close_nocancel`

Inclusive 18wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 18 | 1.6% | `uv__fs_work` |

## Callers of `__write_nocancel`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 13 | 1.2% | `_swrite` |

## Callers of `stat$INODE64`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.7% | `std::path::Path::is_file` |
| 3 | 0.3% | `uv__fs_work` |
| 2 | 0.2% | `std::sys::fs::metadata` |

## Callers of `canon::css::find_property`

Inclusive 15wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 1.0% | `canon::is_known_style_prop` |
| 2 | 0.2% | `canon::to_css_declaration_property` |
| 2 | 0.2% | `canon::class_prefix_for_prop` |

## Callers of `canon::css::values::named_colors::is_named_color`

Inclusive 7wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.6% | `canon::css::values::classify::classify_css_value` |

## Callers of `atomic::resolve::resolve_want_with`

Inclusive 72wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 39 | 3.6% | `atomic::compile` |
| 26 | 2.4% | `atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 7 | 0.6% | `atomic::recipes::push_rule` |

## Callers of `std::path::compare_components`

Inclusive 6wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 2 | 0.2% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 27wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 13 | 1.2% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 4 | 0.4% | `atomic::extract::extract_with_context` |
| 2 | 0.2% | `atomic::stylesheet::cascade::push_declaration` |
| 1 | 0.1% | `atomic::diagnostics::analysis::analyze` |
| 1 | 0.1% | `canon::is_known_style_prop` |
| 1 | 0.1% | `atomic::extract::identity::IdentityGraph::resolve` |
| 1 | 0.1% | `alloc::rc::Rc<T,A>::drop_slow` |
| 1 | 0.1% | `atomic::resolve::rhythm::resolve_rhythm` |

## Callers of `oxc_allocator::bump::Bump::alloc_layout_slow`

Inclusive 5wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_import_specifiers` |
| 1 | 0.1% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::finish_grow::grow` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `module_graph::record::ExportTable::insert_local` |
| 5 | 0.5% | `styletrace::analysis::surface::trace_style_bindings_with_surface` |
| 2 | 0.2% | `atomic::runtime::serializer::canonical_json_value` |
| 1 | 0.1% | `module_graph::record::collect::statement` |

## Callers of `module_graph::key::normalize_str`

Inclusive 6wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `module_graph::key::ModuleKey::new` |

## Callers of `canon::css::values::lengths::is_length`

Inclusive 5wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `atomic::extract::harvest::classify::classify_harvest_value` |
| 2 | 0.2% | `canon::css::values::classify::classify_css_value` |

## Malloc-family leaves by nearest atomic/canon ancestor

134wt of malloc-family leaves; 5wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 23 | 2.1% | `atomic::compile` |
| 7 | 0.6% | `atomic::resolve::tokens::format_entry` |
| 5 | 0.5% | `atomic::extract::resolver::ValueGraph::new` |
| 5 | 0.5% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 5 | 0.5% | `atomic::runtime::serializer::canonical_json_value` |
| 4 | 0.4% | `atomic::extract::expressions::responsive::walk_object` |
| 4 | 0.4% | `atomic::extract::expressions::literal::push_string_want` |
| 4 | 0.4% | `atomic::resolve::conditions::lower_when` |
| 4 | 0.4% | `atomic::resolve::resolve_want_with` |
| 4 | 0.4% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 4 | 0.4% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 3 | 0.3% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 3 | 0.3% | `atomic::extract::fold::key::fold_property_key` |
| 3 | 0.3% | `atomic::extract::identity::IdentityGraph::resolve` |
| 3 | 0.3% | `atomic::recipes::compile_one` |
| 2 | 0.2% | `module_graph::record::ExportTable::insert_local` |
| 2 | 0.2% | `styletrace::analysis::parser::trace_program` |
| 2 | 0.2% | `atomic::extract::expressions::ast_value::ast_to_json_value` |

## memmove leaves by nearest .node ancestor

56wt of memmove leaves; 21wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 4 | 0.4% | `atomic::compile` |
| 3 | 0.3% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.3% | `atomic::diagnostics::analysis::analyze` |
| 2 | 0.2% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |
| 2 | 0.2% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 2 | 0.2% | `atomic::extract::extract_with_context` |
| 2 | 0.2% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 2 | 0.2% | `atomic::stylesheet::layers::wrap_package_layer` |
| 1 | 0.1% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 1 | 0.1% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 1 | 0.1% | `hashbrown::raw::RawIterRange<T>::fold_impl` |
| 1 | 0.1% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 1 | 0.1% | `atomic::extract::scope::table::ScopeTable::declare` |

## memcmp leaves by nearest .node ancestor

36wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `canon::css::find_property` |
| 4 | 0.4% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 4 | 0.4% | `canon::css::is_color_prop` |
| 3 | 0.3% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 2 | 0.2% | `atomic::extract::constants::index::LocalConstants::merge` |
| 2 | 0.2% | `canon::is_known_style_prop` |
| 1 | 0.1% | `core::slice::sort::unstable::quicksort::quicksort` |
| 1 | 0.1% | `core::slice::sort::shared::smallsort::small_sort_general` |
| 1 | 0.1% | `styletrace::analysis::parser::pipeline::util::is_direct_style_pipeline_call` |
| 1 | 0.1% | `atomic::extract::expressions::object::walk_style_object` |
| 1 | 0.1% | `<atomic::extract::resolver::source::AtomicFs as module_graph::fs::FileSystem>::is_file` |
| 1 | 0.1% | `atomic::extract::harvest::literals::collect_pool` |
| 1 | 0.1% | `base_system::tokens::TokenDictionary::get_in_category` |
| 1 | 0.1% | `canon::css::is_unitless_prop` |

## File opens by issuing frame

245wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 245 | 22.5% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

525wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 480 | 44.0% | `reference_virtual_native::atomic::__napi__compile_system → atomic::compile` |
| 60 | 5.5% | `oxc_ast_visit::generated::visit::walk::walk_function → oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 60 | 5.5% | `atomic::compile → atomic::extract::extract_with_context` |
| 55 | 5.0% | `atomic::compile → atomic::runtime::builder::PlanBuilder::build_keyed` |
| 53 | 4.9% | `oxc_ast_visit::generated::visit::walk::walk_declaration → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 53 | 4.9% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 39 | 3.6% | `atomic::compile → <alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 39 | 3.6% | `atomic::compile → atomic::resolve::resolve_want_with` |
| 36 | 3.3% | `atomic::extract::extract_with_context → oxc_ast_visit::generated::visit::walk::walk_function` |
| 35 | 3.2% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression → atomic::extract::css::extract` |
| 35 | 3.2% | `atomic::extract::css::extract → atomic::extract::css::handle_css_arg` |
| 35 | 3.2% | `atomic::runtime::builder::PlanBuilder::build_keyed → atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 33 | 3.0% | `atomic::extract::css::handle_css_arg → atomic::extract::expressions::object::walk_style_object` |
| 32 | 2.9% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 32 | 2.9% | `atomic::compile → atomic::hosts::resolve` |
| 32 | 2.9% | `atomic::compile → atomic::stylesheet::emitter::build_stylesheets_with` |
| 31 | 2.8% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 29 | 2.7% | `oxc_ast_visit::generated::visit::walk::walk_expression → oxc_ast_visit::generated::visit::walk::walk_expression` |
| 27 | 2.5% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter → <core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 27 | 2.5% | `atomic::resolve::resolve_want_with → atomic::resolve::tokens::resolve_token_value` |
| 26 | 2.4% | `atomic::runtime::builder::PlanBuilder::resolve_entry → atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 26 | 2.4% | `atomic::runtime::builder::resolve_with_unique_diagnostics → atomic::resolve::resolve_want_with` |
| 25 | 2.3% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold → oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 24 | 2.2% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration` |
| 23 | 2.1% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 72 | 22 | 31% | `atomic::resolve::resolve_want_with` |
| 27 | 21 | 78% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 55 | 21 | 38% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 13 | 3 | 23% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 31 | 2 | 6% | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 6 | 2 | 33% | `<smallvec::SmallVec<A> as core::iter::traits::collect::Extend<<A as smallvec::Array>::Item>>::extend` |
| 15 | 1 | 7% | `canon::css::find_property` |
| 7 | 0 | 0% | `canon::css::values::named_colors::is_named_color` |
| 6 | 0 | 0% | `std::path::compare_components` |
| 5 | 0 | 0% | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 6 | 0 | 0% | `module_graph::key::normalize_str` |
| 5 | 0 | 0% | `canon::css::values::lengths::is_length` |
| 5 | 0 | 0% | `atomic::atom::decl::Atom::new` |
| 10 | 0 | 0% | `core::hash::BuildHasher::hash_one` |
| 5 | 0 | 0% | `canon::dialect::resolve_alias` |
