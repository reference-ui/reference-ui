# Caller attribution: enterprise (ff64ab75b594)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `../../../../../../../tmp/swarm-reflame6/enterprise-repro6b`.
Derived 2026-09-22T13:33:39.339Z via `pnpm agentrs flame --callers /tmp/swarm-reflame6/enterprise-repro6b`; no re-record, bundle raws untouched.
Covers 1082 weight across 1056 main-thread samples. Shares below are of that weight unless noted.


## Callers of `__open`

Inclusive 239wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 239 | 22.1% | `open` |

## Callers of `nanov2_malloc_type`

Inclusive 64wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 12 | 1.1% | `<alloc::string::String as core::clone::Clone>::clone` |
| 6 | 0.6% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 5 | 0.5% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 4 | 0.4% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 3 | 0.3% | `atomic::extract::harvest::literals::HarvestPool::insert` |
| 2 | 0.2% | `operator new(unsigned long)` |
| 2 | 0.2% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 2 | 0.2% | `atomic::diagnostics::analysis::values::classify_value` |

## Callers of `_platform_memmove$VARIANT$Haswell`

Inclusive 49wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 4 | 0.4% | `v8::internal::LiteralBuffer::ExpandBuffer()` |
| 4 | 0.4% | `v8::internal::FactoryBase<v8::internal::Factory>::NewStringFromOneByte(v8::base::Vector<unsigned char const>, v8::internal::AllocationType)` |
| 4 | 0.4% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.3% | `v8::internal::JsonStringifier::Extend()` |
| 3 | 0.3% | `atomic::compile` |
| 2 | 0.2% | `v8::internal::AstValueFactory::GetString(unsigned int, bool, v8::base::Vector<unsigned char const>)` |
| 2 | 0.2% | `v8::internal::JsonStringifier::SerializeString<false>(v8::internal::Handle<v8::internal::String>)` |

## Callers of `_nanov2_free`

Inclusive 46wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Dying,K,V,NodeType>,alloc::collections::btree::node::marker::KV>::drop_key_val` |
| 3 | 0.3% | `atomic::resolve::resolve_want_with` |
| 3 | 0.3% | `core::ptr::drop_in_place<indexmap::map::IndexMap<alloc::string::String,alloc::vec::Vec<atomic::atom::want::Want>>>` |
| 2 | 0.2% | `atomic::extract::expressions::responsive::walk_object` |
| 2 | 0.2% | `atomic::extract::expressions::object::walk_style_object` |
| 2 | 0.2% | `nanov2_realloc` |
| 2 | 0.2% | `<alloc::vec::Vec<T,A> as core::ops::drop::Drop>::drop` |
| 2 | 0.2% | `core::ptr::drop_in_place<[serde_json::value::Value]>` |

## Callers of `madvise`

Inclusive 38wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 38 | 3.5% | `mvm_madvise_plat` |

## Callers of `kevent`

Inclusive 38wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 38 | 3.5% | `uv__io_poll` |

## Callers of `read`

Inclusive 32wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 32 | 3.0% | `uv__fs_work` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 23wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 2 | 0.2% | `0x7ff7b6e6a77f` |
| 2 | 0.2% | `0x7ff7b6e6b3cf` |
| 1 | 0.1% | `0x7ff7b6e6b6cf` |
| 1 | 0.1% | `0x7ff7b6e6a99f` |
| 1 | 0.1% | `0x7ff7b6e6b21f` |
| 1 | 0.1% | `0x7ff7b6e6ad8f` |
| 1 | 0.1% | `0x7ff7b6e6ae2f` |
| 1 | 0.1% | `0x7ff7b6e6b58f` |

## Callers of `__write_nocancel`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 13 | 1.2% | `_swrite` |

## Callers of `__getdirentries64`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 13 | 1.2% | `_readdir_unlocked$INODE64` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_expression`

