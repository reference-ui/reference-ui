# Caller attribution: enterprise (3dd32a659715)

Procedure: `agentrs-flame-callers/1` over `agentrs-flame/3` raws in `../../../../../../../tmp/swarm-repro2-flame/enterprise-repro3a`.
Derived 2026-09-22T02:04:09.004Z via `pnpm agentrs flame --callers /tmp/swarm-repro2-flame/enterprise-repro3a --out /tmp/swarm-repro2-flame/enterprise-repro3a`; no re-record, bundle raws untouched.
Covers 1151 weight across 1133 main-thread samples. Shares below are of that weight unless noted.


## Callers of `__open`

Inclusive 245wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 245 | 21.3% | `open` |

## Callers of `nanov2_malloc_type`

Inclusive 87wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 15 | 1.3% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 9 | 0.8% | `<alloc::string::String as core::clone::Clone>::clone` |
| 6 | 0.5% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 4 | 0.3% | `module_graph::key::normalize_str` |
| 4 | 0.3% | `atomic::resolve::authored_key` |
| 4 | 0.3% | `atomic::resolve::resolve_want_with` |
| 3 | 0.3% | `alloc::str::join_generic_copy` |
| 3 | 0.3% | `module_graph::ladder::join_with` |

## Callers of `_nanov2_free`

Inclusive 57wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `core::ptr::drop_in_place<atomic::atom::want::Want>` |
| 4 | 0.3% | `<hashbrown::raw::RawTable<T,A> as core::ops::drop::Drop>::drop` |
| 4 | 0.3% | `core::ptr::drop_in_place<atomic::diagnostics::facts::OwnedLookupKey>` |
| 4 | 0.3% | `<smallvec::SmallVec<A> as core::ops::drop::Drop>::drop` |
| 3 | 0.3% | `atomic::assembly::AssembleCtx::finish` |
| 3 | 0.3% | `atomic::resolve::resolve_want_with` |
| 3 | 0.3% | `core::ptr::drop_in_place<atomic::atom::when::When>` |
| 2 | 0.2% | `uv_fs_scandir_next` |

## Callers of `_platform_memmove$VARIANT$Haswell`

Inclusive 51wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `atomic::extract::extract_with_context` |
| 4 | 0.3% | `v8::internal::JsonStringifier::Extend()` |
| 4 | 0.3% | `atomic::compile` |
| 3 | 0.3% | `v8::internal::FactoryBase<v8::internal::Factory>::NewStringFromOneByte(v8::base::Vector<unsigned char const>, v8::internal::AllocationType)` |
| 3 | 0.3% | `atomic::diagnostics::analysis::analyze` |
| 2 | 0.2% | `v8::internal::String::WriteToFlat2<unsigned char>(unsigned char*, v8::internal::Tagged<v8::internal::ConsString>, unsigned int, unsigned int, v8::internal::SharedStringAccessGuardIfNeeded const&, v8::internal::PerThreadAssertScopeEmpty<false, (v8::internal::PerThreadAssertType)1, (v8::internal::PerThreadAssertType)2> const&)` |
| 2 | 0.2% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |
| 2 | 0.2% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |

## Callers of `madvise`

Inclusive 39wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 39 | 3.4% | `mvm_madvise_plat` |

## Callers of `kevent`

Inclusive 36wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 36 | 3.1% | `uv__io_poll` |

## Callers of `read`

Inclusive 31wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 31 | 2.7% | `uv__fs_work` |

## Callers of `_platform_memcmp$VARIANT$Base`

Inclusive 29wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 2 | 0.2% | `0x7ff7b42dd6ef` |
| 2 | 0.2% | `0x7ff7b42dcdef` |
| 2 | 0.2% | `canon::dialect::resolve_alias` |
| 2 | 0.2% | `0x7ff7b42dc97f` |
| 2 | 0.2% | `0x7ff7b42dbbcf` |
| 1 | 0.1% | `core::slice::sort::unstable::ipnsort` |
| 1 | 0.1% | `0x7ff7b42dcdaf` |
| 1 | 0.1% | `0x7ff7b42dcacf` |

