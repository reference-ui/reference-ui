# Flame summary: enterprise (810b8b5b4744)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1207 samples (weight 1226) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 417 | 34.0% | libsystem_kernel.dylib |
| 295 | 24.1% | virtual-native.darwin-x64.node |
| 217 | 17.7% | libsystem_malloc.dylib |
| 178 | 14.5% | node |
| 94 | 7.7% | libsystem_platform.dylib |
| 19 | 1.5% | perf-67717.map |
| 3 | 0.2% | dyld |
| 2 | 0.2% | (unmapped jit) |
| 1 | 0.1% | libsystem_c.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 127.5 | 125 | node (81) |
| config | 26.7 | 21 | libsystem_kernel.dylib (12) |
| scan | 367.7 | 367 | libsystem_kernel.dylib (295) |
| evaluate | 2.7 | 3 | node (2) |
| compile | 654.5 | 653 | virtual-native.darwin-x64.node (295) |
| publish | 48.1 | 48 | libsystem_kernel.dylib (24) |
| syncResidual | 0.0 | 0 | — (0) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 0 | — |
| postWorker samples | — | 9 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 240.4 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 243 | 243 | 19.8% | 19.8% | libsystem_kernel.dylib | `__open` |
| 96 | 109 | 7.8% | 8.9% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 68 | 68 | 5.5% | 5.5% | libsystem_malloc.dylib | `_nanov2_free` |
| 53 | 53 | 4.3% | 4.3% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 39 | 39 | 3.2% | 3.2% | libsystem_kernel.dylib | `madvise` |
| 32 | 32 | 2.6% | 2.6% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 31 | 31 | 2.5% | 2.5% | libsystem_kernel.dylib | `kevent` |
| 28 | 28 | 2.3% | 2.3% | libsystem_kernel.dylib | `read` |
| 17 | 28 | 1.4% | 2.3% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 17 | 29 | 1.4% | 2.4% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 14 | 14 | 1.1% | 1.1% | libsystem_kernel.dylib | `__getdirentries64` |
| 13 | 13 | 1.1% | 1.1% | libsystem_kernel.dylib | `__write_nocancel` |
| 12 | 12 | 1.0% | 1.0% | libsystem_kernel.dylib | `__close_nocancel` |
| 12 | 17 | 1.0% | 1.4% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 11 | 11 | 0.9% | 0.9% | virtual-native.darwin-x64.node | `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write` |
| 9 | 9 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `<std::path::Components as core::iter::traits::iterator::Iterator>::next` |
| 9 | 9 | 0.7% | 0.7% | libsystem_malloc.dylib | `_malloc_zone_malloc` |
| 9 | 9 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 9 | 25 | 0.7% | 2.0% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 8 | 9 | 0.7% | 0.7% | node | `Builtins_StringAdd_CheckNone` |
| 8 | 29 | 0.7% | 2.4% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 8 | 20 | 0.7% | 1.6% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 8 | 8 | 0.7% | 0.7% | libsystem_kernel.dylib | `stat$INODE64` |
| 8 | 14 | 0.7% | 1.1% | node | `v8::internal::Scanner::ScanString()` |
| 7 | 13 | 0.6% | 1.1% | libsystem_malloc.dylib | `nanov2_allocate_outlined` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 17 | 28 | 1.4% | 2.3% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 17 | 29 | 1.4% | 2.4% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 12 | 17 | 1.0% | 1.4% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 11 | 11 | 0.9% | 0.9% | virtual-native.darwin-x64.node | `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write` |
| 9 | 9 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `<std::path::Components as core::iter::traits::iterator::Iterator>::next` |
| 9 | 9 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 9 | 25 | 0.7% | 2.0% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 8 | 29 | 0.7% | 2.4% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 8 | 20 | 0.7% | 1.6% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 6 | 14 | 0.5% | 1.1% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 6 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 5 | 8 | 0.4% | 0.7% | virtual-native.darwin-x64.node | `canon::css::is_color_prop` |
| 4 | 4 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 4 | 4 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `atomic::includes::glob::match_from` |
| 4 | 10 | 0.3% | 0.8% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 4 | 8 | 0.3% | 0.7% | virtual-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 3 | 5 | 0.2% | 0.4% | virtual-native.darwin-x64.node | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 3 | 12 | 0.2% | 1.0% | virtual-native.darwin-x64.node | `atomic::extract::expressions::walk::ExpressionWalk::push_want` |
| 3 | 113 | 0.2% | 9.2% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 3 | 10 | 0.2% | 0.8% | virtual-native.darwin-x64.node | `core::slice::sort::shared::smallsort::small_sort_general_with_scratch` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1226 | 0.0% | 100.0% | dyld | `start` |
| 0 | 1223 | 0.0% | 99.8% | node | `node::Start(int, char**)` |
| 0 | 1201 | 0.0% | 98.0% | node | `node::NodeMainInstance::Run()` |
| 2 | 1158 | 0.2% | 94.5% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 1158 | 0.0% | 94.5% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 0 | 1087 | 0.0% | 88.7% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 1087 | 0.0% | 88.7% | node | `uv__io_poll` |
| 0 | 1087 | 0.0% | 88.7% | node | `uv_run` |
| 0 | 1073 | 0.0% | 87.5% | node | `node::InternalCallbackScope::Close()` |
| 0 | 1072 | 0.0% | 87.4% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 1072 | 0.0% | 87.4% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 1072 | 0.0% | 87.4% | node | `Builtins_RunMicrotasks` |
| 0 | 1072 | 0.0% | 87.4% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 1072 | 0.0% | 87.4% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 1072 | 0.0% | 87.4% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 1072 | 0.0% | 87.4% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 1071 | 0.0% | 87.4% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 799 | 0.0% | 65.2% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 799 | 0.0% | 65.2% | node | `Builtins_JSEntry` |
| 0 | 799 | 0.0% | 65.2% | node | `Builtins_JSEntryTrampoline` |
| 0 | 794 | 0.0% | 64.8% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 794 | 0.0% | 64.8% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 691 | 0.0% | 56.4% | node | `uv__stream_io` |
| 0 | 690 | 0.0% | 56.3% | node | `node::EmitToJSStreamListener::OnStreamRead(long, uv_buf_t const&)` |
| 0 | 690 | 0.0% | 56.3% | node | `node::LibuvStreamWrap::OnUvRead(long, uv_buf_t const*)` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 630 | 0.0% | 51.4% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 1 | 606 | 0.1% | 49.4% | virtual-native.darwin-x64.node | `atomic::compile` |
| 0 | 242 | 0.0% | 19.7% | virtual-native.darwin-x64.node | `atomic::assembly::AssembleCtx::finish` |
| 3 | 113 | 0.2% | 9.2% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 1 | 102 | 0.1% | 8.3% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 0 | 80 | 0.0% | 6.5% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 2 | 71 | 0.2% | 5.8% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 2 | 68 | 0.2% | 5.5% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 1 | 57 | 0.1% | 4.6% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 0 | 54 | 0.0% | 4.4% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 0 | 48 | 0.0% | 3.9% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 0 | 48 | 0.0% | 3.9% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 0 | 44 | 0.0% | 3.6% | virtual-native.darwin-x64.node | `atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 0 | 40 | 0.0% | 3.3% | virtual-native.darwin-x64.node | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 1 | 39 | 0.1% | 3.2% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
| 0 | 36 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `atomic::sources::collect` |
| 0 | 34 | 0.0% | 2.8% | virtual-native.darwin-x64.node | `atomic::extract::resolver::ValueGraph::resolve_file_imports` |
| 1 | 34 | 0.1% | 2.8% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 2 | 34 | 0.2% | 2.8% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 0 | 34 | 0.0% | 2.8% | virtual-native.darwin-x64.node | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
