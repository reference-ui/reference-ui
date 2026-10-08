# Caller attribution: enterprise (a4429aa52ba8)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `../../../../../../../tmp/swarm-reflame7/enterprise-repro7a`.
Derived 2026-09-22T15:08:22.453Z via `pnpm agentrs flame --callers /tmp/swarm-reflame7/enterprise-repro7a`; no re-record, bundle raws untouched.
Covers 1051 weight across 1027 main-thread samples. Shares below are of that weight unless noted.


## Callers of `__open`

Inclusive 250wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 250 | 23.8% | `open` |

## Callers of `nanov2_malloc_type`

Inclusive 67wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 1.0% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 8 | 0.8% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 7 | 0.7% | `<alloc::string::String as core::clone::Clone>::clone` |
| 4 | 0.4% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 4 | 0.4% | `atomic::runtime::serializer::serialize_lookup_key` |
| 3 | 0.3% | `atomic::extract::expressions::ast_value::ast_to_json_value` |
| 3 | 0.3% | `atomic::resolve::tokens::resolve_token_value` |
| 2 | 0.2% | `module_graph::record::ExportTable::insert_local` |

## Callers of `_platform_memmove$VARIANT$Haswell`

Inclusive 46wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.6% | `szone_realloc` |
| 3 | 0.3% | `v8::internal::LiteralBuffer::ExpandBuffer()` |
| 3 | 0.3% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 0.3% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.3% | `atomic::diagnostics::analysis::analyze` |
| 2 | 0.2% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 2 | 0.2% | `atomic::compile` |
| 2 | 0.2% | `<alloc::string::String as core::fmt::Write>::write_str` |

## Callers of `_nanov2_free`

Inclusive 47wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `core::ptr::drop_in_place<atomic::atom::want::Want>` |
| 3 | 0.3% | `nanov2_realloc` |
| 3 | 0.3% | `core::ptr::drop_in_place<atomic::atom::when::When>` |
| 2 | 0.2% | `atomic::scan::scan` |
| 2 | 0.2% | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::marker::Dying,K,V,NodeType>,alloc::collections::btree::node::marker::KV>::drop_key_val` |
| 2 | 0.2% | `atomic::resolve::resolve_want_with` |
| 2 | 0.2% | `atomic::assembly::AssembleCtx::finish` |
| 2 | 0.2% | `core::ptr::drop_in_place<atomic::diagnostics::proof::render::Proof>` |

## Callers of `kevent`

Inclusive 40wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 40 | 3.8% | `uv__io_poll` |

## Callers of `madvise`

Inclusive 31wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 31 | 2.9% | `mvm_madvise_plat` |

## Callers of `read`

Inclusive 24wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 21 | 2.0% | `<std::fs::File as std::io::Read>::read` |
| 3 | 0.3% | `uv__fs_work` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 23wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 2 | 0.2% | `0x7ff7b1ba605f` |
| 2 | 0.2% | `0x7ff7b1ba629f` |
| 2 | 0.2% | `0x7ff7b1ba5b5f` |
| 1 | 0.1% | `0x7ff7b1ba8f6f` |
| 1 | 0.1% | `0x7ff7b1ba693f` |
| 1 | 0.1% | `0x7ff7b1ba6b3f` |
| 1 | 0.1% | `canon::css::find_property` |
| 1 | 0.1% | `0x7ff7b1ba76af` |

## Callers of `__getdirentries64`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 12 | 1.1% | `_readdir_unlocked$INODE64` |

## Callers of `__write_nocancel`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 1.0% | `_swrite` |

## Callers of `stat$INODE64`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.8% | `std::path::Path::is_file` |
| 2 | 0.2% | `uv__fs_work` |
| 1 | 0.1% | `std::sys::fs::metadata` |

## Callers of `__close_nocancel`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.8% | `atomic::scan::scan` |
| 3 | 0.3% | `uv__fs_work` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_expression`

Inclusive 23wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 15 | 1.4% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 3 | 0.3% | `<atomic::extract::constants::collect::ConstCollector as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 2 | 0.2% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 1 | 0.1% | `<atomic::extract::scope::call_init::CallInitPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `atomic::extract::harvest::literals::collect_pool` |

## Callers of `canon::css::find_property`

Inclusive 17wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 12 | 1.1% | `canon::is_known_style_prop` |
| 2 | 0.2% | `atomic::resolve::shorthands::expand_shorthand` |
| 2 | 0.2% | `canon::to_css_declaration_property` |
| 1 | 0.1% | `canon::class_prefix_for_prop` |