## Callers of `oxc_ast_visit::generated::visit::walk::walk_expression`

Inclusive 27wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 15 | 1.3% | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 4 | 0.3% | `<atomic::extract::constants::collect::ConstCollector as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 3 | 0.3% | `<atomic::diagnostics::analysis::css::CssVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 2 | 0.2% | `<atomic::extract::fold::fence_attach::AttachPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 0.1% | `<atomic::extract::scope::call_init::CallInitPass as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 0.1% | `oxc_ast_visit::generated::visit::walk::walk_function` |

## Callers of `__write_nocancel`

Inclusive 14wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 14 | 1.2% | `_swrite` |

## Callers of `__close_nocancel`

Inclusive 14wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 14 | 1.2% | `uv__fs_work` |

## Callers of `__getdirentries64`

Inclusive 11wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 11 | 1.0% | `_readdir_unlocked$INODE64` |

## Callers of `alloc::collections::btree::map::BTreeMap<K,V,A>::insert`

Inclusive 19wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.7% | `module_graph::record::ExportTable::insert_local` |
| 4 | 0.3% | `styletrace::analysis::surface::trace_style_bindings_with_surface` |
| 4 | 0.3% | `atomic::runtime::serializer::canonical_json_value` |
| 2 | 0.2% | `module_graph::record::collect::insert_var_names` |
| 1 | 0.1% | `atomic::extract::scope::table::ScopeTable::declare` |

## Callers of `hashbrown::map::HashMap<K,V,S,A>::insert`

Inclusive 27wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.8% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 4 | 0.3% | `atomic::assembly::AssembleCtx::finish` |
| 3 | 0.3% | `atomic::extract::harvest::mint::mint` |
| 3 | 0.3% | `atomic::diagnostics::proof::render::Proof::collect` |
| 1 | 0.1% | `atomic::extract::resolver::ValueGraph::new` |
| 1 | 0.1% | `atomic::compile` |
| 1 | 0.1% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 1 | 0.1% | `styletrace::analysis::parser::trace_program` |

## Callers of `atomic::diagnostics::site::LineIndex::line_col`

Inclusive 9wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 9 | 0.8% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |

## Callers of `canon::dialect::resolve_alias`

Inclusive 14wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `canon::is_known_style_prop` |
| 5 | 0.4% | `canon::css::is_color_prop` |
| 2 | 0.2% | `canon::resolve_canonical_prop` |
| 1 | 0.1% | `canon::css::is_unitless_prop` |
| 1 | 0.1% | `canon::class_prefix_for_prop` |

## Callers of `canon::css::find_property`

Inclusive 12wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 10 | 0.9% | `canon::is_known_style_prop` |
| 2 | 0.2% | `canon::to_css_declaration_property` |

## Callers of `core::hash::BuildHasher::hash_one`

Inclusive 10wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 3 | 0.3% | `atomic::diagnostics::proof::render::Proof::collect` |
| 2 | 0.2% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 1 | 0.1% | `atomic::sources::backfill_dir` |
| 1 | 0.1% | `hashbrown::rustc_entry::<impl hashbrown::map::HashMap<K,V,S,A>>::rustc_entry` |
| 1 | 0.1% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 1 | 0.1% | `module_graph::ladder::SpecifierLadder<F>::package_hit` |
| 1 | 0.1% | `atomic::resolve::tokens::lookup_entry` |

## Callers of `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle`

Inclusive 19wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 8 | 0.7% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 1 | 0.1% | `std::path::Path::_join` |
| 1 | 0.1% | `atomic::extract::constants::index::LocalConstants::merge` |
| 1 | 0.1% | `atomic::diagnostics::analysis::analyze` |
| 1 | 0.1% | `canon::is_known_style_prop` |
| 1 | 0.1% | `atomic::extract::extract_with_context` |
| 1 | 0.1% | `<core::str::pattern::CharSearcher as core::str::pattern::Searcher>::next_match` |
| 1 | 0.1% | `atomic::extract::identity::IdentityGraph::resolve` |

## Callers of `canon::css::values::named_colors::is_named_color`

