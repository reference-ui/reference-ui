# Flame summary: enterprise (3dd32a659715)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1129 samples (weight 1153) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 422 | 36.6% | libsystem_kernel.dylib |
| 268 | 23.2% | virtual-native.darwin-x64.node |
| 189 | 16.4% | libsystem_malloc.dylib |
| 156 | 13.5% | node |
| 83 | 7.2% | libsystem_platform.dylib |
| 25 | 2.2% | perf-26670.map |
| 5 | 0.4% | dyld |
| 3 | 0.3% | libsystem_c.dylib |
| 1 | 0.1% | libdyld.dylib |
| 1 | 0.1% | libsamply_mac_preload.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 119.7 | 119 | node (78) |
| config | 27.5 | 23 | libsystem_kernel.dylib (17) |
| scan | 367.7 | 368 | libsystem_kernel.dylib (300) |
| evaluate | 2.7 | 2 | libsystem_kernel.dylib (1) |
| compile | 576.2 | 576 | virtual-native.darwin-x64.node (267) |
| publish | 56.9 | 56 | libsystem_kernel.dylib (32) |
| syncResidual | 0.0 | 1 | libsystem_kernel.dylib (1) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 0 | — |
| postWorker samples | — | 8 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 139.7 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 244 | 244 | 21.2% | 21.2% | libsystem_kernel.dylib | `__open` |
| 79 | 87 | 6.9% | 7.5% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 52 | 57 | 4.5% | 4.9% | libsystem_malloc.dylib | `_nanov2_free` |
| 51 | 51 | 4.4% | 4.4% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 40 | 40 | 3.5% | 3.5% | libsystem_kernel.dylib | `kevent` |
| 37 | 37 | 3.2% | 3.2% | libsystem_kernel.dylib | `madvise` |
| 24 | 24 | 2.1% | 2.1% | libsystem_kernel.dylib | `read` |
| 21 | 21 | 1.8% | 1.8% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 17 | 17 | 1.5% | 1.5% | libsystem_kernel.dylib | `__close_nocancel` |
| 17 | 29 | 1.5% | 2.5% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 12 | 12 | 1.0% | 1.0% | libsystem_kernel.dylib | `__getdirentries64` |
| 12 | 12 | 1.0% | 1.0% | libsystem_kernel.dylib | `__write_nocancel` |
| 11 | 11 | 1.0% | 1.0% | libsystem_kernel.dylib | `stat$INODE64` |
| 10 | 13 | 0.9% | 1.1% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 9 | 10 | 0.8% | 0.9% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 8 | 16 | 0.7% | 1.4% | perf-26670.map | `JS:*'resolve node:path:1245:10` |
| 8 | 8 | 0.7% | 0.7% | libsystem_platform.dylib | `_platform_bzero$VARIANT$Haswell` |
| 8 | 25 | 0.7% | 2.2% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 8 | 11 | 0.7% | 1.0% | node | `v8::internal::Scanner::ScanString()` |
| 7 | 12 | 0.6% | 1.0% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 7 | 7 | 0.6% | 0.6% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 7 | 7 | 0.6% | 0.6% | node | `v8::internal::CalculateLineEndsImpl<unsigned char>(v8::base::SmallVector<int, (unsigned long)32, std::__1::allocator<...` |
| 6 | 14 | 0.5% | 1.2% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 6 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 5 | 5 | 0.4% | 0.4% | libsystem_malloc.dylib | `_malloc_zone_malloc` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 17 | 29 | 1.5% | 2.5% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 10 | 13 | 0.9% | 1.1% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 9 | 10 | 0.8% | 0.9% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 8 | 25 | 0.7% | 2.2% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 7 | 12 | 0.6% | 1.0% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 7 | 7 | 0.6% | 0.6% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 6 | 14 | 0.5% | 1.2% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 6 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 5 | 5 | 0.4% | 0.4% | virtual-native.darwin-x64.node | `atomic::diagnostics::site::LineIndex::line_col` |
| 5 | 10 | 0.4% | 0.9% | virtual-native.darwin-x64.node | `core::slice::sort::stable::quicksort::quicksort` |
| 5 | 9 | 0.4% | 0.8% | virtual-native.darwin-x64.node | `indexmap::map::IndexMap<K,V,S>::insert_full` |
| 4 | 5 | 0.3% | 0.4% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::entry::Entry<K,V,A>::or_default` |
| 4 | 6 | 0.3% | 0.5% | virtual-native.darwin-x64.node | `atomic::diagnostics::site::LineIndex::for_source` |
| 4 | 4 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `atomic::resolve::conditions::pseudoselectors::nesting::nest_member_into` |
| 4 | 22 | 0.3% | 1.9% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 4 | 5 | 0.3% | 0.4% | virtual-native.darwin-x64.node | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 3 | 16 | 0.3% | 1.4% | virtual-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 3 | 73 | 0.3% | 6.3% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 3 | 4 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `<std::path::Components as core::iter::traits::iterator::Iterator>::next` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1152 | 0.0% | 99.9% | dyld | `start` |
| 0 | 1148 | 0.0% | 99.6% | node | `node::Start(int, char**)` |
| 0 | 1126 | 0.0% | 97.7% | node | `node::NodeMainInstance::Run()` |
| 0 | 1077 | 0.0% | 93.4% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 1077 | 0.0% | 93.4% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 0 | 1020 | 0.0% | 88.5% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 1020 | 0.0% | 88.5% | node | `uv__io_poll` |
| 0 | 1020 | 0.0% | 88.5% | node | `uv_run` |
| 0 | 999 | 0.0% | 86.6% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 999 | 0.0% | 86.6% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 999 | 0.0% | 86.6% | node | `Builtins_RunMicrotasks` |
| 0 | 999 | 0.0% | 86.6% | node | `node::InternalCallbackScope::Close()` |
| 0 | 999 | 0.0% | 86.6% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 999 | 0.0% | 86.6% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 999 | 0.0% | 86.6% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 999 | 0.0% | 86.6% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 998 | 0.0% | 86.6% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 727 | 0.0% | 63.1% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 720 | 0.0% | 62.4% | node | `Builtins_JSEntry` |
| 0 | 720 | 0.0% | 62.4% | node | `Builtins_JSEntryTrampoline` |
| 0 | 715 | 0.0% | 62.0% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 715 | 0.0% | 62.0% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 618 | 0.0% | 53.6% | node | `node::AsyncWrap::MakeCallback(v8::Local<v8::Function>, int, v8::Local<v8::Value>*)` |
| 0 | 618 | 0.0% | 53.6% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 618 | 0.0% | 53.6% | node | `uv__stream_io` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 556 | 0.0% | 48.2% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 0 | 533 | 0.0% | 46.2% | virtual-native.darwin-x64.node | `atomic::compile` |
| 0 | 213 | 0.0% | 18.5% | virtual-native.darwin-x64.node | `atomic::assembly::AssembleCtx::finish` |
| 1 | 103 | 0.1% | 8.9% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 1 | 96 | 0.1% | 8.3% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 3 | 73 | 0.3% | 6.3% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 0 | 67 | 0.0% | 5.8% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 0 | 66 | 0.0% | 5.7% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 0 | 52 | 0.0% | 4.5% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 0 | 52 | 0.0% | 4.5% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 0 | 48 | 0.0% | 4.2% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 0 | 48 | 0.0% | 4.2% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 2 | 41 | 0.2% | 3.6% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 0 | 38 | 0.0% | 3.3% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
| 0 | 35 | 0.0% | 3.0% | virtual-native.darwin-x64.node | `atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 0 | 35 | 0.0% | 3.0% | virtual-native.darwin-x64.node | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 1 | 34 | 0.1% | 2.9% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 0 | 34 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 0 | 32 | 0.0% | 2.8% | virtual-native.darwin-x64.node | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 0 | 31 | 0.0% | 2.7% | virtual-native.darwin-x64.node | `atomic::hosts::resolve` |