## Callers of `canon::css::values::lengths::is_length`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 7 | 0.7% | `canon::css::values::classify::classify_css_value` |
| 4 | 0.4% | `atomic::extract::harvest::classify::classify_harvest_value` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `module_graph::record::collect::insert_var_names` |
| 4 | 0.4% | `module_graph::record::ExportTable::insert_local` |
| 2 | 0.2% | `styletrace::analysis::surface::trace_style_bindings_with_surface` |
| 1 | 0.1% | `atomic::extract::scope::table::ScopeTable::declare` |
| 1 | 0.1% | `oxc_ast_visit::generated::visit::walk::walk_expression` |

## Callers of `core::hash::BuildHasher::hash_one`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 2 | 0.2% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 2 | 0.2% | `atomic::diagnostics::proof::render::Proof::collect` |
| 1 | 0.1% | `atomic::extract::resolver::staging::StagingPlan::stages` |
| 1 | 0.1% | `<atomic::extract::resolver::source::AtomicFs as module_graph::fs::FileSystem>::read_to_string` |
| 1 | 0.1% | `atomic::extract::expressions::ast_value::ast_to_json_value` |
| 1 | 0.1% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 1 | 0.1% | `<indexmap::map::IndexMap<K,V,S> as core::iter::traits::collect::FromIterator<(K,V)>>::from_iter` |

## Callers of `canon::dialect::resolve_alias`

Inclusive 7wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.4% | `canon::css::is_color_prop` |
| 2 | 0.2% | `canon::resolve_canonical_prop` |
| 1 | 0.1% | `canon::is_known_style_prop` |

## Callers of `hashbrown::map::HashMap<K,V,S,A>::insert`

Inclusive 21wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.8% | `atomic::assembly::AssembleCtx::finish` |
| 5 | 0.5% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 2 | 0.2% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 1 | 0.1% | `atomic::extract::resolver::staging::StagingPlan::census` |
| 1 | 0.1% | `atomic::extract::resolver::ValueGraph::new` |
| 1 | 0.1% | `atomic::compile` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 1 | 0.1% | `atomic::extract::resolver::ValueGraph::resolve_binding` |

## Callers of `core::slice::memchr::memchr_aligned`

Inclusive 5wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 1 | 0.1% | `atomic::streaming_candidate` |
| 1 | 0.1% | `atomic::hosts::entries::trace_skip` |
| 1 | 0.1% | `atomic::diagnostics::analysis::analyze` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 1 | 0.1% | `atomic::resolve::conditions::pseudoselectors::nesting::nest` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 26wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 10 | 1.0% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 5 | 0.5% | `atomic::extract::extract_with_context` |
| 3 | 0.3% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 2 | 0.2% | `atomic::diagnostics::analysis::analyze` |
| 2 | 0.2% | `module_graph::ladder::SpecifierLadder<F>::resolve` |
| 1 | 0.1% | `styletrace::analysis::parser::pipeline::util::is_direct_style_pipeline_call` |
| 1 | 0.1% | `canon::css::is_color_prop` |
| 1 | 0.1% | `canon::css::find_property` |

## Callers of `canon::css::values::named_colors::is_named_color`

Inclusive 5wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.5% | `canon::css::values::classify::classify_css_value` |

## Malloc-family leaves by nearest atomic/canon ancestor

156wt of malloc-family leaves; 5wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 20 | 1.9% | `atomic::assembly::AssembleCtx::finish` |
| 12 | 1.1% | `atomic::compile` |
| 8 | 0.8% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 8 | 0.8% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 5 | 0.5% | `atomic::resolve::resolve_want_with` |
| 5 | 0.5% | `atomic::runtime::serializer::serialize_lookup_key` |
| 4 | 0.4% | `atomic::scan::scan` |
| 4 | 0.4% | `atomic::scan::resolve_segments` |
| 4 | 0.4% | `atomic::extract::expressions::ast_value::ast_to_json_value` |
| 3 | 0.3% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 3 | 0.3% | `module_graph::ladder::SpecifierLadder<F>::resolve` |
| 3 | 0.3% | `atomic::resolve::tokens::resolve_token_value` |
| 3 | 0.3% | `atomic::resolve::conditions::lower_when` |
| 3 | 0.3% | `atomic::resolve::tokens::format_entry` |
| 3 | 0.3% | `reference_virtual_native::atomic::__napi__compile_system` |
| 2 | 0.2% | `module_graph::record::ExportTable::insert_local` |
| 2 | 0.2% | `atomic::extract::resolver::staging::StagingPlan::census` |
| 2 | 0.2% | `atomic::diagnostics::analysis::structured::responsive_object_value` |

## memmove leaves by nearest .node ancestor

