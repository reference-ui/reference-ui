# Flame summary: lib-styletrace (e9387f5ec)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 3016 samples (weight 3471) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 1421 | 40.9% | libsystem_malloc.dylib |
| 1064 | 30.7% | libsystem_kernel.dylib |
| 580 | 16.7% | reference-native.darwin-x64.node |
| 219 | 6.3% | libsystem_platform.dylib |
| 157 | 4.5% | node |
| 17 | 0.5% | perf-22726.map |
| 5 | 0.1% | dyld |
| 2 | 0.1% | libdyld.dylib |
| 2 | 0.1% | libsystem_c.dylib |
| 1 | 0.0% | (unmapped jit) |
| 1 | 0.0% | libc++.1.dylib |
| 1 | 0.0% | libsystem_pthread.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 85.8 | 86 | node (45) |
| config | 31.1 | 27 | libsystem_kernel.dylib (21) |
| scan | 187.3 | 182 | libsystem_kernel.dylib (166) |
| evaluate | 9.1 | 9 | node (8) |
| compile | 1081.5 | 1080 | libsystem_kernel.dylib (367) |
| publish | 56.7 | 57 | libsystem_kernel.dylib (39) |
| syncResidual | 2.7 | 4 | node (3) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 71 | — |
| postWorker samples | — | 1955 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 212.1 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 334 | 622 | 9.6% | 17.9% | libsystem_malloc.dylib | `free_tiny` |
| 323 | 323 | 9.3% | 9.3% | libsystem_kernel.dylib | `semaphore_wait_trap` |
| 292 | 716 | 8.4% | 20.6% | libsystem_malloc.dylib | `tiny_malloc_should_clear` |
| 222 | 222 | 6.4% | 6.4% | libsystem_kernel.dylib | `kevent` |
| 153 | 153 | 4.4% | 4.4% | libsystem_kernel.dylib | `__open` |
| 135 | 298 | 3.9% | 8.6% | libsystem_malloc.dylib | `tiny_malloc_from_free_list` |
| 131 | 131 | 3.8% | 3.8% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 131 | 131 | 3.8% | 3.8% | libsystem_kernel.dylib | `stat$INODE64` |
| 128 | 128 | 3.7% | 3.7% | libsystem_kernel.dylib | `madvise` |
| 114 | 114 | 3.3% | 3.3% | libsystem_malloc.dylib | `rack_get_thread_index` |
| 112 | 112 | 3.2% | 3.2% | libsystem_malloc.dylib | `set_tiny_meta_header_in_use` |
| 112 | 253 | 3.2% | 7.3% | libsystem_malloc.dylib | `tiny_free_no_lock` |
| 85 | 85 | 2.4% | 2.4% | libsystem_malloc.dylib | `tiny_free_list_add_ptr` |
| 69 | 153 | 2.0% | 4.4% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 60 | 60 | 1.7% | 1.7% | libsystem_malloc.dylib | `tiny_free_list_remove_ptr` |
| 54 | 54 | 1.6% | 1.6% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 37 | 37 | 1.1% | 1.1% | libsystem_malloc.dylib | `_tiny_check_and_zero_inline_meta_from_freelist` |
| 35 | 192 | 1.0% | 5.5% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 29 | 29 | 0.8% | 0.8% | libsystem_platform.dylib | `_platform_bzero$VARIANT$Haswell` |
| 29 | 29 | 0.8% | 0.8% | libsystem_malloc.dylib | `_szone_free` |
| 28 | 102 | 0.8% | 2.9% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 26 | 68 | 0.7% | 2.0% | reference-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 24 | 70 | 0.7% | 2.0% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 22 | 566 | 0.6% | 16.3% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 22 | 22 | 0.6% | 0.6% | libsystem_malloc.dylib | `_malloc_zone_malloc` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 69 | 153 | 2.0% | 4.4% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 35 | 192 | 1.0% | 5.5% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 28 | 102 | 0.8% | 2.9% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 26 | 68 | 0.7% | 2.0% | reference-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 24 | 70 | 0.7% | 2.0% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 22 | 566 | 0.6% | 16.3% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 21 | 645 | 0.6% | 18.6% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 19 | 19 | 0.5% | 0.5% | reference-native.darwin-x64.node | `std::path::Components::parse_next_component_back` |
| 17 | 17 | 0.5% | 0.5% | reference-native.darwin-x64.node | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 13 | 13 | 0.4% | 0.4% | reference-native.darwin-x64.node | `__rustc::__rust_dealloc` |
| 12 | 26 | 0.3% | 0.7% | reference-native.darwin-x64.node | `indexmap::map::IndexMap<K,V,S>::insert_full` |
| 10 | 105 | 0.3% | 3.0% | reference-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_lhs_expression_or_higher` |
| 9 | 51 | 0.3% | 1.5% | reference-native.darwin-x64.node | `core::slice::sort::stable::drift::sort` |
| 8 | 8 | 0.2% | 0.2% | reference-native.darwin-x64.node | `__rustc::__rust_alloc` |
| 7 | 26 | 0.2% | 0.7% | reference-native.darwin-x64.node | `<std::path::Components as core::iter::traits::double_ended::DoubleEndedIterator>::next_back` |
| 7 | 7 | 0.2% | 0.2% | reference-native.darwin-x64.node | `__rustc::__rust_no_alloc_shim_is_unstable_v2` |
| 7 | 12 | 0.2% | 0.3% | reference-native.darwin-x64.node | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::mar...` |
| 7 | 7 | 0.2% | 0.2% | reference-native.darwin-x64.node | `oxc_allocator::ident_hasher::ident_hash` |
| 7 | 109 | 0.2% | 3.1% | reference-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binary_expression_or_higher` |
| 6 | 67 | 0.2% | 1.9% | reference-native.darwin-x64.node | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 3470 | 0.0% | 100.0% | dyld | `start` |
| 0 | 3467 | 0.0% | 99.9% | node | `node::Start(int, char**)` |
| 0 | 3446 | 0.0% | 99.3% | node | `node::NodeMainInstance::Run()` |
| 0 | 3304 | 0.0% | 95.2% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 1 | 3304 | 0.0% | 95.2% | node | `uv_run` |
| 1 | 3205 | 0.0% | 92.3% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 2 | 3198 | 0.1% | 92.1% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 3154 | 0.0% | 90.9% | node | `Builtins_JSEntry` |
| 0 | 3154 | 0.0% | 90.9% | node | `Builtins_JSEntryTrampoline` |
| 0 | 3154 | 0.0% | 90.9% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 3154 | 0.0% | 90.9% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 3136 | 0.0% | 90.3% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 3049 | 0.0% | 87.8% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 2983 | 0.0% | 85.9% | node | `v8impl::(anonymous namespace)::FunctionCallbackWrapper::Invoke(v8::FunctionCallbackInfo<v8::Value> const&)` |
| 0 | 1896 | 0.0% | 54.6% | node | `node::Environment::CheckImmediate(uv_check_s*)` |
| 0 | 1896 | 0.0% | 54.6% | node | `uv__run_check` |
| 0 | 1894 | 0.0% | 54.6% | node | `node::InternalMakeCallback(v8::Isolate*, v8::Local<v8::Object>, v8::Local<v8::Function>, int, v8::Local<v8::Value>*, ...` |
| 0 | 1890 | 0.0% | 54.5% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 1888 | 0.0% | 54.4% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 1860 | 0.0% | 53.6% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 1552 | 0.0% | 44.7% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 5 | 1501 | 0.1% | 43.2% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 1407 | 0.0% | 40.5% | node | `uv__io_poll` |
| 0 | 1259 | 0.0% | 36.3% | node | `node::InternalCallbackScope::Close()` |
| 0 | 1257 | 0.0% | 36.2% | node | `Builtins_JSRunMicrotasksEntry` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1890 | 0.0% | 54.5% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 1888 | 0.0% | 54.4% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 1860 | 0.0% | 53.6% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 1552 | 0.0% | 44.7% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 5 | 1501 | 0.1% | 43.2% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 1079 | 0.0% | 31.1% | reference-native.darwin-x64.node | `reference_native::atomic::__napi__compile_system` |
| 0 | 1073 | 0.0% | 30.9% | reference-native.darwin-x64.node | `atomic::compile` |
| 0 | 1047 | 0.0% | 30.2% | reference-native.darwin-x64.node | `std::thread::scoped::scope` |
| 0 | 1018 | 0.0% | 29.3% | reference-native.darwin-x64.node | `atomic::phase_parallel::drive_rounds` |
| 1 | 873 | 0.0% | 25.2% | reference-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |
| 5 | 850 | 0.1% | 24.5% | reference-native.darwin-x64.node | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 21 | 645 | 0.6% | 18.6% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 22 | 566 | 0.6% | 16.3% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 0 | 547 | 0.0% | 15.8% | reference-native.darwin-x64.node | `atomic::phase_merge::publish` |
| 0 | 545 | 0.0% | 15.7% | reference-native.darwin-x64.node | `atomic::hosts::resolve_prepared` |
| 0 | 543 | 0.0% | 15.6% | reference-native.darwin-x64.node | `styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 0 | 543 | 0.0% | 15.6% | reference-native.darwin-x64.node | `styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 0 | 542 | 0.0% | 15.6% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 0 | 533 | 0.0% | 15.4% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 0 | 533 | 0.0% | 15.4% | reference-native.darwin-x64.node | `styletrace::analysis::parser::parse_trace_module` |
