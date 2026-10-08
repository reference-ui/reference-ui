# Flame summary: enterprise (a4429aa52ba8)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1027 samples (weight 1051) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 407 | 38.7% | libsystem_kernel.dylib |
| 243 | 23.1% | virtual-native.darwin-x64.node |
| 157 | 14.9% | libsystem_malloc.dylib |
| 149 | 14.2% | node |
| 73 | 6.9% | libsystem_platform.dylib |
| 13 | 1.2% | perf-10481.map |
| 5 | 0.5% | dyld |
| 2 | 0.2% | libsystem_c.dylib |
| 1 | 0.1% | libdyld.dylib |
| 1 | 0.1% | (unmapped jit) |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 126.9 | 126 | node (86) |
| config | 28.4 | 24 | libsystem_kernel.dylib (14) |
| scan | 349.3 | 349 | libsystem_kernel.dylib (295) |
| evaluate | 6.4 | 6 | libsystem_kernel.dylib (4) |
| compile | 488.5 | 488 | virtual-native.darwin-x64.node (236) |
| publish | 52.4 | 53 | libsystem_kernel.dylib (30) |
| syncResidual | 0.0 | 0 | — (0) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 0 | — |
| postWorker samples | — | 5 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 138.7 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 250 | 250 | 23.8% | 23.8% | libsystem_kernel.dylib | `__open` |
| 63 | 67 | 6.0% | 6.4% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 46 | 46 | 4.4% | 4.4% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 45 | 47 | 4.3% | 4.5% | libsystem_malloc.dylib | `_nanov2_free` |
| 40 | 40 | 3.8% | 3.8% | libsystem_kernel.dylib | `kevent` |
| 31 | 31 | 2.9% | 2.9% | libsystem_kernel.dylib | `madvise` |
| 24 | 24 | 2.3% | 2.3% | libsystem_kernel.dylib | `read` |
| 23 | 23 | 2.2% | 2.2% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 12 | 12 | 1.1% | 1.1% | libsystem_kernel.dylib | `__getdirentries64` |
| 11 | 11 | 1.0% | 1.0% | libsystem_kernel.dylib | `__close_nocancel` |
| 11 | 11 | 1.0% | 1.0% | libsystem_kernel.dylib | `__write_nocancel` |
| 11 | 23 | 1.0% | 2.2% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 11 | 11 | 1.0% | 1.0% | libsystem_kernel.dylib | `stat$INODE64` |
| 10 | 17 | 1.0% | 1.6% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 10 | 14 | 1.0% | 1.3% | node | `v8::internal::Scanner::ScanString()` |
| 9 | 11 | 0.9% | 1.0% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 8 | 12 | 0.8% | 1.1% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 7 | 7 | 0.7% | 0.7% | libsystem_malloc.dylib | `_free` |
| 7 | 7 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 7 | 9 | 0.7% | 0.9% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 6 | 21 | 0.6% | 2.0% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 6 | 6 | 0.6% | 0.6% | node | `v8::internal::CalculateLineEndsImpl<unsigned char>(v8::base::SmallVector<int, (unsigned long)32, std::__1::allocator<...` |
| 5 | 26 | 0.5% | 2.5% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 5 | 5 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 5 | 5 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `core::slice::memchr::memchr_aligned` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 11 | 23 | 1.0% | 2.2% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 10 | 17 | 1.0% | 1.6% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 9 | 11 | 0.9% | 1.0% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 8 | 12 | 0.8% | 1.1% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 7 | 7 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 7 | 9 | 0.7% | 0.9% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 6 | 21 | 0.6% | 2.0% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 5 | 26 | 0.5% | 2.5% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 5 | 5 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 5 | 5 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `core::slice::memchr::memchr_aligned` |
| 4 | 5 | 0.4% | 0.5% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 4 | 4 | 0.4% | 0.4% | virtual-native.darwin-x64.node | `atomic::atom::decl::Atom::new` |
| 4 | 69 | 0.4% | 6.6% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 3 | 5 | 0.3% | 0.5% | virtual-native.darwin-x64.node | `<indexmap::map::IndexMap<K,V,S> as core::iter::traits::collect::FromIterator<(K,V)>>::from_iter` |
| 3 | 4 | 0.3% | 0.4% | virtual-native.darwin-x64.node | `<std::path::Components as core::iter::traits::double_ended::DoubleEndedIterator>::next_back` |
| 3 | 9 | 0.3% | 0.9% | virtual-native.darwin-x64.node | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 3 | 57 | 0.3% | 5.4% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 3 | 16 | 0.3% | 1.5% | virtual-native.darwin-x64.node | `core::ops::function::FnMut::call_mut` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `core::str::<impl str>::trim_matches` |
| 3 | 8 | 0.3% | 0.8% | virtual-native.darwin-x64.node | `indexmap::inner::Core<K,V>::insert_full` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1049 | 0.0% | 99.8% | dyld | `start` |
| 0 | 1046 | 0.0% | 99.5% | node | `node::Start(int, char**)` |
| 0 | 1026 | 0.0% | 97.6% | node | `node::NodeMainInstance::Run()` |
| 0 | 977 | 0.0% | 93.0% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 1 | 975 | 0.1% | 92.8% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 915 | 0.0% | 87.1% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 1 | 915 | 0.1% | 87.1% | node | `uv_run` |
| 0 | 913 | 0.0% | 86.9% | node | `uv__io_poll` |
| 0 | 894 | 0.0% | 85.1% | node | `node::InternalCallbackScope::Close()` |
| 0 | 893 | 0.0% | 85.0% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 893 | 0.0% | 85.0% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 893 | 0.0% | 85.0% | node | `Builtins_RunMicrotasks` |
| 0 | 893 | 0.0% | 85.0% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 893 | 0.0% | 85.0% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 893 | 0.0% | 85.0% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 893 | 0.0% | 85.0% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 891 | 0.0% | 84.8% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 891 | 0.0% | 84.8% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 779 | 0.0% | 74.1% | node | `v8impl::(anonymous namespace)::FunctionCallbackWrapper::Invoke(v8::FunctionCallbackInfo<v8::Value> const&)` |
| 0 | 641 | 0.0% | 61.0% | node | `Builtins_JSEntry` |
| 0 | 641 | 0.0% | 61.0% | node | `Builtins_JSEntryTrampoline` |
| 0 | 636 | 0.0% | 60.5% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 635 | 0.0% | 60.4% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 532 | 0.0% | 50.6% | node | `node::AsyncWrap::MakeCallback(v8::Local<v8::Function>, int, v8::Local<v8::Value>*)` |
| 0 | 532 | 0.0% | 50.6% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 484 | 0.0% | 46.1% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 1 | 470 | 0.1% | 44.7% | virtual-native.darwin-x64.node | `atomic::compile` |
| 0 | 294 | 0.0% | 28.0% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__scan_system` |
| 1 | 291 | 0.1% | 27.7% | virtual-native.darwin-x64.node | `atomic::scan::scan` |
| 0 | 246 | 0.0% | 23.4% | virtual-native.darwin-x64.node | `std::fs::OpenOptions::_open` |
| 0 | 246 | 0.0% | 23.4% | virtual-native.darwin-x64.node | `std::sys::fs::unix::File::open_c` |
| 0 | 189 | 0.0% | 18.0% | virtual-native.darwin-x64.node | `atomic::assembly::AssembleCtx::finish` |
| 0 | 82 | 0.0% | 7.8% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 2 | 76 | 0.2% | 7.2% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 4 | 69 | 0.4% | 6.6% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 3 | 57 | 0.3% | 5.4% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 0 | 56 | 0.0% | 5.3% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 0 | 52 | 0.0% | 4.9% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 0 | 44 | 0.0% | 4.2% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 0 | 44 | 0.0% | 4.2% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 0 | 43 | 0.0% | 4.1% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 0 | 39 | 0.0% | 3.7% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
| 0 | 37 | 0.0% | 3.5% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 0 | 36 | 0.0% | 3.4% | virtual-native.darwin-x64.node | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 1 | 35 | 0.1% | 3.3% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