Inclusive 26wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 15 | 1.4% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 3 | 0.3% | `<atomic::extract::constants::collect::ConstCollector as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 2 | 0.2% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 2 | 0.2% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 1 | 0.1% | `<atomic::diagnostics::analysis::css::CssVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::extract::scope::call_init::CallInitPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_statement` |

## Callers of `stat$INODE64`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.7% | `std::path::Path::is_file` |
| 3 | 0.3% | `uv__fs_work` |
| 1 | 0.1% | `std::sys::fs::metadata` |

## Callers of `core::hash::BuildHasher::hash_one`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `atomic::diagnostics::proof::render::Proof::collect` |
| 3 | 0.3% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 1 | 0.1% | `module_graph::ladder::SpecifierLadder<F>::package_hit` |
| 1 | 0.1% | `module_graph::ladder::probe::probe_base` |
| 1 | 0.1% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 1 | 0.1% | `<indexmap::map::IndexMap<K,V,S> as core::iter::traits::collect::FromIterator<(K,V)>>::from_iter` |
| 1 | 0.1% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 1 | 0.1% | `atomic::compile` |

## Callers of `canon::css::find_property`

Inclusive 14wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.8% | `canon::is_known_style_prop` |
| 2 | 0.2% | `canon::to_css_declaration_property` |
| 2 | 0.2% | `canon::class_prefix_for_prop` |
| 1 | 0.1% | `atomic::resolve::shorthands::expand_shorthand` |

## Callers of `canon::css::values::lengths::is_length`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `canon::css::values::classify::classify_css_value` |
| 4 | 0.4% | `atomic::extract::harvest::classify::classify_harvest_value` |

## Callers of `core::str::<impl str>::trim_matches`

Inclusive 8wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 2 | 0.2% | `canon::css::values::classify::classify_css_value` |
| 2 | 0.2% | `canon::css::values::functions::classify_function` |
| 1 | 0.1% | `canon::css::values::lengths::is_length` |
| 1 | 0.1% | `atomic::resolve::tokens::resolve_token_value` |
| 1 | 0.1% | `atomic::resolve::unit::css_value_from_authored` |
| 1 | 0.1% | `atomic::resolve::shorthands::expand_shorthand` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 16wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `module_graph::record::ExportTable::insert_local` |
| 4 | 0.4% | `atomic::runtime::serializer::canonical_json_value` |
| 3 | 0.3% | `styletrace::analysis::surface::trace_style_bindings_with_surface` |
| 2 | 0.2% | `module_graph::record::collect::statement` |
| 1 | 0.1% | `module_graph::record::collect::insert_var_names` |
| 1 | 0.1% | `std::sync::once::Once::call_once_force::{{closure}}` |

## Callers of `module_graph::key::normalize_str`

Inclusive 7wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.6% | `module_graph::key::ModuleKey::new` |

## Callers of `std::path::compare_components`

Inclusive 7wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 3 | 0.3% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 1 | 0.1% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::component_is_traced` |

## Callers of `canon::css::values::named_colors::is_named_color`

Inclusive 6wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.6% | `canon::css::values::classify::classify_css_value` |

## Callers of `oxc_allocator::bump::Bump::alloc_layout_slow`

Inclusive 6wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.6% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_import_specifiers` |

## Malloc-family leaves by nearest atomic/canon ancestor

151wt of malloc-family leaves; 10wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 24 | 2.2% | `atomic::compile` |
| 9 | 0.8% | `atomic::resolve::resolve_want_with` |
| 8 | 0.7% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 5 | 0.5% | `atomic::resolve::conditions::lower_when` |
| 5 | 0.5% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 4 | 0.4% | `atomic::extract::expressions::responsive::walk_object` |
| 4 | 0.4% | `atomic::extract::expressions::object::walk_style_object` |
| 4 | 0.4% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 3 | 0.3% | `atomic::sources::collect` |
| 3 | 0.3% | `atomic::extract::resolver::ValueGraph::new` |
| 3 | 0.3% | `atomic::diagnostics::analysis::analyze` |
| 3 | 0.3% | `atomic::extract::harvest::literals::HarvestPool::insert` |
| 3 | 0.3% | `atomic::resolve::tokens::format_entry` |
| 3 | 0.3% | `atomic::recipes::compile_one` |
| 3 | 0.3% | `atomic::runtime::serializer::serialize_lookup_key` |
| 3 | 0.3% | `reference_virtual_native::atomic::__napi__compile_system` |
| 2 | 0.2% | `serde_core::de::impls::<impl serde_core::de::Deserialize for core::option::Option<T>>::deserialize` |
| 2 | 0.2% | `atomic::extract::constants::index::LocalConstants::insert_scalar` |

## memmove leaves by nearest .node ancestor

49wt of memmove leaves; 20wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 4 | 0.4% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.3% | `atomic::compile` |
| 2 | 0.2% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 2 | 0.2% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 2 | 0.2% | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 2 | 0.2% | `atomic::stylesheet::layers::wrap_package_layer` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 1 | 0.1% | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 1 | 0.1% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 1 | 0.1% | `atomic::extract::expressions::literal::push_string_want` |
| 1 | 0.1% | `atomic::extract::extract_with_context` |
| 1 | 0.1% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 1 | 0.1% | `atomic::stylesheet::name::push_selector_with_prefix` |

## memcmp leaves by nearest .node ancestor

23wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `canon::css::find_property` |
| 5 | 0.5% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 3 | 0.3% | `canon::dialect::resolve_alias` |
| 3 | 0.3% | `canon::css::is_color_prop` |
| 1 | 0.1% | `atomic::extract::constants::index::LocalConstants::merge` |
| 1 | 0.1% | `canon::is_known_style_prop` |
| 1 | 0.1% | `atomic::extract::recipes::selection::extract_call` |
| 1 | 0.1% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 1 | 0.1% | `core::slice::sort::stable::quicksort::quicksort` |
| 1 | 0.1% | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Owned,K,V,alloc::collections::btree::node::marker::LeafOrInternal>>::bulk_push` |
| 1 | 0.1% | `core::slice::sort::shared::smallsort::small_sort_general_with_scratch` |