Inclusive 6wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 6 | 0.5% | `canon::css::values::classify::classify_css_value` |

## Callers of `oxc_parser::lexer::Lexer::next_token`

Inclusive 7wt. Caller = frame directly below the outermost occurrence.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.3% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_primary_expression` |
| 1 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binding_identifier` |
| 1 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_identifier_expression` |
| 1 | 0.1% | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_assignment_expression_or_higher_impl` |

## Malloc-family leaves by nearest atomic/canon ancestor

181wt of malloc-family leaves; 7wt with no .node ancestor. Infra frames (alloc/core/std/hash) skipped so traffic lands on product code.

| weight | share | frame |
| --- | --- | --- |
| 26 | 2.3% | `atomic::resolve::resolve_want_with` |
| 17 | 1.5% | `atomic::assembly::AssembleCtx::finish` |
| 6 | 0.5% | `atomic::compile` |
| 6 | 0.5% | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 5 | 0.4% | `atomic::extract::resolver::ValueGraph::new` |
| 5 | 0.4% | `atomic::resolve::authored_key` |
| 5 | 0.4% | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 4 | 0.3% | `module_graph::key::normalize_str` |
| 4 | 0.3% | `atomic::extract::expressions::object::walk_style_object` |
| 4 | 0.3% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 4 | 0.3% | `atomic::resolve::conditions::lower_when` |
| 4 | 0.3% | `atomic::resolve::tokens::format_entry` |
| 4 | 0.3% | `reference_virtual_native::atomic::__napi__compile_system` |
| 3 | 0.3% | `module_graph::ladder::join_with` |
| 3 | 0.3% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 3 | 0.3% | `atomic::extract::expressions::ast_value::ast_to_json_value` |
| 3 | 0.3% | `atomic::atom::want::Want::with_origin` |
| 3 | 0.3% | `atomic::runtime::serializer::canonical_json_value` |

## memmove leaves by nearest .node ancestor

51wt of memmove leaves; 15wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 5 | 0.4% | `atomic::extract::extract_with_context` |
| 4 | 0.3% | `atomic::compile` |
| 3 | 0.3% | `atomic::diagnostics::analysis::analyze` |
| 2 | 0.2% | `oxc_allocator::vec2::raw_vec::RawVec<T,A>::grow_amortized` |
| 2 | 0.2% | `<alloc::boxed::Box<str> as core::clone::Clone>::clone` |
| 2 | 0.2% | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 2 | 0.2% | `atomic::stylesheet::layers::wrap_package_layer` |
| 1 | 0.1% | `<&mut serde_json::de::Deserializer<R> as serde_core::de::Deserializer>::deserialize_string` |
| 1 | 0.1% | `atomic::extract::resolver::ValueGraph::new` |
| 1 | 0.1% | `hashbrown::raw::RawIterRange<T>::fold_impl` |
| 1 | 0.1% | `atomic::diagnostics::analysis::object::WalkCtx::expect` |
| 1 | 0.1% | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 1 | 0.1% | `<alloc::string::String as core::fmt::Write>::write_str` |
| 1 | 0.1% | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |

## memcmp leaves by nearest .node ancestor

29wt of memcmp leaves; 0wt with no .node ancestor.

| weight | share | frame |
| --- | --- | --- |
| 4 | 0.3% | `canon::css::find_property` |
| 4 | 0.3% | `canon::dialect::resolve_alias` |
| 3 | 0.3% | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 2 | 0.2% | `atomic::extract::constants::index::LocalConstants::merge` |
| 2 | 0.2% | `canon::css::is_color_prop` |
| 2 | 0.2% | `canon::is_known_style_prop` |
| 2 | 0.2% | `core::slice::sort::stable::quicksort::quicksort` |
| 1 | 0.1% | `core::slice::sort::unstable::ipnsort` |
| 1 | 0.1% | `<atomic::extract::resolver::source::AtomicFs as module_graph::fs::FileSystem>::is_file` |
| 1 | 0.1% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 1 | 0.1% | `<[A] as core::slice::cmp::SlicePartialEq<B>>::equal` |
| 1 | 0.1% | `canon::css::is_unitless_prop` |
| 1 | 0.1% | `<&mut serde_json::ser::Serializer<W,F> as serde_core::ser::Serializer>::serialize_str` |
| 1 | 0.1% | `atomic::stylesheet::cascade::CascadeKey::from_atom_cached` |

