# Caller attribution: enterprise (b8a75b0bd74c)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `docs/evidence/flamegraph/enterprise-repro5b`.
Derived 2026-09-22T12:41:18.086Z via `pnpm agentrs flame --callers docs/evidence/flamegraph/enterprise-repro5b --out docs/evidence/flamegraph/enterprise-repro5b`; no re-record, bundle raws untouched.
Covers 1119 weight across 1094 main-thread samples. Shares below are of that weight unless noted.


## Callers of `__open`

Inclusive 260wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 260 | 23.2% | `open` |

## Callers of `_platform_memmove$VARIANT$Haswell`

Inclusive 66wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.7% | `v8::internal::LiteralBuffer::ExpandBuffer()` |
| 5 | 0.4% | `szone_realloc` |
| 4 | 0.4% | `v8::internal::FactoryBase<v8::internal::Factory>::NewStringFromOneByte(v8::base::Vector<unsigned char const>, v8::internal::AllocationType)` |
| 4 | 0.4% | `atomic::compile` |
| 4 | 0.4% | `atomic::extract::extract_with_context` |
| 3 | 0.3% | `v8::internal::JsonStringifier::Extend()` |
| 3 | 0.3% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 3 | 0.3% | `<alloc::string::String as core::clone::Clone>::clone` |

## Callers of `nanov2_malloc_type`

Inclusive 62wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 12 | 1.1% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 9 | 0.8% | `<alloc::string::String as core::clone::Clone>::clone` |
| 6 | 0.5% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 3 | 0.3% | `operator new(unsigned long)` |
| 3 | 0.3% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 3 | 0.3% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 3 | 0.3% | `atomic::resolve::resolve_want_with` |
| 2 | 0.2% | `alloc::str::join_generic_copy` |

## Callers of `_nanov2_free`

Inclusive 49wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.6% | `core::ptr::drop_in_place<atomic::atom::want::Want>` |
| 5 | 0.4% | `atomic::extract::expressions::object::walk_style_object` |
| 3 | 0.3% | `<hashbrown::raw::RawTable<T,A> as core::ops::drop::Drop>::drop` |
| 3 | 0.3% | `core::ptr::drop_in_place<atomic::atom::decl::Atom>` |
| 2 | 0.2% | `nanov2_realloc` |
| 2 | 0.2% | `<alloc::vec::Vec<T,A> as core::ops::drop::Drop>::drop` |
| 2 | 0.2% | `atomic::extract::expressions::responsive::walk_object` |
| 2 | 0.2% | `atomic::compile` |

## Callers of `kevent`

Inclusive 38wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 38 | 3.4% | `uv__io_poll` |

## Callers of `madvise`

Inclusive 30wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 30 | 2.7% | `mvm_madvise_plat` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 26wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `0x7ff7b0efd6cf` |
| 2 | 0.2% | `0x7ff7b0efc75f` |
| 2 | 0.2% | `0x7ff7b0efc77f` |
| 2 | 0.2% | `0x7ff7b0efd3cf` |
| 2 | 0.2% | `0x7ff7b0efd55f` |
| 1 | 0.1% | `0x7ff7b0efc58f` |
| 1 | 0.1% | `atomic::includes::FileMatcher::matches_file` |
| 1 | 0.1% | `std::path::compare_components` |

## Callers of `read`

Inclusive 25wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 25 | 2.2% | `uv__fs_work` |

## Callers of `__write_nocancel`

Inclusive 23wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 23 | 2.1% | `_swrite` |

## Callers of `__getdirentries64`

Inclusive 15wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 15 | 1.3% | `_readdir_unlocked$INODE64` |

## Callers of `stat$INODE64`

Inclusive 14wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.8% | `std::path::Path::is_file` |
| 4 | 0.4% | `uv__fs_work` |
| 1 | 0.1% | `std::sys::fs::metadata` |

## Callers of `nanov2_allocate_outlined`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 12 | 1.1% | `nanov2_malloc_type` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_expression`

Inclusive 23wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 16 | 1.4% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 2 | 0.2% | `<atomic::extract::constants::collect::ConstCollector as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 2 | 0.2% | `<atomic::diagnostics::analysis::css::CssVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::extract::scope::call_init::CallInitPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |

## Callers of `core::hash::BuildHasher::hash_one`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `atomic::diagnostics::proof::render::Proof::collect` |
| 3 | 0.3% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 2 | 0.2% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 1 | 0.1% | `hashbrown::rustc_entry::<impl hashbrown::map::HashMap<K,V,S,A>>::rustc_entry` |
| 1 | 0.1% | `atomic::compile` |

