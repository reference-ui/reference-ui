# Caller attribution: enterprise (6f4cf1ba392f)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `../../../../../../../tmp/swarm-repro3-flame/enterprise-repro4b`.
Derived 2026-09-22T08:44:44.476Z via `pnpm agentrs flame --callers /tmp/swarm-repro3-flame/enterprise-repro4b --out /tmp/swarm-repro3-flame/enterprise-repro4b`; no re-record, bundle raws untouched.
Covers 1106 weight across 1085 main-thread samples. Shares below are of that weight unless noted.


## Callers of `__open`

Inclusive 237wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 237 | 21.4% | `open` |

## Callers of `_platform_memmove$VARIANT$Haswell`

Inclusive 61wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `<alloc::string::String as core::clone::Clone>::clone` |
| 5 | 0.5% | `atomic::compile` |
| 5 | 0.5% | `szone_realloc` |
| 4 | 0.4% | `v8::internal::JsonStringifier::Extend()` |
| 4 | 0.4% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 0.3% | `v8::internal::LiteralBuffer::ExpandBuffer()` |
| 3 | 0.3% | `v8::internal::FactoryBase<v8::internal::Factory>::NewStringFromOneByte(v8::base::Vector<unsigned char const>, v8::internal::AllocationType)` |
| 3 | 0.3% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |

## Callers of `nanov2_malloc_type`

Inclusive 68wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.7% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 8 | 0.7% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 8 | 0.7% | `<alloc::string::String as core::clone::Clone>::clone` |
| 4 | 0.4% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 4 | 0.4% | `hashbrown::raw::RawTableInner::fallible_with_capacity` |
| 4 | 0.4% | `atomic::runtime::serializer::serialize_lookup_key` |
| 3 | 0.3% | `operator new(unsigned long)` |
| 3 | 0.3% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |

## Callers of `madvise`

Inclusive 41wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 41 | 3.7% | `mvm_madvise_plat` |

## Callers of `_nanov2_free`

Inclusive 41wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `<alloc::vec::Vec<T,A> as core::ops::drop::Drop>::drop` |
| 3 | 0.3% | `atomic::extract::expressions::object::walk_style_object` |
| 3 | 0.3% | `atomic::compile` |
| 3 | 0.3% | `core::ptr::drop_in_place<atomic::atom::decl::Atom>` |
| 3 | 0.3% | `core::ptr::drop_in_place<atomic::atom::want::Want>` |
| 2 | 0.2% | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::ops::drop::Drop>::drop` |
| 2 | 0.2% | `atomic::resolve::resolve_want_with` |
| 2 | 0.2% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |

## Callers of `kevent`

Inclusive 37wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 37 | 3.3% | `uv__io_poll` |

## Callers of `read`

Inclusive 36wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 36 | 3.3% | `uv__fs_work` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 34wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `0x7ff7b3cb66bf` |
| 2 | 0.2% | `0x7ff7b3cb5d7f` |
| 2 | 0.2% | `0x7ff7b3cb605f` |
| 2 | 0.2% | `0x7ff7b3cb657f` |
| 2 | 0.2% | `0x7ff7b3cb642f` |
| 1 | 0.1% | `0x7ff7b3cb594f` |
| 1 | 0.1% | `0x7ff7b3cb598f` |
| 1 | 0.1% | `0x7ff7b3cb5d9f` |

## Callers of `__write_nocancel`

Inclusive 16wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 16 | 1.4% | `_swrite` |

## Callers of `__getdirentries64`

Inclusive 14wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 14 | 1.3% | `_readdir_unlocked$INODE64` |

## Callers of `stat$INODE64`

Inclusive 13wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.7% | `std::path::Path::is_file` |
| 3 | 0.3% | `uv__fs_work` |
| 1 | 0.1% | `__getcwd` |
| 1 | 0.1% | `std::sys::fs::metadata` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_expression`

Inclusive 27wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 19 | 1.7% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 3 | 0.3% | `<atomic::extract::constants::collect::ConstCollector as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 2 | 0.2% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 1 | 0.1% | `<atomic::diagnostics::analysis::css::CssVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::extract::scope::call_init::CallInitPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |

## Callers of `core::hash::BuildHasher::hash_one`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 3 | 0.3% | `atomic::diagnostics::proof::render::Proof::collect` |
| 2 | 0.2% | `hashbrown::rustc_entry::<impl hashbrown::map::HashMap<K,V,S,A>>::rustc_entry` |
| 1 | 0.1% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |

## Callers of `canon::css::values::lengths::is_length`