## File opens by issuing frame

245wt of __open leaves, attributed past the libc stub to the frame that issued the open.

| weight | share | frame |
| --- | --- | --- |
| 244 | 21.2% | `uv__fs_work [node]` |
| 1 | 0.1% | `uv__open_cloexec [node]` |

## Callees: hottest deduped native edges

578wt in scope (compile phase); each edge counted once per sample.

| weight | share | frame |
| --- | --- | --- |
| 535 | 46.5% | `reference_virtual_native::atomic::__napi__compile_system → atomic::compile` |
| 218 | 18.9% | `atomic::compile → atomic::assembly::AssembleCtx::finish` |
| 68 | 5.9% | `atomic::assembly::AssembleCtx::finish → atomic::runtime::builder::PlanBuilder::build_keyed` |
| 64 | 5.6% | `atomic::compile → atomic::extract::extract_with_context` |
| 58 | 5.0% | `oxc_ast_visit::generated::visit::walk::walk_function → oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 55 | 4.8% | `oxc_ast_visit::generated::visit::walk::walk_declaration → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 55 | 4.8% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator → <atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 54 | 4.7% | `atomic::assembly::AssembleCtx::finish → atomic::resolve::resolve_want_with` |
| 54 | 4.7% | `atomic::runtime::builder::PlanBuilder::build_keyed → atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 40 | 3.5% | `atomic::runtime::builder::PlanBuilder::resolve_entry → atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 40 | 3.5% | `atomic::runtime::builder::resolve_with_unique_diagnostics → atomic::resolve::resolve_want_with` |
| 38 | 3.3% | `atomic::extract::extract_with_context → oxc_ast_visit::generated::visit::walk::walk_function` |
| 36 | 3.1% | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression → atomic::extract::css::extract` |
| 35 | 3.0% | `atomic::extract::css::extract → atomic::extract::css::handle_css_arg` |
| 33 | 2.9% | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 33 | 2.9% | `atomic::extract::css::handle_css_arg → atomic::extract::expressions::object::walk_style_object` |
| 33 | 2.9% | `atomic::assembly::AssembleCtx::finish → atomic::stylesheet::emitter::build_stylesheets_with` |
| 32 | 2.8% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements → oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 32 | 2.8% | `atomic::compile → atomic::hosts::resolve` |
| 31 | 2.7% | `atomic::resolve::resolve_want_with → atomic::resolve::tokens::resolve_token_value` |
| 27 | 2.3% | `atomic::compile → <alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 26 | 2.3% | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter → <core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 26 | 2.3% | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold → oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 26 | 2.3% | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration` |
| 26 | 2.3% | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration → oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration` |

## Allocator frames below hot native functions

Stacks of each hot native self function that have allocator frames beneath them — a per-call allocation smell check from the profile alone.

| stacks | with alloc | share | function |
| --- | --- | --- | --- |
| 19 | 13 | 68% | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 27 | 5 | 19% | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 19 | 4 | 21% | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 14 | 1 | 7% | `canon::dialect::resolve_alias` |
| 10 | 1 | 10% | `core::hash::BuildHasher::hash_one` |
| 27 | 0 | 0% | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 9 | 0 | 0% | `atomic::diagnostics::site::LineIndex::line_col` |
| 12 | 0 | 0% | `canon::css::find_property` |
| 6 | 0 | 0% | `canon::css::values::named_colors::is_named_color` |
| 7 | 0 | 0% | `oxc_parser::lexer::Lexer::next_token` |
| 7 | 0 | 0% | `std::path::compare_components` |
| 6 | 0 | 0% | `canon::css::values::lengths::is_length` |
| 6 | 0 | 0% | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 4 | 0 | 0% | `oxc_parser::module_record::ModuleRecordBuilder::add_module_request` |
| 14 | 0 | 0% | `canon::css::values::classify::classify_css_value` |
