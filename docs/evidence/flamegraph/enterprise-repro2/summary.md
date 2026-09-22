# Flame summary: enterprise (810b8b5b4744)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1196 samples (weight 1218) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 428 | 35.1% | libsystem_kernel.dylib |
| 299 | 24.5% | virtual-native.darwin-x64.node |
| 191 | 15.7% | libsystem_malloc.dylib |
| 162 | 13.3% | node |
| 108 | 8.9% | libsystem_platform.dylib |
| 22 | 1.8% | perf-68170.map |
| 5 | 0.4% | dyld |
| 2 | 0.2% | libsystem_c.dylib |
| 1 | 0.1% | libdyld.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 122.1 | 121 | node (78) |
| config | 27.2 | 23 | libsystem_kernel.dylib (16) |
| scan | 367.6 | 368 | libsystem_kernel.dylib (293) |
| evaluate | 6.2 | 5 | libsystem_kernel.dylib (5) |
| compile | 646.2 | 644 | virtual-native.darwin-x64.node (298) |
| publish | 48.9 | 48 | libsystem_kernel.dylib (28) |
| syncResidual | 0.0 | 0 | — (0) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 0 | — |
| postWorker samples | — | 9 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 141.6 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 251 | 251 | 20.6% | 20.6% | libsystem_kernel.dylib | `__open` |
| 91 | 97 | 7.5% | 8.0% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 57 | 61 | 4.7% | 5.0% | libsystem_malloc.dylib | `_nanov2_free` |
| 53 | 53 | 4.4% | 4.4% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 41 | 41 | 3.4% | 3.4% | libsystem_kernel.dylib | `madvise` |
| 39 | 39 | 3.2% | 3.2% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 37 | 37 | 3.0% | 3.0% | libsystem_kernel.dylib | `kevent` |
| 20 | 20 | 1.6% | 1.6% | libsystem_kernel.dylib | `read` |
| 18 | 18 | 1.5% | 1.5% | libsystem_kernel.dylib | `__write_nocancel` |
| 16 | 16 | 1.3% | 1.3% | libsystem_kernel.dylib | `__close_nocancel` |
| 15 | 29 | 1.2% | 2.4% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 13 | 26 | 1.1% | 2.1% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 12 | 12 | 1.0% | 1.0% | libsystem_kernel.dylib | `__getdirentries64` |
| 11 | 11 | 0.9% | 0.9% | virtual-native.darwin-x64.node | `<std::path::Components as core::iter::traits::iterator::Iterator>::next` |
| 11 | 12 | 0.9% | 1.0% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 11 | 11 | 0.9% | 0.9% | libsystem_kernel.dylib | `stat$INODE64` |
| 10 | 16 | 0.8% | 1.3% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 10 | 14 | 0.8% | 1.1% | node | `v8::internal::Scanner::ScanString()` |
| 8 | 10 | 0.7% | 0.8% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 8 | 8 | 0.7% | 0.7% | node | `v8::internal::StringHasher::HashSequentialString<unsigned char>(unsigned char const*, unsigned int, v8::internal::Has...` |
| 7 | 9 | 0.6% | 0.7% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 7 | 20 | 0.6% | 1.6% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 7 | 8 | 0.6% | 0.7% | virtual-native.darwin-x64.node | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 6 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write` |
| 6 | 6 | 0.5% | 0.5% | libsystem_platform.dylib | `_platform_strcmp` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 15 | 29 | 1.2% | 2.4% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 13 | 26 | 1.1% | 2.1% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 11 | 11 | 0.9% | 0.9% | virtual-native.darwin-x64.node | `<std::path::Components as core::iter::traits::iterator::Iterator>::next` |
| 11 | 12 | 0.9% | 1.0% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 10 | 16 | 0.8% | 1.3% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 8 | 10 | 0.7% | 0.8% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 7 | 9 | 0.6% | 0.7% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 7 | 20 | 0.6% | 1.6% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 7 | 8 | 0.6% | 0.7% | virtual-native.darwin-x64.node | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 6 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write` |
| 5 | 35 | 0.4% | 2.9% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 5 | 8 | 0.4% | 0.7% | virtual-native.darwin-x64.node | `canon::css::is_color_prop` |
| 5 | 15 | 0.4% | 1.2% | virtual-native.darwin-x64.node | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 5 | 8 | 0.4% | 0.7% | virtual-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 4 | 4 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `<core::str::lossy::Utf8Chunks as core::iter::traits::iterator::Iterator>::next` |
| 4 | 4 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `__rustc::__rust_no_alloc_shim_is_unstable_v2` |
| 4 | 6 | 0.3% | 0.5% | virtual-native.darwin-x64.node | `atomic::stylesheet::name::escape::EscapeCursor::push_char` |
| 4 | 7 | 0.3% | 0.6% | virtual-native.darwin-x64.node | `module_graph::graph::ModuleGraph<L>::ensure` |
| 4 | 4 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `module_graph::record::collect::statement` |
| 4 | 4 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `oxc_parser::module_record::ModuleRecordBuilder::add_module_request` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1218 | 0.0% | 100.0% | dyld | `start` |
| 0 | 1214 | 0.0% | 99.7% | node | `node::Start(int, char**)` |
| 0 | 1192 | 0.0% | 97.9% | node | `node::NodeMainInstance::Run()` |
| 2 | 1148 | 0.2% | 94.3% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 1148 | 0.0% | 94.3% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 0 | 1084 | 0.0% | 89.0% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 1084 | 0.0% | 89.0% | node | `uv_run` |
| 0 | 1083 | 0.0% | 88.9% | node | `uv__io_poll` |
| 0 | 1067 | 0.0% | 87.6% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 1067 | 0.0% | 87.6% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 1067 | 0.0% | 87.6% | node | `Builtins_RunMicrotasks` |
| 0 | 1067 | 0.0% | 87.6% | node | `node::InternalCallbackScope::Close()` |
| 0 | 1067 | 0.0% | 87.6% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 1067 | 0.0% | 87.6% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 1067 | 0.0% | 87.6% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 1067 | 0.0% | 87.6% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 1065 | 0.0% | 87.4% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 794 | 0.0% | 65.2% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 788 | 0.0% | 64.7% | node | `Builtins_JSEntry` |
| 0 | 788 | 0.0% | 64.7% | node | `Builtins_JSEntryTrampoline` |
| 0 | 784 | 0.0% | 64.4% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 784 | 0.0% | 64.4% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 684 | 0.0% | 56.2% | node | `node::AsyncWrap::MakeCallback(v8::Local<v8::Function>, int, v8::Local<v8::Value>*)` |
| 0 | 684 | 0.0% | 56.2% | node | `node::EmitToJSStreamListener::OnStreamRead(long, uv_buf_t const&)` |
| 0 | 684 | 0.0% | 56.2% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 619 | 0.0% | 50.8% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 3 | 597 | 0.2% | 49.0% | virtual-native.darwin-x64.node | `atomic::compile` |
| 0 | 236 | 0.0% | 19.4% | virtual-native.darwin-x64.node | `atomic::assembly::AssembleCtx::finish` |
| 2 | 109 | 0.2% | 8.9% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 2 | 96 | 0.2% | 7.9% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 0 | 77 | 0.0% | 6.3% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 1 | 70 | 0.1% | 5.7% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 0 | 60 | 0.0% | 4.9% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 1 | 57 | 0.1% | 4.7% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 0 | 54 | 0.0% | 4.4% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 0 | 49 | 0.0% | 4.0% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 0 | 48 | 0.0% | 3.9% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 0 | 45 | 0.0% | 3.7% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
| 0 | 42 | 0.0% | 3.4% | virtual-native.darwin-x64.node | `atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 1 | 39 | 0.1% | 3.2% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 0 | 37 | 0.0% | 3.0% | virtual-native.darwin-x64.node | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 0 | 36 | 0.0% | 3.0% | virtual-native.darwin-x64.node | `atomic::extract::resolver::ValueGraph::resolve_file_imports` |
| 1 | 36 | 0.1% | 3.0% | virtual-native.darwin-x64.node | `atomic::sources::collect` |
| 5 | 35 | 0.4% | 2.9% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 0 | 34 | 0.0% | 2.8% | virtual-native.darwin-x64.node | `atomic::hosts::resolve` |
