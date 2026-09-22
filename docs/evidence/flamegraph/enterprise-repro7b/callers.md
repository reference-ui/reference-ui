# Caller attribution: enterprise (a4429aa52ba8)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `../../../../../../../tmp/swarm-reflame7/enterprise-repro7b`.
Derived 2026-09-22T15:08:22.763Z via `pnpm agentrs flame --callers /tmp/swarm-reflame7/enterprise-repro7b`; no re-record, bundle raws untouched.
Covers 1050 weight across 1026 main-thread samples. Shares below are of that weight unless noted.


## Callers of `__open`

Inclusive 238wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 238 | 22.7% | `open` |

## Callers of `nanov2_malloc_type`

Inclusive 87wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 12 | 1.1% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 10 | 1.0% | `<alloc::string::String as core::clone::Clone>::clone` |
| 6 | 0.6% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 5 | 0.5% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::next` |
| 5 | 0.5% | `atomic::atom::when::When::from_catalog` |
| 5 | 0.5% | `atomic::runtime::serializer::serialize_lookup_key` |
| 3 | 0.3% | `module_graph::key::normalize_str` |
| 3 | 0.3% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |

## Callers of `_platform_memmove$VARIANT$Haswell`

Inclusive 51wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `szone_realloc` |
| 4 | 0.4% | `v8::internal::LiteralBuffer::ExpandBuffer()` |
| 3 | 0.3% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 0.3% | `atomic::compile` |
| 2 | 0.2% | `v8::internal::Utf8DecoderBase<v8::internal::Utf8Decoder>::Decode<unsigned char>(unsigned char*, v8::base::Vector<unsigned char const>)` |
| 2 | 0.2% | `v8::internal::String::WriteToFlat2<unsigned char>(unsigned char*, v8::internal::Tagged<v8::internal::ConsString>, unsigned int, unsigned int, v8::internal::SharedStringAccessGuardIfNeeded const&, v8::internal::PerThreadAssertScopeEmpty<false, (v8::internal::PerThreadAssertType)1, (v8::internal::PerThreadAssertType)2> const&)` |
| 2 | 0.2% | `<alloc::string::String as core::clone::Clone>::clone` |
| 2 | 0.2% | `atomic::diagnostics::analysis::analyze` |

## Callers of `_nanov2_free`

Inclusive 43wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `core::ptr::drop_in_place<atomic::atom::want::Want>` |
| 3 | 0.3% | `<smallvec::SmallVec<A> as core::ops::drop::Drop>::drop` |
| 3 | 0.3% | `<alloc::vec::Vec<T,A> as core::ops::drop::Drop>::drop` |
| 2 | 0.2% | `atomic::extract::expressions::object::walk_style_object` |
| 2 | 0.2% | `nanov2_realloc` |
| 2 | 0.2% | `atomic::compile` |
| 2 | 0.2% | `core::ptr::drop_in_place<indexmap::map::IndexMap<alloc::string::String,alloc::vec::Vec<atomic::atom::want::Want>>>` |
| 2 | 0.2% | `core::ptr::drop_in_place<atomic::diagnostics::facts::DiagnosticFact>` |

## Callers of `kevent`

Inclusive 39wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 39 | 3.7% | `uv__io_poll` |

## Callers of `madvise`

Inclusive 31wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 30 | 2.9% | `mvm_madvise_plat` |
| 1 | 0.1% | `v8::base::OS::RecommitPages(void*, unsigned long, v8::base::OS::MemoryPermission)` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 27wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `0x7ff7bed04f4f` |
| 2 | 0.2% | `0x7ff7bed04d9f` |
| 2 | 0.2% | `0x7ff7bed0406f` |
| 2 | 0.2% | `0x7ff7bed0491f` |
| 2 | 0.2% | `0x7ff7bed0389f` |
| 1 | 0.1% | `0x7ff7bed0516f` |
| 1 | 0.1% | `0x7ff7bed04d7f` |
| 1 | 0.1% | `0x7ff7bed0508f` |

## Callers of `__close_nocancel`

Inclusive 20wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 16 | 1.5% | `atomic::scan::scan` |
| 3 | 0.3% | `uv__fs_work` |
| 1 | 0.1% | `uv__close_nocheckstdio` |

## Callers of `read`

Inclusive 18wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 15 | 1.4% | `<std::fs::File as std::io::Read>::read` |
| 3 | 0.3% | `uv__fs_work` |

## Callers of `__getdirentries64`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 1.0% | `_readdir_unlocked$INODE64` |

## Callers of `__write_nocancel`

Inclusive 10wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 10 | 1.0% | `_swrite` |

## Callers of `canon::css::values::lengths::is_length`

Inclusive 10wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `atomic::extract::harvest::classify::classify_harvest_value` |
| 5 | 0.5% | `canon::css::values::classify::classify_css_value` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 25wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.9% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 4 | 0.4% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 3 | 0.3% | `atomic::extract::extract_with_context` |
| 1 | 0.1% | `core::slice::sort::unstable::quicksort::quicksort` |
| 1 | 0.1% | `atomic::diagnostics::analysis::analyze` |
| 1 | 0.1% | `atomic::extract::expressions::ast_value::ast_to_json_value` |
| 1 | 0.1% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 1 | 0.1% | `canon::css::find_property` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_expression`