## Callers of `canon::css::values::lengths::is_length`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.6% | `canon::css::values::classify::classify_css_value` |
| 6 | 0.5% | `atomic::extract::harvest::classify::classify_harvest_value` |

## Callers of `canon::css::is_color_prop`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.6% | `atomic::resolve::tokens::lookup_entry` |
| 4 | 0.4% | `atomic::resolve::tokens::resolve_token_value` |
| 2 | 0.2% | `atomic::resolve::unit::css_value_from_authored` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `module_graph::record::ExportTable::insert_local` |
| 2 | 0.2% | `module_graph::record::collect::insert_var_names` |
| 2 | 0.2% | `styletrace::analysis::surface::trace_style_bindings_with_surface` |
| 1 | 0.1% | `oxc_ast_visit::generated::visit::walk::walk_expression` |

## Callers of `canon::css::values::named_colors::is_named_color`

Inclusive 8wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.7% | `canon::css::values::classify::classify_css_value` |

## Callers of `core::slice::sort::stable::quicksort::quicksort`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 12 | 1.1% | `core::slice::sort::stable::drift::sort` |

## Callers of `canon::dialect::resolve_alias`

Inclusive 7wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 2 | 0.2% | `canon::css::is_color_prop` |
| 2 | 0.2% | `canon::resolve_canonical_prop` |
| 1 | 0.1% | `canon::is_known_style_prop` |
| 1 | 0.1% | `canon::css::is_unitless_prop` |
| 1 | 0.1% | `canon::class_prefix_for_prop` |

## Callers of `canon::css::find_property`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `canon::is_known_style_prop` |
| 2 | 0.2% | `canon::to_css_declaration_property` |
| 1 | 0.1% | `atomic::resolve::shorthands::expand_shorthand` |
| 1 | 0.1% | `canon::class_prefix_for_prop` |

## Callers of `atomic::diagnostics::site::LineIndex::for_source`

Inclusive 4wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 2 | 0.2% | `atomic::extract::recipes::walk::walk_style_into` |
| 2 | 0.2% | `atomic::extract::css::handle_css_arg` |

## Malloc-family leaves by nearest atomic/canon ancestor

137wt of malloc-family leaves; 6wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 26 | 2.3% | `atomic::compile` |
| 12 | 1.1% | `atomic::resolve::resolve_want_with` |
| 7 | 0.6% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 7 | 0.6% | `atomic::extract::expressions::object::walk_style_object` |
| 6 | 0.5% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 5 | 0.4% | `reference_virtual_native::atomic::__napi__compile_system` |
| 3 | 0.3% | `atomic::sources::collect` |
| 3 | 0.3% | `atomic::extract::expressions::literal::push_string_want` |
| 3 | 0.3% | `atomic::resolve::tokens::format_entry` |
| 3 | 0.3% | `atomic::resolve::conditions::lower_when` |
| 3 | 0.3% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 3 | 0.3% | `atomic::stylesheet::emitter::append_recipes_layer` |
| 2 | 0.2% | `atomic::extract::constants::index::LocalConstants::merge` |
| 2 | 0.2% | `atomic::extract::resolver::ValueGraph::new` |
| 2 | 0.2% | `styletrace::analysis::surface::trace_style_bindings_with_surface` |
| 2 | 0.2% | `atomic::diagnostics::analysis::structured::string_literal_value` |
| 2 | 0.2% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 2 | 0.2% | `atomic::extract::expressions::responsive::walk_object` |

## memmove leaves by nearest .node ancestor

66wt of memmove leaves; 23wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 4 | 0.4% | `atomic::compile` |
| 4 | 0.4% | `atomic::extract::extract_with_context` |
| 3 | 0.3% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 3 | 0.3% | `<alloc::string::String as core::clone::Clone>::clone` |
| 2 | 0.2% | `alloc::str::join_generic_copy` |
| 2 | 0.2% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 2 | 0.2% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 2 | 0.2% | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 2 | 0.2% | `atomic::stylesheet::layers::wrap_package_layer` |
| 2 | 0.2% | `napi::bindgen_runtime::js_values::string::<impl napi::bindgen_runtime::js_values::ToNapiValue for &alloc::string::String>::to_napi_value` |
| 1 | 0.1% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 1 | 0.1% | `<alloc::string::String as core::fmt::Write>::write_str` |

