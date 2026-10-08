# Caller attribution: enterprise (810b8b5b4744)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `../../../../../../../tmp/swarm-repro-flame/enterprise-repro1`.
Derived 2026-09-21T23:05:52.601Z via `pnpm agentrs flame --callers /tmp/swarm-repro-flame/enterprise-repro1`; no re-record, bundle raws untouched.
Covers 1226 weight across 1207 main-thread samples. Shares below are of that weight unless noted.


## Callers of `__open`

Inclusive 243wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 243 | 19.8% | `open` |

## Callers of `nanov2_malloc_type`

Inclusive 109wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 23 | 1.9% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 19 | 1.5% | `<alloc::string::String as core::clone::Clone>::clone` |
| 9 | 0.7% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 5 | 0.4% | `atomic::resolve::resolve_want_with` |
| 5 | 0.4% | `atomic::runtime::serializer::serialize_lookup_key` |
| 4 | 0.3% | `atomic::includes::trim_slashes` |
| 4 | 0.3% | `module_graph::key::normalize_str` |
| 3 | 0.2% | `atomic::atom::want::Want::with_origin` |

## Callers of `_nanov2_free`

Inclusive 68wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `<hashbrown::raw::RawTable<T,A> as core::ops::drop::Drop>::drop` |
| 5 | 0.4% | `core::ptr::drop_in_place<core::option::Option<atomic::diagnostics::facts::OwnedLookupKey>>` |
| 5 | 0.4% | `atomic::resolve::resolve_want_with` |
| 4 | 0.3% | `module_graph::key::normalize_str` |
| 4 | 0.3% | `core::ptr::drop_in_place<atomic::atom::when::When>` |
| 3 | 0.2% | `nanov2_realloc` |
| 3 | 0.2% | `atomic::compile` |
| 2 | 0.2% | `atomic::extract::expressions::object::walk_style_object` |

## Callers of `_platform_memmove$VARIANT$Haswell`

Inclusive 53wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `v8::internal::LiteralBuffer::ExpandBuffer()` |
| 5 | 0.4% | `v8::internal::JsonStringifier::Extend()` |
| 4 | 0.3% | `v8::internal::FactoryBase<v8::internal::Factory>::NewStringFromOneByte(v8::base::Vector<unsigned char const>, v8::internal::AllocationType)` |
| 4 | 0.3% | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 3 | 0.2% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 3 | 0.2% | `atomic::compile` |
| 3 | 0.2% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 2 | 0.2% | `atomic::diagnostics::analysis::analyze` |

## Callers of `madvise`

Inclusive 39wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 39 | 3.2% | `mvm_madvise_plat` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 32wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.2% | `0x7ff7b83a507f` |
| 2 | 0.2% | `0x7ff7b83a557f` |
| 2 | 0.2% | `0x7ff7b83a4bcf` |
| 2 | 0.2% | `0x7ff7b83a4bef` |
| 2 | 0.2% | `0x7ff7b83a42ff` |
| 1 | 0.1% | `0x7ff7b83a314f` |
| 1 | 0.1% | `0x7ff7b83a4ddf` |
| 1 | 0.1% | `0x7ff7b83a486f` |

## Callers of `kevent`

Inclusive 31wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 31 | 2.5% | `uv__io_poll` |

## Callers of `read`

Inclusive 28wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 28 | 2.3% | `uv__fs_work` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_expression`

Inclusive 29wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 21 | 1.7% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 2 | 0.2% | `<atomic::extract::constants::collect::ConstCollector as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 2 | 0.2% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::diagnostics::analysis::css::CssVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `<atomic::extract::scope::call_init::CallInitPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `oxc_ast_visit::generated::visit::walk::walk_function` |

## Callers of `canon::css::find_property`

Inclusive 28wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 19 | 1.5% | `canon::is_known_style_prop` |
| 4 | 0.3% | `canon::css::native_longhands_for_prop` |
| 3 | 0.2% | `canon::to_css_declaration_property` |
| 2 | 0.2% | `canon::class_prefix_for_prop` |

## Callers of `__getdirentries64`

Inclusive 14wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 14 | 1.1% | `_readdir_unlocked$INODE64` |

## Callers of `__write_nocancel`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 13 | 1.1% | `_swrite` |

## Callers of `std::path::compare_components`

Inclusive 17wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 4 | 0.3% | `core::slice::sort::shared::smallsort::small_sort_general_with_scratch` |
| 4 | 0.3% | `core::slice::sort::stable::quicksort::quicksort` |
| 2 | 0.2% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 1 | 0.1% | `core::slice::sort::shared::pivot::median3_rec` |
| 1 | 0.1% | `core::slice::sort::shared::smallsort::sort4_stable` |

## Callers of `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 0.9% | `core::hash::BuildHasher::hash_one` |

