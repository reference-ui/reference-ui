# Flame summary: lib-styletrace (488bcfd7a)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 3466 samples (weight 4135) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 1813 | 43.8% | libsystem_malloc.dylib |
| 1300 | 31.4% | libsystem_kernel.dylib |
| 605 | 14.6% | reference-native.darwin-x64.node |
| 237 | 5.7% | libsystem_platform.dylib |
| 156 | 3.8% | node |
| 13 | 0.3% | perf-45134.map |
| 5 | 0.1% | dyld |
| 4 | 0.1% | libsystem_pthread.dylib |
| 1 | 0.0% | libc++abi.dylib |
| 1 | 0.0% | libdyld.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 84.3 | 85 | node (46) |
| config | 34.0 | 30 | libsystem_kernel.dylib (21) |
| scan | 180.4 | 176 | libsystem_kernel.dylib (150) |
| evaluate | 9.6 | 9 | node (6) |
| compile | 1742.2 | 1742 | libsystem_malloc.dylib (695) |
| publish | 57.0 | 56 | libsystem_kernel.dylib (37) |
| syncResidual | 2.4 | 2 | libsystem_kernel.dylib (1) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 67 | — |
| postWorker samples | — | 1968 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 209.2 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 556 | 556 | 13.4% | 13.4% | libsystem_kernel.dylib | `semaphore_wait_trap` |
| 410 | 853 | 9.9% | 20.6% | libsystem_malloc.dylib | `free_tiny` |
| 375 | 883 | 9.1% | 21.4% | libsystem_malloc.dylib | `tiny_malloc_should_clear` |
| 216 | 216 | 5.2% | 5.2% | libsystem_kernel.dylib | `kevent` |
| 201 | 354 | 4.9% | 8.6% | libsystem_malloc.dylib | `tiny_malloc_from_free_list` |
| 179 | 394 | 4.3% | 9.5% | libsystem_malloc.dylib | `tiny_free_no_lock` |
| 154 | 154 | 3.7% | 3.7% | libsystem_kernel.dylib | `stat$INODE64` |
| 141 | 141 | 3.4% | 3.4% | libsystem_malloc.dylib | `rack_get_thread_index` |
| 132 | 132 | 3.2% | 3.2% | libsystem_kernel.dylib | `__open` |
| 131 | 131 | 3.2% | 3.2% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 125 | 125 | 3.0% | 3.0% | libsystem_malloc.dylib | `tiny_free_list_add_ptr` |
| 114 | 114 | 2.8% | 2.8% | libsystem_malloc.dylib | `set_tiny_meta_header_in_use` |
| 106 | 106 | 2.6% | 2.6% | libsystem_kernel.dylib | `madvise` |
| 78 | 78 | 1.9% | 1.9% | libsystem_malloc.dylib | `tiny_free_list_remove_ptr` |
| 64 | 159 | 1.5% | 3.8% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 58 | 58 | 1.4% | 1.4% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 48 | 158 | 1.2% | 3.8% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 42 | 42 | 1.0% | 1.0% | libsystem_malloc.dylib | `_szone_free` |
| 40 | 40 | 1.0% | 1.0% | libsystem_malloc.dylib | `_tiny_check_and_zero_inline_meta_from_freelist` |
| 38 | 38 | 0.9% | 0.9% | libsystem_platform.dylib | `_platform_bzero$VARIANT$Haswell` |
| 34 | 68 | 0.8% | 1.6% | reference-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 33 | 33 | 0.8% | 0.8% | libsystem_kernel.dylib | `read` |
| 32 | 90 | 0.8% | 2.2% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 29 | 156 | 0.7% | 3.8% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 27 | 913 | 0.7% | 22.1% | libsystem_malloc.dylib | `szone_malloc_should_clear` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 64 | 159 | 1.5% | 3.8% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 48 | 158 | 1.2% | 3.8% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 34 | 68 | 0.8% | 1.6% | reference-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 32 | 90 | 0.8% | 2.2% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 29 | 156 | 0.7% | 3.8% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 26 | 805 | 0.6% | 19.5% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 23 | 557 | 0.6% | 13.5% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 14 | 14 | 0.3% | 0.3% | reference-native.darwin-x64.node | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 11 | 11 | 0.3% | 0.3% | reference-native.darwin-x64.node | `std::path::Components::parse_next_component_back` |
| 9 | 39 | 0.2% | 0.9% | reference-native.darwin-x64.node | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 8 | 792 | 0.2% | 19.2% | reference-native.darwin-x64.node | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 8 | 8 | 0.2% | 0.2% | reference-native.darwin-x64.node | `__rustc::__rust_alloc` |
| 7 | 267 | 0.2% | 6.5% | reference-native.darwin-x64.node | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 7 | 15 | 0.2% | 0.4% | reference-native.darwin-x64.node | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::mar...` |
| 6 | 169 | 0.1% | 4.1% | reference-native.darwin-x64.node | `<alloc::vec::Vec<T,A> as core::clone::Clone>::clone` |
| 6 | 6 | 0.1% | 0.1% | reference-native.darwin-x64.node | `__rustc::__rust_dealloc` |
| 6 | 6 | 0.1% | 0.1% | reference-native.darwin-x64.node | `__rustc::__rust_no_alloc_shim_is_unstable_v2` |
| 6 | 6 | 0.1% | 0.1% | reference-native.darwin-x64.node | `core::slice::memchr::memchr_aligned` |
| 6 | 57 | 0.1% | 1.4% | reference-native.darwin-x64.node | `core::slice::sort::stable::drift::sort` |
| 6 | 57 | 0.1% | 1.4% | reference-native.darwin-x64.node | `oxc_parser::ts::types::<impl oxc_parser::ParserImpl>::parse_ts_type` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 4135 | 0.0% | 100.0% | dyld | `start` |
| 0 | 4131 | 0.0% | 99.9% | node | `node::Start(int, char**)` |
| 0 | 4113 | 0.0% | 99.5% | node | `node::NodeMainInstance::Run()` |
| 0 | 3973 | 0.0% | 96.1% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 3973 | 0.0% | 96.1% | node | `uv_run` |
| 0 | 3878 | 0.0% | 93.8% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 0 | 3865 | 0.0% | 93.5% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 3828 | 0.0% | 92.6% | node | `Builtins_JSEntry` |
| 0 | 3828 | 0.0% | 92.6% | node | `Builtins_JSEntryTrampoline` |
| 0 | 3826 | 0.0% | 92.5% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 3826 | 0.0% | 92.5% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 3807 | 0.0% | 92.1% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 3721 | 0.0% | 90.0% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 3651 | 0.0% | 88.3% | node | `v8impl::(anonymous namespace)::FunctionCallbackWrapper::Invoke(v8::FunctionCallbackInfo<v8::Value> const&)` |
| 1 | 2072 | 0.0% | 50.1% | node | `uv__io_poll` |
| 0 | 1923 | 0.0% | 46.5% | node | `node::InternalCallbackScope::Close()` |
| 0 | 1920 | 0.0% | 46.4% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 1920 | 0.0% | 46.4% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 1920 | 0.0% | 46.4% | node | `Builtins_RunMicrotasks` |
| 0 | 1920 | 0.0% | 46.4% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 1920 | 0.0% | 46.4% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 1920 | 0.0% | 46.4% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 1920 | 0.0% | 46.4% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 1915 | 0.0% | 46.3% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 1901 | 0.0% | 46.0% | node | `node::Environment::CheckImmediate(uv_check_s*)` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1897 | 0.0% | 45.9% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 1895 | 0.0% | 45.8% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 1867 | 0.0% | 45.2% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 1739 | 0.0% | 42.1% | reference-native.darwin-x64.node | `reference_native::atomic::__napi__compile_system` |
| 0 | 1734 | 0.0% | 41.9% | reference-native.darwin-x64.node | `atomic::compile` |
| 0 | 1708 | 0.0% | 41.3% | reference-native.darwin-x64.node | `std::thread::scoped::scope` |
| 0 | 1680 | 0.0% | 40.6% | reference-native.darwin-x64.node | `atomic::phase_parallel::drive_rounds` |
| 0 | 1557 | 0.0% | 37.7% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 6 | 1506 | 0.1% | 36.4% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 977 | 0.0% | 23.6% | reference-native.darwin-x64.node | `atomic::phase_merge::publish` |
| 0 | 975 | 0.0% | 23.6% | reference-native.darwin-x64.node | `atomic::hosts::resolve_prepared` |
| 0 | 974 | 0.0% | 23.6% | reference-native.darwin-x64.node | `styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 0 | 974 | 0.0% | 23.6% | reference-native.darwin-x64.node | `styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 0 | 973 | 0.0% | 23.5% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 0 | 966 | 0.0% | 23.4% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 0 | 965 | 0.0% | 23.3% | reference-native.darwin-x64.node | `styletrace::analysis::parser::parse_trace_module` |
| 1 | 960 | 0.0% | 23.2% | reference-native.darwin-x64.node | `styletrace::analysis::parser::fold_trace_module` |
| 1 | 892 | 0.0% | 21.6% | reference-native.darwin-x64.node | `styletrace::analysis::parser::types::resolve_style_props_from_type_annotation` |
| 0 | 873 | 0.0% | 21.1% | reference-native.darwin-x64.node | `styletrace::resolver::tracer::collect_style_prop_names` |
| 0 | 867 | 0.0% | 21.0% | reference-native.darwin-x64.node | `styletrace::resolver::tracer::resolve::resolve_reference_props` |
