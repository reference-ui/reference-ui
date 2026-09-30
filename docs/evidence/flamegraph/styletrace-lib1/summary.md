# Flame summary: lib-styletrace (488bcfd7a)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 4600 samples (weight 5343) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 2313 | 43.3% | libsystem_kernel.dylib |
| 1890 | 35.4% | libsystem_malloc.dylib |
| 688 | 12.9% | reference-native.darwin-x64.node |
| 251 | 4.7% | libsystem_platform.dylib |
| 186 | 3.5% | node |
| 5 | 0.1% | perf-44869.map |
| 3 | 0.1% | libsystem_pthread.dylib |
| 3 | 0.1% | libsamply_mac_preload.dylib |
| 2 | 0.0% | dyld |
| 1 | 0.0% | libsystem_c.dylib |
| 1 | 0.0% | libc++.1.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 162.3 | 162 | libsystem_kernel.dylib (85) |
| config | 75.6 | 71 | libsystem_kernel.dylib (65) |
| scan | 285.8 | 280 | libsystem_kernel.dylib (239) |
| evaluate | 9.7 | 10 | node (8) |
| compile | 1802.2 | 1800 | libsystem_malloc.dylib (695) |
| publish | 70.9 | 71 | libsystem_kernel.dylib (58) |
| syncResidual | 2.5 | 3 | libsystem_kernel.dylib (2) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 71 | — |
| postWorker samples | — | 2875 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 357.1 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 787 | 787 | 14.7% | 14.7% | libsystem_kernel.dylib | `read` |
| 563 | 563 | 10.5% | 10.5% | libsystem_kernel.dylib | `semaphore_wait_trap` |
| 456 | 1030 | 8.5% | 19.3% | libsystem_malloc.dylib | `tiny_malloc_should_clear` |
| 371 | 739 | 6.9% | 13.8% | libsystem_malloc.dylib | `free_tiny` |
| 270 | 270 | 5.1% | 5.1% | libsystem_kernel.dylib | `kevent` |
| 262 | 262 | 4.9% | 4.9% | libsystem_kernel.dylib | `stat$INODE64` |
| 204 | 412 | 3.8% | 7.7% | libsystem_malloc.dylib | `tiny_malloc_from_free_list` |
| 187 | 187 | 3.5% | 3.5% | libsystem_kernel.dylib | `__open` |
| 157 | 157 | 2.9% | 2.9% | libsystem_malloc.dylib | `rack_get_thread_index` |
| 147 | 147 | 2.8% | 2.8% | libsystem_malloc.dylib | `set_tiny_meta_header_in_use` |
| 137 | 322 | 2.6% | 6.0% | libsystem_malloc.dylib | `tiny_free_no_lock` |
| 123 | 123 | 2.3% | 2.3% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 122 | 122 | 2.3% | 2.3% | libsystem_malloc.dylib | `tiny_free_list_add_ptr` |
| 92 | 92 | 1.7% | 1.7% | libsystem_kernel.dylib | `madvise` |
| 86 | 86 | 1.6% | 1.6% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 74 | 157 | 1.4% | 2.9% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 60 | 800 | 1.1% | 15.0% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 57 | 57 | 1.1% | 1.1% | libsystem_malloc.dylib | `tiny_free_list_remove_ptr` |
| 49 | 49 | 0.9% | 0.9% | libsystem_malloc.dylib | `_tiny_check_and_zero_inline_meta_from_freelist` |
| 48 | 988 | 0.9% | 18.5% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 42 | 42 | 0.8% | 0.8% | libsystem_kernel.dylib | `__close_nocancel` |
| 42 | 135 | 0.8% | 2.5% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 36 | 36 | 0.7% | 0.7% | libsystem_malloc.dylib | `_szone_free` |
| 35 | 87 | 0.7% | 1.6% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 34 | 34 | 0.6% | 0.6% | libsystem_malloc.dylib | `_malloc_zone_malloc` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 74 | 157 | 1.4% | 2.9% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 60 | 800 | 1.1% | 15.0% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 48 | 988 | 0.9% | 18.5% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 42 | 135 | 0.8% | 2.5% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 35 | 87 | 0.7% | 1.6% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 34 | 133 | 0.6% | 2.5% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 22 | 74 | 0.4% | 1.4% | reference-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 18 | 18 | 0.3% | 0.3% | reference-native.darwin-x64.node | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 16 | 74 | 0.3% | 1.4% | reference-native.darwin-x64.node | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 14 | 255 | 0.3% | 4.8% | reference-native.darwin-x64.node | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 12 | 26 | 0.2% | 0.5% | reference-native.darwin-x64.node | `std::io::default_read_to_end::small_probe_read` |
| 11 | 11 | 0.2% | 0.2% | reference-native.darwin-x64.node | `__rustc::__rust_dealloc` |
| 10 | 10 | 0.2% | 0.2% | reference-native.darwin-x64.node | `__rustc::__rust_no_alloc_shim_is_unstable_v2` |
| 10 | 10 | 0.2% | 0.2% | reference-native.darwin-x64.node | `std::path::Components::parse_next_component_back` |
| 8 | 1009 | 0.1% | 18.9% | reference-native.darwin-x64.node | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 7 | 16 | 0.1% | 0.3% | reference-native.darwin-x64.node | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::mar...` |
| 7 | 9 | 0.1% | 0.2% | reference-native.darwin-x64.node | `oxc_parser::lexer::comment::<impl oxc_parser::lexer::Lexer>::skip_single_line_comment` |
| 6 | 6 | 0.1% | 0.1% | reference-native.darwin-x64.node | `__rustc::__rdl_alloc` |
| 6 | 6 | 0.1% | 0.1% | reference-native.darwin-x64.node | `__rustc::__rust_alloc` |
| 6 | 39 | 0.1% | 0.7% | reference-native.darwin-x64.node | `core::slice::sort::stable::drift::sort` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 5342 | 0.0% | 100.0% | dyld | `start` |
| 0 | 5340 | 0.0% | 99.9% | node | `node::Start(int, char**)` |
| 0 | 5322 | 0.0% | 99.6% | node | `node::NodeMainInstance::Run()` |
| 0 | 5102 | 0.0% | 95.5% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 5102 | 0.0% | 95.5% | node | `uv_run` |
| 0 | 5029 | 0.0% | 94.1% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 0 | 5015 | 0.0% | 93.9% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 4955 | 0.0% | 92.7% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 4870 | 0.0% | 91.1% | node | `Builtins_JSEntry` |
| 0 | 4869 | 0.0% | 91.1% | node | `Builtins_JSEntryTrampoline` |
| 0 | 4868 | 0.0% | 91.1% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 4868 | 0.0% | 91.1% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 4793 | 0.0% | 89.7% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 4704 | 0.0% | 88.0% | node | `v8impl::(anonymous namespace)::FunctionCallbackWrapper::Invoke(v8::FunctionCallbackInfo<v8::Value> const&)` |
| 0 | 2800 | 0.0% | 52.4% | node | `node::Environment::CheckImmediate(uv_check_s*)` |
| 0 | 2800 | 0.0% | 52.4% | node | `uv__run_check` |
| 0 | 2799 | 0.0% | 52.4% | node | `node::InternalMakeCallback(v8::Isolate*, v8::Local<v8::Object>, v8::Local<v8::Function>, int, v8::Local<v8::Value>*, ...` |
| 0 | 2794 | 0.0% | 52.3% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 2793 | 0.0% | 52.3% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 2762 | 0.0% | 51.7% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 2452 | 0.0% | 45.9% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 4 | 2395 | 0.1% | 44.8% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 1 | 2302 | 0.0% | 43.1% | node | `uv__io_poll` |
| 0 | 2173 | 0.0% | 40.7% | node | `node::InternalCallbackScope::Close()` |
| 0 | 2171 | 0.0% | 40.6% | node | `Builtins_JSRunMicrotasksEntry` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 2794 | 0.0% | 52.3% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 2793 | 0.0% | 52.3% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 2762 | 0.0% | 51.7% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 2452 | 0.0% | 45.9% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 4 | 2395 | 0.1% | 44.8% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 1798 | 0.0% | 33.7% | reference-native.darwin-x64.node | `reference_native::atomic::__napi__compile_system` |
| 0 | 1792 | 0.0% | 33.5% | reference-native.darwin-x64.node | `atomic::compile` |
| 0 | 1766 | 0.0% | 33.1% | reference-native.darwin-x64.node | `std::thread::scoped::scope` |
| 0 | 1737 | 0.0% | 32.5% | reference-native.darwin-x64.node | `atomic::phase_parallel::drive_rounds` |
| 0 | 1111 | 0.0% | 20.8% | reference-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |
| 8 | 1009 | 0.1% | 18.9% | reference-native.darwin-x64.node | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 48 | 988 | 0.9% | 18.5% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 0 | 987 | 0.0% | 18.5% | reference-native.darwin-x64.node | `atomic::phase_merge::publish` |
| 0 | 985 | 0.0% | 18.4% | reference-native.darwin-x64.node | `atomic::hosts::resolve_prepared` |
| 0 | 984 | 0.0% | 18.4% | reference-native.darwin-x64.node | `styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 0 | 984 | 0.0% | 18.4% | reference-native.darwin-x64.node | `styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 0 | 983 | 0.0% | 18.4% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 0 | 967 | 0.0% | 18.1% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 0 | 967 | 0.0% | 18.1% | reference-native.darwin-x64.node | `styletrace::analysis::parser::parse_trace_module` |
| 0 | 959 | 0.0% | 17.9% | reference-native.darwin-x64.node | `styletrace::analysis::parser::fold_trace_module` |