## Callers of `<std::path::Components as core::iter::traits::iterator::Iterator>::next`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.3% | `std::path::compare_components` |
| 4 | 0.3% | `module_graph::key::normalize_str` |
| 1 | 0.1% | `std::path::Path::_strip_prefix` |

## Callers of `hashbrown::map::HashMap<K,V,S,A>::insert`

Inclusive 25wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `hashbrown::raw::RawIterRange<T>::fold_impl` |
| 6 | 0.5% | `atomic::extract::harvest::mint::mint` |
| 3 | 0.2% | `atomic::extract::resolver::ValueGraph::new` |
| 2 | 0.2% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 2 | 0.2% | `atomic::diagnostics::analysis::record_declarator_shadow` |
| 2 | 0.2% | `atomic::extract::resolver::ValueGraph::resolve_binding` |
| 2 | 0.2% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 1 | 0.1% | `atomic::sources::collect` |

## Callers of `canon::css::values::lengths::is_length`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.7% | `canon::css::values::classify::classify_css_value` |

## Callers of `core::hash::BuildHasher::hash_one`

Inclusive 20wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 10 | 0.8% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 2 | 0.2% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 1 | 0.1% | `hashbrown::rustc_entry::<impl hashbrown::map::HashMap<K,V,S,A>>::rustc_entry` |
| 1 | 0.1% | `styletrace::analysis::parser::parse_trace_module` |
| 1 | 0.1% | `atomic::extract::resolver::source::AtomicFs::content` |
| 1 | 0.1% | `atomic::extract::bindings::ExtractBindings::recipe_origin` |
| 1 | 0.1% | `module_graph::graph::ModuleGraph<L>::ensure` |
| 1 | 0.1% | `atomic::extract::bindings::ExtractBindings::css_origin` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 29wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 16 | 1.3% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 4 | 0.3% | `atomic::extract::extract_with_context` |
| 2 | 0.2% | `canon::dialect::resolve_alias` |
| 1 | 0.1% | `std::path::Path::_join` |
| 1 | 0.1% | `atomic::diagnostics::analysis::analyze` |
| 1 | 0.1% | `atomic::extract::scope::lookup::Scoped::mutation` |
| 1 | 0.1% | `canon::css::find_property` |
| 1 | 0.1% | `canon::css::unrealizable::is_unrealizable_extension` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 14wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `styletrace::analysis::surface::trace_style_bindings_with_surface` |
| 3 | 0.2% | `module_graph::record::collect::insert_var_names` |
| 2 | 0.2% | `module_graph::record::ExportTable::insert_local` |
| 1 | 0.1% | `module_graph::record::collect::statement` |
| 1 | 0.1% | `std::sync::once::Once::call_once_force::{{closure}}` |
| 1 | 0.1% | `atomic::runtime::serializer::canonical_json_value` |

## Malloc-family leaves by nearest atomic/canon ancestor

216wt of malloc-family leaves; 3wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 29 | 2.4% | `atomic::resolve::resolve_want_with` |
| 16 | 1.3% | `atomic::assembly::AssembleCtx::finish` |
| 14 | 1.1% | `atomic::compile` |
| 8 | 0.7% | `module_graph::key::normalize_str` |
| 7 | 0.6% | `atomic::resolve::authored_key` |
| 5 | 0.4% | `atomic::sources::collect` |
| 5 | 0.4% | `atomic::resolve::tokens::format_entry` |
| 5 | 0.4% | `atomic::runtime::serializer::serialize_lookup_key` |
| 4 | 0.3% | `atomic::includes::trim_slashes` |
| 4 | 0.3% | `atomic::extract::identity::normalize_path` |
| 4 | 0.3% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 4 | 0.3% | `atomic::atom::want::Want::with_origin` |
| 4 | 0.3% | `atomic::extract::expressions::object::walk_style_object` |
| 4 | 0.3% | `module_graph::ladder::SpecifierLadder<F>::resolve` |
| 4 | 0.3% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 4 | 0.3% | `atomic::atom::set::AtomSet::insert` |
| 4 | 0.3% | `atomic::runtime::serializer::canonical_json_value` |
| 3 | 0.2% | `module_graph::record::ExportTable::insert_local` |

## memmove leaves by nearest .node ancestor

