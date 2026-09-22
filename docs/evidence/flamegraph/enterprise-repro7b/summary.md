# Flame summary: enterprise (a4429aa52ba8)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1026 samples (weight 1050) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 398 | 37.9% | libsystem_kernel.dylib |
| 243 | 23.1% | virtual-native.darwin-x64.node |
| 166 | 15.8% | libsystem_malloc.dylib |
| 137 | 13.0% | node |
| 85 | 8.1% | libsystem_platform.dylib |
| 12 | 1.1% | perf-10618.map |
| 5 | 0.5% | dyld |
| 2 | 0.2% | libsystem_c.dylib |
| 1 | 0.1% | libc++abi.dylib |
| 1 | 0.1% | libsystem_pthread.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 124.9 | 124 | node (82) |
| config | 31.6 | 28 | libsystem_kernel.dylib (16) |
| scan | 350.0 | 349 | libsystem_kernel.dylib (287) |
| evaluate | 2.8 | 2 | libsystem_kernel.dylib (1) |
| compile | 486.3 | 488 | virtual-native.darwin-x64.node (234) |
| publish | 53.2 | 53 | libsystem_kernel.dylib (33) |
| syncResidual | 0.0 | 0 | — (0) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 0 | — |
| postWorker samples | — | 6 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 139.8 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 238 | 238 | 22.7% | 22.7% | libsystem_kernel.dylib | `__open` |
| 82 | 87 | 7.8% | 8.3% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 51 | 51 | 4.9% | 4.9% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 42 | 43 | 4.0% | 4.1% | libsystem_malloc.dylib | `_nanov2_free` |
| 39 | 39 | 3.7% | 3.7% | libsystem_kernel.dylib | `kevent` |
| 31 | 31 | 3.0% | 3.0% | libsystem_kernel.dylib | `madvise` |
| 27 | 27 | 2.6% | 2.6% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 20 | 20 | 1.9% | 1.9% | libsystem_kernel.dylib | `__close_nocancel` |
| 18 | 18 | 1.7% | 1.7% | libsystem_kernel.dylib | `read` |
| 11 | 11 | 1.0% | 1.0% | libsystem_kernel.dylib | `__getdirentries64` |
| 10 | 10 | 1.0% | 1.0% | libsystem_kernel.dylib | `__write_nocancel` |
| 10 | 10 | 1.0% | 1.0% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 9 | 14 | 0.9% | 1.3% | node | `v8::internal::Scanner::ScanString()` |
| 8 | 8 | 0.8% | 0.8% | libsystem_kernel.dylib | `stat$INODE64` |
| 7 | 25 | 0.7% | 2.4% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 7 | 14 | 0.7% | 1.3% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 7 | 21 | 0.7% | 2.0% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 7 | 7 | 0.7% | 0.7% | node | `v8::internal::CalculateLineEndsImpl<unsigned char>(v8::base::SmallVector<int, (unsigned long)32, std::__1::allocator<...` |
| 7 | 7 | 0.7% | 0.7% | libsystem_kernel.dylib | `write` |
| 6 | 75 | 0.6% | 7.1% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 6 | 9 | 0.6% | 0.9% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 6 | 9 | 0.6% | 0.9% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 6 | 6 | 0.6% | 0.6% | virtual-native.darwin-x64.node | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 5 | 12 | 0.5% | 1.1% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 5 | 5 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 10 | 10 | 1.0% | 1.0% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 7 | 25 | 0.7% | 2.4% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 7 | 14 | 0.7% | 1.3% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 7 | 21 | 0.7% | 2.0% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 6 | 75 | 0.6% | 7.1% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 6 | 9 | 0.6% | 0.9% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 6 | 9 | 0.6% | 0.9% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 6 | 6 | 0.6% | 0.6% | virtual-native.darwin-x64.node | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 5 | 12 | 0.5% | 1.1% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 5 | 5 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 5 | 12 | 0.5% | 1.1% | virtual-native.darwin-x64.node | `core::slice::sort::stable::quicksort::quicksort` |
| 5 | 6 | 0.5% | 0.6% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 4 | 6 | 0.4% | 0.6% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 4 | 21 | 0.4% | 2.0% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 4 | 10 | 0.4% | 1.0% | virtual-native.darwin-x64.node | `module_graph::key::normalize_str` |
| 4 | 89 | 0.4% | 8.5% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 4 | 20 | 0.4% | 1.9% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_statement` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `<core::str::lossy::Utf8Chunks as core::iter::traits::iterator::Iterator>::next` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `__rustc::__rust_no_alloc_shim_is_unstable_v2` |
| 3 | 6 | 0.3% | 0.6% | virtual-native.darwin-x64.node | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1049 | 0.0% | 99.9% | dyld | `start` |
| 0 | 1044 | 0.0% | 99.4% | node | `node::Start(int, char**)` |
| 0 | 1025 | 0.0% | 97.6% | node | `node::NodeMainInstance::Run()` |
| 0 | 979 | 0.0% | 93.2% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 0 | 978 | 0.0% | 93.1% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 914 | 0.0% | 87.0% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 914 | 0.0% | 87.0% | node | `uv__io_poll` |
| 0 | 914 | 0.0% | 87.0% | node | `uv_run` |
| 0 | 897 | 0.0% | 85.4% | node | `node::InternalCallbackScope::Close()` |
| 0 | 896 | 0.0% | 85.3% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 896 | 0.0% | 85.3% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 896 | 0.0% | 85.3% | node | `Builtins_RunMicrotasks` |
| 0 | 896 | 0.0% | 85.3% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 896 | 0.0% | 85.3% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 896 | 0.0% | 85.3% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 896 | 0.0% | 85.3% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 893 | 0.0% | 85.0% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 890 | 0.0% | 84.8% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 777 | 0.0% | 74.0% | node | `v8impl::(anonymous namespace)::FunctionCallbackWrapper::Invoke(v8::FunctionCallbackInfo<v8::Value> const&)` |
| 0 | 639 | 0.0% | 60.9% | node | `Builtins_JSEntry` |
| 0 | 639 | 0.0% | 60.9% | node | `Builtins_JSEntryTrampoline` |
| 0 | 635 | 0.0% | 60.5% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 635 | 0.0% | 60.5% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 529 | 0.0% | 50.4% | node | `node::AsyncWrap::MakeCallback(v8::Local<v8::Function>, int, v8::Local<v8::Value>*)` |
| 0 | 529 | 0.0% | 50.4% | node | `node::EmitToJSStreamListener::OnStreamRead(long, uv_buf_t const&)` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 482 | 0.0% | 45.9% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 0 | 468 | 0.0% | 44.6% | virtual-native.darwin-x64.node | `atomic::compile` |
| 0 | 294 | 0.0% | 28.0% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__scan_system` |
| 2 | 292 | 0.2% | 27.8% | virtual-native.darwin-x64.node | `atomic::scan::scan` |
| 1 | 237 | 0.1% | 22.6% | virtual-native.darwin-x64.node | `std::fs::OpenOptions::_open` |
| 0 | 236 | 0.0% | 22.5% | virtual-native.darwin-x64.node | `std::sys::fs::unix::File::open_c` |
| 0 | 191 | 0.0% | 18.2% | virtual-native.darwin-x64.node | `atomic::assembly::AssembleCtx::finish` |
| 4 | 89 | 0.4% | 8.5% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 2 | 77 | 0.2% | 7.3% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 6 | 75 | 0.6% | 7.1% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 0 | 57 | 0.0% | 5.4% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 1 | 55 | 0.1% | 5.2% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 0 | 53 | 0.0% | 5.0% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 0 | 48 | 0.0% | 4.6% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 0 | 48 | 0.0% | 4.6% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 0 | 43 | 0.0% | 4.1% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 2 | 41 | 0.2% | 3.9% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
| 0 | 38 | 0.0% | 3.6% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 0 | 33 | 0.0% | 3.1% | virtual-native.darwin-x64.node | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 0 | 33 | 0.0% | 3.1% | virtual-native.darwin-x64.node | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