## File opens by issuing frame

239wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 239 | 22.1% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

519wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 477 | 44.1% | `reference_virtual_native::atomic::__napi__compile_system → atomic::compile` |
| 56 | 5.2% | `atomic::compile → atomic::runtime::builder::PlanBuilder::build_keyed` |
| 53 | 4.9% | `atomic::compile → atomic::extract::extract_with_context` |
| 51 | 4.7% | `oxc_ast_visit::generated::visit::walk::walk_function → oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 48 | 4.4% | `oxc_ast_visit::generated::visit::walk::walk_declaration → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 47 | 4.3% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 43 | 4.0% | `atomic::runtime::builder::PlanBuilder::build_keyed → atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 41 | 3.8% | `atomic::compile → atomic::resolve::resolve_want_with` |
| 38 | 3.5% | `atomic::compile → <alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 34 | 3.1% | `atomic::compile → atomic::stylesheet::emitter::build_stylesheets_with` |
| 32 | 3.0% | `atomic::compile → atomic::hosts::resolve` |
| 32 | 3.0% | `atomic::runtime::builder::PlanBuilder::resolve_entry → atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 32 | 3.0% | `atomic::runtime::builder::resolve_with_unique_diagnostics → atomic::resolve::resolve_want_with` |
| 31 | 2.9% | `atomic::resolve::resolve_want_with → atomic::resolve::tokens::resolve_token_value` |
| 30 | 2.8% | `atomic::extract::extract_with_context → oxc_ast_visit::generated::visit::walk::walk_function` |
| 29 | 2.7% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 29 | 2.7% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 28 | 2.6% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression → atomic::extract::css::extract` |
| 27 | 2.5% | `atomic::extract::css::extract → atomic::extract::css::handle_css_arg` |
| 26 | 2.4% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter → <core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 25 | 2.3% | `oxc_ast_visit::generated::visit::walk::walk_expression → oxc_ast_visit::generated::visit::walk::walk_expression` |
| 25 | 2.3% | `atomic::extract::css::handle_css_arg → atomic::extract::expressions::object::walk_style_object` |
| 24 | 2.2% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold → oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 23 | 2.1% | `atomic::stylesheet::emitter::build_stylesheets_with → atomic::stylesheet::cascade::write_utilities` |
| 21 | 1.9% | `atomic::hosts::resolve → styletrace::analysis::surface::trace_style_bindings_with_surface` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 16 | 6 | 38% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 26 | 5 | 19% | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 6 | 2 | 33% | `alloc::collections::btree::map::entry::Entry<K,V,A>::or_default` |
| 15 | 2 | 13% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 7 | 1 | 14% | `module_graph::key::normalize_str` |
| 6 | 1 | 17% | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 13 | 0 | 0% | `core::hash::BuildHasher::hash_one` |
| 14 | 0 | 0% | `canon::css::find_property` |
| 9 | 0 | 0% | `canon::css::values::lengths::is_length` |
| 8 | 0 | 0% | `core::str::<impl str>::trim_matches` |
| 7 | 0 | 0% | `std::path::compare_components` |
| 6 | 0 | 0% | `canon::css::values::named_colors::is_named_color` |
| 5 | 0 | 0% | `oxc_parser::module_record::ModuleRecordBuilder::add_module_request` |
| 9 | 0 | 0% | `canon::css::is_color_prop` |
| 4 | 0 | 0% | `atomic::includes::glob::match_from` |