53wt of memmove leaves; 23wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.3% | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 3 | 0.2% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 3 | 0.2% | `atomic::compile` |
| 3 | 0.2% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 2 | 0.2% | `atomic::diagnostics::analysis::analyze` |
| 2 | 0.2% | `atomic::extract::extract_with_context` |
| 2 | 0.2% | `napi::bindgen_runtime::js_values::string::<impl napi::bindgen_runtime::js_values::ToNapiValue for &alloc::string::String>::to_napi_value` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::next` |
| 1 | 0.1% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 1 | 0.1% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 1 | 0.1% | `atomic::extract::scope::table::ScopeTable::declare` |
| 1 | 0.1% | `atomic::resolve::resolve_want_with` |
| 1 | 0.1% | `atomic::atom::set::AtomSet::insert` |
| 1 | 0.1% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |

## memcmp leaves by nearest .node ancestor

32wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 10 | 0.8% | `canon::css::find_property` |
| 4 | 0.3% | `canon::dialect::resolve_alias` |
| 3 | 0.2% | `atomic::diagnostics::proof::render::render_with` |
| 2 | 0.2% | `atomic::extract::constants::index::LocalConstants::merge` |
| 2 | 0.2% | `module_graph::ladder::memo::cached` |
| 2 | 0.2% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 1 | 0.1% | `std::path::compare_components` |
| 1 | 0.1% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 1 | 0.1% | `atomic::extract::resolver::ValueGraph::value_of` |
| 1 | 0.1% | `canon::css::is_color_prop` |
| 1 | 0.1% | `base_system::condition_map::ConditionMap::get` |
| 1 | 0.1% | `atomic::resolve::rhythm::resolve_rhythm` |
| 1 | 0.1% | `canon::css::unrealizable::is_unrealizable_extension` |
| 1 | 0.1% | `atomic::stylesheet::cascade::CascadeKey::from_atom_cached` |

## File opens by issuing frame

243wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 243 | 19.8% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

653wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 606 | 49.4% | `reference_virtual_native::atomic::__napi__compile_system → atomic::compile` |
| 242 | 19.7% | `atomic::compile → atomic::assembly::AssembleCtx::finish` |
| 71 | 5.8% | `atomic::assembly::AssembleCtx::finish → atomic::runtime::builder::PlanBuilder::build_keyed` |
| 62 | 5.1% | `oxc_ast_visit::generated::visit::walk::walk_function → oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 57 | 4.6% | `atomic::assembly::AssembleCtx::finish → atomic::resolve::resolve_want_with` |
| 57 | 4.6% | `atomic::runtime::builder::PlanBuilder::build_keyed → atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 54 | 4.4% | `atomic::compile → atomic::extract::extract_with_context` |
| 48 | 3.9% | `oxc_ast_visit::generated::visit::walk::walk_declaration → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 48 | 3.9% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 44 | 3.6% | `atomic::runtime::builder::PlanBuilder::resolve_entry → atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 44 | 3.6% | `atomic::runtime::builder::resolve_with_unique_diagnostics → atomic::resolve::resolve_want_with` |
| 40 | 3.3% | `atomic::assembly::AssembleCtx::finish → atomic::stylesheet::emitter::build_stylesheets_with` |
| 36 | 2.9% | `atomic::compile → atomic::sources::collect` |
| 34 | 2.8% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 34 | 2.8% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 34 | 2.8% | `atomic::compile → atomic::extract::resolver::ValueGraph::resolve_file_imports` |
| 33 | 2.7% | `atomic::compile → atomic::hosts::resolve` |
| 33 | 2.7% | `atomic::extract::extract_with_context → oxc_ast_visit::generated::visit::walk::walk_function` |
| 32 | 2.6% | `atomic::extract::resolver::ValueGraph::resolve_file_imports → <hashbrown::map::HashMap<K,V,S,A> as core::iter::traits::collect::Extend<(K,V)>>::extend` |
| 30 | 2.4% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression → atomic::extract::css::extract` |
| 29 | 2.4% | `atomic::stylesheet::emitter::build_stylesheets_with → atomic::stylesheet::cascade::write_utilities` |
| 28 | 2.3% | `atomic::extract::css::extract → atomic::extract::css::handle_css_arg` |
| 27 | 2.2% | `atomic::compile → <alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 27 | 2.2% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter → <core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 27 | 2.2% | `oxc_ast_visit::generated::visit::walk::walk_expression → oxc_ast_visit::generated::visit::walk::walk_expression` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 29 | 21 | 72% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 14 | 3 | 21% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 25 | 2 | 8% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 10 | 2 | 20% | `canon::dialect::resolve_alias` |
| 28 | 1 | 4% | `canon::css::find_property` |
| 29 | 0 | 0% | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 17 | 0 | 0% | `std::path::compare_components` |
| 11 | 0 | 0% | `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write` |
| 9 | 0 | 0% | `<std::path::Components as core::iter::traits::iterator::Iterator>::next` |
| 9 | 0 | 0% | `canon::css::values::lengths::is_length` |
| 20 | 0 | 0% | `core::hash::BuildHasher::hash_one` |
| 6 | 0 | 0% | `canon::css::values::named_colors::is_named_color` |
| 8 | 0 | 0% | `canon::css::is_color_prop` |
| 4 | 0 | 0% | `atomic::includes::glob::match_from` |
| 8 | 0 | 0% | `oxc_parser::lexer::Lexer::next_token` |