Inclusive 8wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `atomic::extract::harvest::classify::classify_harvest_value` |
| 4 | 0.4% | `canon::css::values::classify::classify_css_value` |

## Callers of `std::path::compare_components`

Inclusive 8wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 3 | 0.3% | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |

## Callers of `canon::css::find_property`

Inclusive 16wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 13 | 1.2% | `canon::is_known_style_prop` |
| 2 | 0.2% | `atomic::resolve::shorthands::expand_shorthand` |
| 1 | 0.1% | `canon::to_css_declaration_property` |

## Callers of `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter`

Inclusive 73wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 38 | 3.4% | `atomic::compile` |
| 10 | 0.9% | `atomic::sources::sorted_entries` |
| 9 | 0.8% | `atomic::hosts::resolve` |
| 4 | 0.4% | `atomic::extract::resolver::ValueGraph::new` |
| 3 | 0.3% | `atomic::sources::collect` |
| 3 | 0.3% | `atomic::extract::expressions::object::walk_style_object` |
| 3 | 0.3% | `atomic::stylesheet::cascade::write_utilities` |
| 1 | 0.1% | `module_graph::record::ExportTable::hop_specifiers` |

## Callers of `oxc_allocator::bump::Bump::alloc_layout_slow`

Inclusive 6wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_import_specifiers` |

## Callers of `hashbrown::map::HashMap<K,V,S,A>::insert`

Inclusive 24wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.6% | `atomic::compile` |
| 6 | 0.5% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 2 | 0.2% | `atomic::extract::resolver::ValueGraph::new` |
| 2 | 0.2% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 2 | 0.2% | `atomic::diagnostics::proof::render::Proof::collect` |
| 1 | 0.1% | `atomic::sources::collect` |
| 1 | 0.1% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_formal_parameters` |
| 1 | 0.1% | `atomic::extract::resolver::ValueGraph::resolve_binding` |

## Callers of `oxc_parser::module_record::ModuleRecordBuilder::add_module_request`

Inclusive 5wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `oxc_parser::module_record::ModuleRecordBuilder::visit_import_declaration` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `styletrace::analysis::surface::trace_style_bindings_with_surface` |
| 3 | 0.3% | `module_graph::record::collect::insert_var_names` |
| 3 | 0.3% | `module_graph::record::ExportTable::insert_local` |

## Malloc-family leaves by nearest atomic/canon ancestor

137wt of malloc-family leaves; 6wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 24 | 2.2% | `atomic::compile` |
| 9 | 0.8% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 7 | 0.6% | `atomic::resolve::resolve_want_with` |
| 6 | 0.5% | `atomic::extract::expressions::object::walk_style_object` |
| 5 | 0.5% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 5 | 0.5% | `atomic::extract::expressions::ast_value::ast_to_json_value` |
| 5 | 0.5% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 5 | 0.5% | `atomic::runtime::serializer::serialize_lookup_key` |
| 3 | 0.3% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 3 | 0.3% | `atomic::extract::expressions::literal::push_string_want` |
| 3 | 0.3% | `atomic::extract::identity::IdentityGraph::resolve` |
| 3 | 0.3% | `atomic::resolve::conditions::lower_when` |
| 2 | 0.2% | `atomic::extract::constants::collect::literal_leaf` |
| 2 | 0.2% | `atomic::extract::resolver::ValueGraph::new` |
| 2 | 0.2% | `styletrace::analysis::parser::component::factory_from_function_declaration` |
| 2 | 0.2% | `atomic::diagnostics::analysis::values::classify_value` |
| 2 | 0.2% | `atomic::diagnostics::analysis::structured::responsive_object_value` |
| 2 | 0.2% | `atomic::extract::fold::key::fold_property_key` |

## memmove leaves by nearest .node ancestor

61wt of memmove leaves; 15wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `<alloc::string::String as core::clone::Clone>::clone` |
| 5 | 0.5% | `atomic::compile` |
| 5 | 0.5% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 4 | 0.4% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 0.3% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 3 | 0.3% | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 2 | 0.2% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 2 | 0.2% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 2 | 0.2% | `atomic::extract::extract_with_context` |
| 1 | 0.1% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 1 | 0.1% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |
| 1 | 0.1% | `oxc_parser::module_record::ModuleRecordBuilder::build` |
| 1 | 0.1% | `atomic::atom::want::Want::with_origin` |
| 1 | 0.1% | `module_graph::ladder::SpecifierLadder<F>::package_hit` |

## memcmp leaves by nearest .node ancestor

34wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.7% | `canon::css::find_property` |
| 6 | 0.5% | `atomic::extract::constants::index::LocalConstants::merge` |
| 4 | 0.4% | `canon::dialect::resolve_alias` |
| 4 | 0.4% | `canon::css::is_color_prop` |
| 2 | 0.2% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 2 | 0.2% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 1 | 0.1% | `atomic::extract::resolver::ValueGraph::resolve_binding` |
| 1 | 0.1% | `<atomic::extract::resolver::source::AtomicFs as module_graph::fs::FileSystem>::is_dir` |
| 1 | 0.1% | `atomic::extract::expressions::object::condition::is_condition_key` |
| 1 | 0.1% | `atomic::extract::scope::collect::clear::clear_unbound_calls` |
| 1 | 0.1% | `atomic::resolve::conditions::lower_when` |
| 1 | 0.1% | `core::slice::sort::stable::quicksort::quicksort` |
| 1 | 0.1% | `atomic::stylesheet::cascade::CascadeKey::from_atom_cached` |
| 1 | 0.1% | `<atomic::diagnostics::proof::memo::MemoKey as core::cmp::PartialEq>::eq` |

## File opens by issuing frame

237wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 237 | 21.4% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

518wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 476 | 43.0% | `reference_virtual_native::atomic::__napi__compile_system → atomic::compile` |
| 59 | 5.3% | `oxc_ast_visit::generated::visit::walk::walk_function → oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 56 | 5.1% | `atomic::compile → atomic::extract::extract_with_context` |
| 55 | 5.0% | `atomic::compile → atomic::runtime::builder::PlanBuilder::build_keyed` |
| 47 | 4.2% | `oxc_ast_visit::generated::visit::walk::walk_declaration → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 46 | 4.2% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 39 | 3.5% | `atomic::compile → atomic::resolve::resolve_want_with` |
| 38 | 3.4% | `atomic::compile → <alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 37 | 3.3% | `atomic::runtime::builder::PlanBuilder::build_keyed → atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 33 | 3.0% | `atomic::extract::extract_with_context → oxc_ast_visit::generated::visit::walk::walk_function` |
| 32 | 2.9% | `atomic::compile → atomic::stylesheet::emitter::build_stylesheets_with` |
| 31 | 2.8% | `atomic::compile → atomic::hosts::resolve` |
| 31 | 2.8% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression → atomic::extract::css::extract` |
| 31 | 2.8% | `atomic::extract::css::extract → atomic::extract::css::handle_css_arg` |
| 31 | 2.8% | `atomic::extract::css::handle_css_arg → atomic::extract::expressions::object::walk_style_object` |
| 25 | 2.3% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter → <core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 25 | 2.3% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 25 | 2.3% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 25 | 2.3% | `oxc_ast_visit::generated::visit::walk::walk_expression → oxc_ast_visit::generated::visit::walk::walk_expression` |
| 23 | 2.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold → oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 22 | 2.0% | `atomic::stylesheet::emitter::build_stylesheets_with → atomic::stylesheet::cascade::write_utilities` |
| 21 | 1.9% | `atomic::runtime::builder::PlanBuilder::resolve_entry → atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 21 | 1.9% | `atomic::runtime::builder::resolve_with_unique_diagnostics → atomic::resolve::resolve_want_with` |
| 20 | 1.8% | `atomic::compile → atomic::sources::collect` |
| 20 | 1.8% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle → alloc::raw_vec::RawVecInner<A>::finish_grow` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 73 | 19 | 26% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 11 | 7 | 64% | `indexmap::inner::Core<K,V>::insert_full` |
| 24 | 6 | 25% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 12 | 4 | 33% | `core::slice::sort::stable::quicksort::quicksort` |
| 27 | 2 | 7% | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 6 | 2 | 33% | `alloc::collections::btree::map::entry::Entry<K,V,A>::or_default` |
| 16 | 1 | 6% | `canon::css::find_property` |
| 12 | 1 | 8% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 9 | 0 | 0% | `core::hash::BuildHasher::hash_one` |
| 8 | 0 | 0% | `canon::css::values::lengths::is_length` |
| 8 | 0 | 0% | `std::path::compare_components` |
| 6 | 0 | 0% | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 5 | 0 | 0% | `oxc_parser::module_record::ModuleRecordBuilder::add_module_request` |
| 4 | 0 | 0% | `atomic::includes::glob::match_from` |
| 4 | 0 | 0% | `canon::css::values::named_colors::is_named_color` |