## memcmp leaves by nearest .node ancestor

26wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `canon::css::find_property` |
| 3 | 0.3% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 2 | 0.2% | `atomic::extract::constants::index::LocalConstants::merge` |
| 2 | 0.2% | `canon::css::is_color_prop` |
| 2 | 0.2% | `<atomic::diagnostics::proof::memo::MemoKey as core::cmp::PartialEq>::eq` |
| 1 | 0.1% | `core::slice::sort::shared::smallsort::small_sort_general` |
| 1 | 0.1% | `atomic::includes::FileMatcher::matches_file` |
| 1 | 0.1% | `std::path::compare_components` |
| 1 | 0.1% | `module_graph::ladder::SpecifierLadder<F>::resolve` |
| 1 | 0.1% | `atomic::extract::resolver::ValueGraph::value_of` |
| 1 | 0.1% | `<atomic::extract::resolver::source::AtomicFs as module_graph::fs::FileSystem>::read_to_string` |
| 1 | 0.1% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 1 | 0.1% | `atomic::extract::harvest::literals::collect_pool` |
| 1 | 0.1% | `base_system::tokens::TokenDictionary::get_in_category` |

## File opens by issuing frame

260wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 260 | 23.2% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

520wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 477 | 42.6% | `reference_virtual_native::atomic::__napi__compile_system → atomic::compile` |
| 63 | 5.6% | `atomic::compile → atomic::extract::extract_with_context` |
| 56 | 5.0% | `oxc_ast_visit::generated::visit::walk::walk_function → oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 55 | 4.9% | `atomic::compile → atomic::runtime::builder::PlanBuilder::build_keyed` |
| 49 | 4.4% | `oxc_ast_visit::generated::visit::walk::walk_declaration → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 48 | 4.3% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 43 | 3.8% | `atomic::runtime::builder::PlanBuilder::build_keyed → atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 41 | 3.7% | `atomic::compile → <alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 41 | 3.7% | `atomic::compile → atomic::resolve::resolve_want_with` |
| 36 | 3.2% | `atomic::extract::extract_with_context → oxc_ast_visit::generated::visit::walk::walk_function` |
| 33 | 2.9% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression → atomic::extract::css::extract` |
| 33 | 2.9% | `atomic::resolve::resolve_want_with → atomic::resolve::tokens::resolve_token_value` |
| 33 | 2.9% | `atomic::compile → atomic::stylesheet::emitter::build_stylesheets_with` |
| 32 | 2.9% | `atomic::compile → atomic::hosts::resolve` |
| 32 | 2.9% | `atomic::extract::css::extract → atomic::extract::css::handle_css_arg` |
| 31 | 2.8% | `atomic::runtime::builder::PlanBuilder::resolve_entry → atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 31 | 2.8% | `atomic::runtime::builder::resolve_with_unique_diagnostics → atomic::resolve::resolve_want_with` |
| 30 | 2.7% | `atomic::extract::css::handle_css_arg → atomic::extract::expressions::object::walk_style_object` |
| 28 | 2.5% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 28 | 2.5% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 26 | 2.3% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter → <core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 25 | 2.2% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration` |
| 25 | 2.2% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration` |
| 25 | 2.2% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration → oxc_parser::ts::statement::<impl oxc_parser::ParserImpl>::parse_declaration` |
| 24 | 2.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold → oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 83 | 27 | 33% | `atomic::resolve::resolve_want_with` |
| 18 | 5 | 28% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 12 | 4 | 33% | `core::slice::sort::stable::quicksort::quicksort` |
| 9 | 3 | 33% | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 15 | 2 | 13% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_primary_expression` |
| 23 | 1 | 4% | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 7 | 1 | 14% | `canon::dialect::resolve_alias` |
| 11 | 0 | 0% | `core::hash::BuildHasher::hash_one` |
| 13 | 0 | 0% | `canon::css::values::lengths::is_length` |
| 13 | 0 | 0% | `canon::css::is_color_prop` |
| 11 | 0 | 0% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 8 | 0 | 0% | `canon::css::values::named_colors::is_named_color` |
| 9 | 0 | 0% | `canon::css::find_property` |
| 4 | 0 | 0% | `atomic::diagnostics::site::LineIndex::for_source` |
| 4 | 0 | 0% | `core::str::<impl str>::trim_matches` |