Inclusive 21wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 17 | 1.6% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 2 | 0.2% | `<atomic::diagnostics::analysis::css::CssVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::extract::constants::collect::ConstCollector as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |

## Callers of `canon::css::find_property`

Inclusive 14wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.9% | `canon::is_known_style_prop` |
| 2 | 0.2% | `atomic::resolve::shorthands::expand_shorthand` |
| 2 | 0.2% | `canon::to_css_declaration_property` |
| 1 | 0.1% | `canon::class_prefix_for_prop` |

## Callers of `oxc_allocator::bump::Bump::alloc_layout_slow`

Inclusive 6wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.6% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_import_specifiers` |

## Callers of `core::hash::BuildHasher::hash_one`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 0.3% | `atomic::diagnostics::proof::render::Proof::collect` |
| 2 | 0.2% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 1 | 0.1% | `base_system::breakpoints::BreakpointScale::width_px` |

## Callers of `canon::dialect::resolve_alias`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `canon::css::is_color_prop` |
| 2 | 0.2% | `canon::resolve_canonical_prop` |
| 2 | 0.2% | `canon::to_css_declaration_property` |
| 1 | 0.1% | `canon::class_prefix_for_prop` |

## Callers of `atomic::resolve::resolve_want_with`

Inclusive 75wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 40 | 3.8% | `atomic::assembly::AssembleCtx::finish` |
| 27 | 2.6% | `atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 8 | 0.8% | `atomic::recipes::push_rule` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `module_graph::record::ExportTable::insert_local` |
| 3 | 0.3% | `styletrace::analysis::surface::trace_style_bindings_with_surface` |
| 2 | 0.2% | `atomic::runtime::serializer::canonical_json_value` |
| 1 | 0.1% | `atomic::extract::scope::table::ScopeTable::declare` |
| 1 | 0.1% | `oxc_ast_visit::generated::visit::walk::walk_expression` |

## Callers of `std::path::compare_components`

Inclusive 6wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 3 | 0.3% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |

## Malloc-family leaves by nearest atomic/canon ancestor

163wt of malloc-family leaves; 4wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 20 | 1.9% | `atomic::assembly::AssembleCtx::finish` |
| 13 | 1.2% | `atomic::scan::resolve_segments` |
| 8 | 0.8% | `atomic::compile` |
| 6 | 0.6% | `atomic::resolve::resolve_want_with` |
| 5 | 0.5% | `atomic::extract::expressions::object::walk_style_object` |
| 5 | 0.5% | `atomic::atom::when::When::from_catalog` |
| 5 | 0.5% | `atomic::runtime::serializer::serialize_lookup_key` |
| 5 | 0.5% | `reference_virtual_native::atomic::__napi__compile_system` |
| 4 | 0.4% | `atomic::extract::constants::index::LocalConstants::insert_scalar` |
| 4 | 0.4% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 3 | 0.3% | `atomic::scan::scan` |
| 3 | 0.3% | `module_graph::key::normalize_str` |
| 3 | 0.3% | `atomic::extract::resolver::ValueGraph::new` |
| 3 | 0.3% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 3 | 0.3% | `atomic::extract::expressions::ast_value::ast_to_json_value` |
| 3 | 0.3% | `atomic::atom::want::Want::with_origin` |
| 3 | 0.3% | `atomic::resolve::tokens::format_entry` |
| 3 | 0.3% | `atomic::runtime::builder::PlanBuilder::build_keyed` |

## memmove leaves by nearest .node ancestor

51wt of memmove leaves; 14wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 3 | 0.3% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 0.3% | `atomic::compile` |
| 2 | 0.2% | `<alloc::string::String as core::clone::Clone>::clone` |
| 2 | 0.2% | `atomic::diagnostics::analysis::analyze` |
| 2 | 0.2% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 2 | 0.2% | `atomic::runtime::serializer::serialize_lookup_key` |
| 2 | 0.2% | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 2 | 0.2% | `atomic::stylesheet::layers::wrap_package_layer` |
| 1 | 0.1% | `atomic::scan::scan` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::next` |
| 1 | 0.1% | `std::path::PathBuf::_push` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::try_fold` |
| 1 | 0.1% | `hashbrown::raw::RawIterRange<T>::fold_impl` |

## memcmp leaves by nearest .node ancestor

27wt of memcmp leaves; 1wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.6% | `canon::css::find_property` |
| 3 | 0.3% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 2 | 0.2% | `module_graph::ladder::memo::cached` |
| 2 | 0.2% | `canon::css::is_color_prop` |
| 2 | 0.2% | `canon::dialect::resolve_alias` |
| 2 | 0.2% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 1 | 0.1% | `atomic::extract::constants::index::LocalConstants::merge` |
| 1 | 0.1% | `module_graph::record::ModuleRecord::import_edge` |
| 1 | 0.1% | `atomic::resolve::rhythm::resolve_rhythm` |
| 1 | 0.1% | `base_system::tokens::TokenDictionary::get_in_category` |
| 1 | 0.1% | `base_system::condition_map::ConditionMap::get` |
| 1 | 0.1% | `core::slice::sort::stable::quicksort::quicksort` |
| 1 | 0.1% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 1 | 0.1% | `hashbrown::rustc_entry::<impl hashbrown::map::HashMap<K,V,S,A>>::rustc_entry` |

## File opens by issuing frame

238wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 236 | 22.5% | `std::sys::fs::unix::File::open_c [virtual-native.darwin-x64.node]` |
| 2 | 0.2% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

488wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 468 | 44.6% | `reference_virtual_native::atomic::__napi__compile_system → atomic::compile` |
| 191 | 18.2% | `atomic::compile → atomic::assembly::AssembleCtx::finish` |
| 55 | 5.2% | `atomic::assembly::AssembleCtx::finish → atomic::runtime::builder::PlanBuilder::build_keyed` |
| 53 | 5.0% | `atomic::compile → atomic::extract::extract_with_context` |
| 51 | 4.9% | `oxc_ast_visit::generated::visit::walk::walk_function → oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 48 | 4.6% | `oxc_ast_visit::generated::visit::walk::walk_declaration → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 48 | 4.6% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 40 | 3.8% | `atomic::assembly::AssembleCtx::finish → atomic::resolve::resolve_want_with` |
| 38 | 3.6% | `atomic::runtime::builder::PlanBuilder::build_keyed → atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 33 | 3.1% | `atomic::assembly::AssembleCtx::finish → atomic::stylesheet::emitter::build_stylesheets_with` |
| 31 | 3.0% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 31 | 3.0% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 31 | 3.0% | `atomic::compile → atomic::stream::merge_constants_ordered` |
| 31 | 3.0% | `atomic::compile → atomic::hosts::resolve` |
| 31 | 3.0% | `atomic::extract::extract_with_context → oxc_ast_visit::generated::visit::walk::walk_function` |
| 31 | 3.0% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression → atomic::extract::css::extract` |
| 31 | 3.0% | `atomic::extract::css::extract → atomic::extract::css::handle_css_arg` |
| 28 | 2.7% | `atomic::extract::css::handle_css_arg → atomic::extract::expressions::object::walk_style_object` |
| 27 | 2.6% | `atomic::runtime::builder::PlanBuilder::resolve_entry → atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 27 | 2.6% | `atomic::runtime::builder::resolve_with_unique_diagnostics → atomic::resolve::resolve_want_with` |
| 25 | 2.4% | `atomic::compile → <alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 25 | 2.4% | `atomic::resolve::resolve_want_with → atomic::resolve::tokens::resolve_token_value` |
| 24 | 2.3% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter → <core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 23 | 2.2% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold → oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 22 | 2.1% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 89 | 48 | 54% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 75 | 26 | 35% | `atomic::resolve::resolve_want_with` |
| 25 | 18 | 72% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 12 | 5 | 42% | `core::slice::sort::stable::quicksort::quicksort` |
| 12 | 4 | 33% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 10 | 4 | 40% | `module_graph::key::normalize_str` |
| 21 | 3 | 14% | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 20 | 3 | 15% | `oxc_ast_visit::generated::visit::walk::walk_statement` |
| 14 | 1 | 7% | `canon::css::find_property` |
| 9 | 1 | 11% | `canon::dialect::resolve_alias` |
| 10 | 0 | 0% | `canon::css::values::lengths::is_length` |
| 6 | 0 | 0% | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 9 | 0 | 0% | `core::hash::BuildHasher::hash_one` |
| 6 | 0 | 0% | `std::path::compare_components` |
| 5 | 0 | 0% | `canon::css::values::named_colors::is_named_color` |
