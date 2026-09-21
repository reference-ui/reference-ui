# Flame summary: enterprise (latest)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1329 samples (weight 1349) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 417 | 30.9% | libsystem_kernel.dylib |
| 336 | 24.9% | virtual-native.darwin-x64.node |
| 262 | 19.4% | libsystem_malloc.dylib |
| 160 | 11.9% | node |
| 132 | 9.8% | libsystem_platform.dylib |
| 31 | 2.3% | perf-28778.map |
| 5 | 0.4% | dyld |
| 3 | 0.2% | libc++.1.dylib |
| 2 | 0.1% | libsystem_c.dylib |
| 1 | 0.1% | libdyld.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 118.1 | 118 | node (75) |
| config | 30.6 | 25 | libsystem_kernel.dylib (14) |
| scan | 364.3 | 365 | libsystem_kernel.dylib (295) |
| evaluate | 6.2 | 6 | libsystem_kernel.dylib (5) |
| compile | 780.3 | 778 | virtual-native.darwin-x64.node (336) |
| publish | 48.7 | 49 | libsystem_kernel.dylib (27) |
| syncResidual | 0.0 | 0 | — (0) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 0 | — |
| postWorker samples | — | 8 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 138.7 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 251 | 251 | 18.6% | 18.6% | libsystem_kernel.dylib | `__open` |
| 120 | 127 | 8.9% | 9.4% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 84 | 87 | 6.2% | 6.4% | libsystem_malloc.dylib | `_nanov2_free` |
| 70 | 70 | 5.2% | 5.2% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 52 | 52 | 3.9% | 3.9% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 36 | 36 | 2.7% | 2.7% | libsystem_kernel.dylib | `madvise` |
| 33 | 33 | 2.4% | 2.4% | libsystem_kernel.dylib | `kevent` |
| 27 | 27 | 2.0% | 2.0% | libsystem_kernel.dylib | `read` |
| 23 | 33 | 1.7% | 2.4% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 19 | 44 | 1.4% | 3.3% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 17 | 19 | 1.3% | 1.4% | libsystem_malloc.dylib | `nanov2_malloc` |
| 12 | 21 | 0.9% | 1.6% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 11 | 11 | 0.8% | 0.8% | libsystem_kernel.dylib | `__getdirentries64` |
| 11 | 11 | 0.8% | 0.8% | libsystem_kernel.dylib | `__write_nocancel` |
| 11 | 11 | 0.8% | 0.8% | libsystem_kernel.dylib | `stat$INODE64` |
| 10 | 10 | 0.7% | 0.7% | libsystem_kernel.dylib | `__close_nocancel` |
| 10 | 63 | 0.7% | 4.7% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 10 | 12 | 0.7% | 0.9% | node | `v8::internal::Scanner::ScanString()` |
| 9 | 9 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write` |
| 9 | 25 | 0.7% | 1.9% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 8 | 14 | 0.6% | 1.0% | perf-28778.map | `JS:*'resolve node:path:1245:10` |
| 8 | 13 | 0.6% | 1.0% | virtual-native.darwin-x64.node | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 8 | 18 | 0.6% | 1.3% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 8 | 17 | 0.6% | 1.3% | virtual-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 8 | 13 | 0.6% | 1.0% | virtual-native.darwin-x64.node | `std::path::compare_components` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 23 | 33 | 1.7% | 2.4% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 19 | 44 | 1.4% | 3.3% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 12 | 21 | 0.9% | 1.6% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 10 | 63 | 0.7% | 4.7% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 9 | 9 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write` |
| 9 | 25 | 0.7% | 1.9% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 8 | 13 | 0.6% | 1.0% | virtual-native.darwin-x64.node | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 8 | 18 | 0.6% | 1.3% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 8 | 17 | 0.6% | 1.3% | virtual-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 8 | 13 | 0.6% | 1.0% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 7 | 29 | 0.5% | 2.1% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 6 | 6 | 0.4% | 0.4% | virtual-native.darwin-x64.node | `<std::path::Components as core::iter::traits::iterator::Iterator>::next` |
| 5 | 5 | 0.4% | 0.4% | virtual-native.darwin-x64.node | `atomic::resolve::conditions::pseudoselectors::member_needs_is_wrap` |
| 4 | 13 | 0.3% | 1.0% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 4 | 12 | 0.3% | 0.9% | virtual-native.darwin-x64.node | `atomic::diagnostics::proof::render::render_with` |
| 4 | 137 | 0.3% | 10.2% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 4 | 11 | 0.3% | 0.8% | virtual-native.darwin-x64.node | `canon::css::is_color_prop` |
| 4 | 30 | 0.3% | 2.2% | virtual-native.darwin-x64.node | `core::ops::function::FnMut::call_mut` |
| 4 | 4 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `oxc_parser::module_record::ModuleRecordBuilder::add_module_request` |
| 3 | 3 | 0.2% | 0.2% | virtual-native.darwin-x64.node | `<&str as core::str::pattern::Pattern>::is_contained_in` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1348 | 0.0% | 99.9% | dyld | `start` |
| 0 | 1345 | 0.0% | 99.7% | node | `node::Start(int, char**)` |
| 0 | 1323 | 0.0% | 98.1% | node | `node::NodeMainInstance::Run()` |
| 0 | 1282 | 0.0% | 95.0% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 1282 | 0.0% | 95.0% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 0 | 1218 | 0.0% | 90.3% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 1218 | 0.0% | 90.3% | node | `uv__io_poll` |
| 0 | 1218 | 0.0% | 90.3% | node | `uv_run` |
| 0 | 1205 | 0.0% | 89.3% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 1205 | 0.0% | 89.3% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 1205 | 0.0% | 89.3% | node | `Builtins_RunMicrotasks` |
| 0 | 1205 | 0.0% | 89.3% | node | `node::InternalCallbackScope::Close()` |
| 0 | 1205 | 0.0% | 89.3% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 1205 | 0.0% | 89.3% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 1205 | 0.0% | 89.3% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 1205 | 0.0% | 89.3% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 1202 | 0.0% | 89.1% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 931 | 0.0% | 69.0% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 923 | 0.0% | 68.4% | node | `Builtins_JSEntry` |
| 0 | 923 | 0.0% | 68.4% | node | `Builtins_JSEntryTrampoline` |
| 0 | 919 | 0.0% | 68.1% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 919 | 0.0% | 68.1% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 821 | 0.0% | 60.9% | node | `node::EmitToJSStreamListener::OnStreamRead(long, uv_buf_t const&)` |
| 0 | 821 | 0.0% | 60.9% | node | `node::LibuvStreamWrap::OnUvRead(long, uv_buf_t const*)` |
| 0 | 821 | 0.0% | 60.9% | node | `node::LibuvStreamWrap::ReadStart()::$_1::__invoke(uv_stream_s*, long, uv_buf_t const*)` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 757 | 0.0% | 56.1% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 0 | 729 | 0.0% | 54.0% | virtual-native.darwin-x64.node | `atomic::compile` |
| 0 | 296 | 0.0% | 21.9% | virtual-native.darwin-x64.node | `atomic::assembly::AssembleCtx::finish` |
| 4 | 137 | 0.3% | 10.2% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 2 | 106 | 0.1% | 7.9% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 2 | 85 | 0.1% | 6.3% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 0 | 83 | 0.0% | 6.2% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 2 | 75 | 0.1% | 5.6% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 3 | 69 | 0.2% | 5.1% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 10 | 63 | 0.7% | 4.7% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 2 | 63 | 0.1% | 4.7% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 0 | 62 | 0.0% | 4.6% | virtual-native.darwin-x64.node | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 0 | 58 | 0.0% | 4.3% | virtual-native.darwin-x64.node | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 0 | 56 | 0.0% | 4.2% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 0 | 56 | 0.0% | 4.2% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 0 | 51 | 0.0% | 3.8% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 0 | 51 | 0.0% | 3.8% | virtual-native.darwin-x64.node | `atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 1 | 51 | 0.1% | 3.8% | virtual-native.darwin-x64.node | `atomic::stylesheet::cascade::write_utilities` |
| 0 | 49 | 0.0% | 3.6% | virtual-native.darwin-x64.node | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_declaration` |
| 0 | 49 | 0.0% | 3.6% | virtual-native.darwin-x64.node | `oxc_parser::js::module::<impl oxc_parser::ParserImpl>::parse_export_named_declaration` |