46wt of memmove leaves; 9wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.6% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 3 | 0.3% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 0.3% | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 0.3% | `atomic::diagnostics::analysis::analyze` |
| 2 | 0.2% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 2 | 0.2% | `atomic::compile` |
| 2 | 0.2% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 1 | 0.1% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 1 | 0.1% | `atomic::scan::scan` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::next` |
| 1 | 0.1% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |
| 1 | 0.1% | `atomic::stream::merge_constants_ordered` |
| 1 | 0.1% | `module_graph::record::ModuleRecord::collect` |
| 1 | 0.1% | `module_graph::graph::ModuleGraph<L>::ensure` |

## memcmp leaves by nearest .node ancestor

23wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.6% | `canon::css::find_property` |
| 6 | 0.6% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 2 | 0.2% | `canon::css::is_color_prop` |
| 1 | 0.1% | `atomic::scan::scan` |
| 1 | 0.1% | `atomic::extract::harvest::literals::collect_pool` |
| 1 | 0.1% | `atomic::resolve::resolve_want_with` |
| 1 | 0.1% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 1 | 0.1% | `base_system::tokens::TokenDictionary::get_in_category` |
| 1 | 0.1% | `canon::is_known_style_prop` |
| 1 | 0.1% | `canon::css::unrealizable::is_unrealizable_extension` |
| 1 | 0.1% | `core::slice::sort::stable::quicksort::quicksort` |
| 1 | 0.1% | `atomic::stylesheet::cascade::CascadeKey::from_atom_cached` |

## File opens by issuing frame

250wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 246 | 23.4% | `std::sys::fs::unix::File::open_c [virtual-native.darwin-x64.node]` |
| 4 | 0.4% | `uv__fs_work [node]` |

## Callees: hottest deduped native edges

488wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 470 | 44.7% | `reference_virtual_native::atomic::__napi__compile_system → atomic::compile` |
| 189 | 18.0% | `atomic::compile → atomic::assembly::AssembleCtx::finish` |
| 57 | 5.4% | `atomic::assembly::AssembleCtx::finish → atomic::runtime::builder::PlanBuilder::build_keyed` |
| 52 | 4.9% | `atomic::compile → atomic::extract::extract_with_context` |
| 50 | 4.8% | `oxc_ast_visit::generated::visit::walk::walk_function → oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 44 | 4.2% | `oxc_ast_visit::generated::visit::walk::walk_declaration → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 43 | 4.1% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 38 | 3.6% | `atomic::assembly::AssembleCtx::finish → atomic::resolve::resolve_want_with` |
| 37 | 3.5% | `atomic::runtime::builder::PlanBuilder::build_keyed → atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 35 | 3.3% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 35 | 3.3% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 32 | 3.0% | `atomic::compile → atomic::stream::merge_constants_ordered` |
| 32 | 3.0% | `atomic::compile → atomic::hosts::resolve` |
| 31 | 2.9% | `atomic::assembly::AssembleCtx::finish → atomic::stylesheet::emitter::build_stylesheets_with` |
| 30 | 2.9% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration` |
| 30 | 2.9% | `atomic::resolve::resolve_want_with → atomic::resolve::tokens::resolve_token_value` |
| 29 | 2.8% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration` |
| 29 | 2.8% | `atomic::extract::extract_with_context → oxc_ast_visit::generated::visit::walk::walk_function` |
| 28 | 2.7% | `atomic::compile → <alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 28 | 2.7% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration → oxc_parser::ts::statement::<impl oxc_parser::ParserImpl>::parse_declaration` |
| 27 | 2.6% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter → <core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 26 | 2.5% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression → atomic::extract::css::extract` |
| 26 | 2.5% | `atomic::extract::css::extract → atomic::extract::css::handle_css_arg` |
| 25 | 2.4% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold → oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 25 | 2.4% | `atomic::extract::css::handle_css_arg → atomic::extract::expressions::object::walk_style_object` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 69 | 22 | 32% | `atomic::resolve::resolve_want_with` |
| 26 | 21 | 81% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 21 | 4 | 19% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 23 | 3 | 13% | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 12 | 3 | 25% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 16 | 2 | 13% | `core::ops::function::FnMut::call_mut` |
| 17 | 1 | 6% | `canon::css::find_property` |
| 11 | 0 | 0% | `canon::css::values::lengths::is_length` |
| 9 | 0 | 0% | `core::hash::BuildHasher::hash_one` |
| 7 | 0 | 0% | `canon::dialect::resolve_alias` |
| 5 | 0 | 0% | `core::slice::memchr::memchr_aligned` |
| 5 | 0 | 0% | `canon::css::values::named_colors::is_named_color` |
| 5 | 0 | 0% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 4 | 0 | 0% | `atomic::atom::decl::Atom::new` |
| 4 | 0 | 0% | `<std::path::Components as core::iter::traits::double_ended::DoubleEndedIterator>::next_back` |
