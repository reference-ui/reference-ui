# Flame summary: lib-styletrace (e9387f5ec)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 2984 samples (weight 3427) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 1478 | 43.1% | libsystem_malloc.dylib |
| 960 | 28.0% | libsystem_kernel.dylib |
| 586 | 17.1% | reference-native.darwin-x64.node |
| 227 | 6.6% | libsystem_platform.dylib |
| 153 | 4.5% | node |
| 10 | 0.3% | perf-22821.map |
| 5 | 0.1% | dyld |
| 2 | 0.1% | (unmapped jit) |
| 2 | 0.1% | libc++abi.dylib |
| 2 | 0.1% | libdyld.dylib |
| 1 | 0.0% | libsystem_pthread.dylib |
| 1 | 0.0% | libsystem_c.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 83.2 | 84 | node (45) |
| config | 34.8 | 30 | libsystem_kernel.dylib (20) |
| scan | 188.9 | 184 | libsystem_kernel.dylib (160) |
| evaluate | 9.5 | 10 | node (8) |
| compile | 1086.5 | 1080 | libsystem_kernel.dylib (361) |
| publish | 61.7 | 62 | libsystem_kernel.dylib (46) |
| syncResidual | 2.5 | 3 | node (2) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 64 | — |
| postWorker samples | — | 1910 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 203.3 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 326 | 722 | 9.5% | 21.1% | libsystem_malloc.dylib | `tiny_malloc_should_clear` |
| 321 | 321 | 9.4% | 9.4% | libsystem_kernel.dylib | `semaphore_wait_trap` |
| 318 | 682 | 9.3% | 19.9% | libsystem_malloc.dylib | `free_tiny` |
| 224 | 224 | 6.5% | 6.5% | libsystem_kernel.dylib | `kevent` |
| 133 | 133 | 3.9% | 3.9% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 133 | 321 | 3.9% | 9.4% | libsystem_malloc.dylib | `tiny_free_no_lock` |
| 132 | 283 | 3.9% | 8.3% | libsystem_malloc.dylib | `tiny_malloc_from_free_list` |
| 125 | 125 | 3.6% | 3.6% | libsystem_kernel.dylib | `stat$INODE64` |
| 116 | 116 | 3.4% | 3.4% | libsystem_kernel.dylib | `__open` |
| 106 | 106 | 3.1% | 3.1% | libsystem_malloc.dylib | `tiny_free_list_add_ptr` |
| 105 | 105 | 3.1% | 3.1% | libsystem_malloc.dylib | `rack_get_thread_index` |
| 105 | 105 | 3.1% | 3.1% | libsystem_malloc.dylib | `set_tiny_meta_header_in_use` |
| 82 | 162 | 2.4% | 4.7% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 71 | 71 | 2.1% | 2.1% | libsystem_malloc.dylib | `tiny_free_list_remove_ptr` |
| 64 | 64 | 1.9% | 1.9% | libsystem_kernel.dylib | `madvise` |
| 51 | 51 | 1.5% | 1.5% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 38 | 130 | 1.1% | 3.8% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 37 | 37 | 1.1% | 1.1% | libsystem_malloc.dylib | `_tiny_check_and_zero_inline_meta_from_freelist` |
| 34 | 34 | 1.0% | 1.0% | libsystem_malloc.dylib | `_szone_free` |
| 32 | 32 | 0.9% | 0.9% | libsystem_platform.dylib | `_platform_bzero$VARIANT$Haswell` |
| 31 | 84 | 0.9% | 2.5% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 28 | 116 | 0.8% | 3.4% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 25 | 751 | 0.7% | 21.9% | libsystem_malloc.dylib | `szone_malloc_should_clear` |
| 24 | 636 | 0.7% | 18.6% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 24 | 24 | 0.7% | 0.7% | libsystem_malloc.dylib | `_malloc_zone_malloc` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 82 | 162 | 2.4% | 4.7% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 38 | 130 | 1.1% | 3.8% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 31 | 84 | 0.9% | 2.5% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 28 | 116 | 0.8% | 3.4% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 24 | 636 | 0.7% | 18.6% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 20 | 62 | 0.6% | 1.8% | reference-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 19 | 563 | 0.6% | 16.4% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 16 | 16 | 0.5% | 0.5% | reference-native.darwin-x64.node | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 12 | 77 | 0.4% | 2.2% | reference-native.darwin-x64.node | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 11 | 21 | 0.3% | 0.6% | reference-native.darwin-x64.node | `core::iter::traits::iterator::Iterator::eq_by` |
| 9 | 55 | 0.3% | 1.6% | reference-native.darwin-x64.node | `core::slice::sort::stable::drift::sort` |
| 8 | 8 | 0.2% | 0.2% | reference-native.darwin-x64.node | `std::path::Components::parse_next_component_back` |
| 7 | 7 | 0.2% | 0.2% | reference-native.darwin-x64.node | `__rustc::__rust_alloc` |
| 7 | 1463 | 0.2% | 42.7% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 6 | 12 | 0.2% | 0.4% | reference-native.darwin-x64.node | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::mar...` |
| 6 | 26 | 0.2% | 0.8% | reference-native.darwin-x64.node | `indexmap::map::IndexMap<K,V,S>::insert_full` |
| 5 | 5 | 0.1% | 0.1% | reference-native.darwin-x64.node | `__rustc::__rust_dealloc` |
| 5 | 106 | 0.1% | 3.1% | reference-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_assignment_expression_or_higher_impl` |
| 5 | 12 | 0.1% | 0.4% | reference-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_literal_expression` |
| 5 | 200 | 0.1% | 5.8% | reference-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 3426 | 0.0% | 100.0% | dyld | `start` |
| 0 | 3422 | 0.0% | 99.9% | node | `node::Start(int, char**)` |
| 0 | 3403 | 0.0% | 99.3% | node | `node::NodeMainInstance::Run()` |
| 0 | 3268 | 0.0% | 95.4% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 3268 | 0.0% | 95.4% | node | `uv_run` |
| 0 | 3159 | 0.0% | 92.2% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 1 | 3148 | 0.0% | 91.9% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 3108 | 0.0% | 90.7% | node | `Builtins_JSEntry` |
| 1 | 3108 | 0.0% | 90.7% | node | `Builtins_JSEntryTrampoline` |
| 0 | 3107 | 0.0% | 90.7% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 3107 | 0.0% | 90.7% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 3095 | 0.0% | 90.3% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 3007 | 0.0% | 87.7% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 2939 | 0.0% | 85.8% | node | `v8impl::(anonymous namespace)::FunctionCallbackWrapper::Invoke(v8::FunctionCallbackInfo<v8::Value> const&)` |
| 0 | 1850 | 0.0% | 54.0% | node | `node::Environment::CheckImmediate(uv_check_s*)` |
| 0 | 1850 | 0.0% | 54.0% | node | `uv__run_check` |
| 0 | 1849 | 0.0% | 54.0% | node | `node::InternalMakeCallback(v8::Isolate*, v8::Local<v8::Object>, v8::Local<v8::Function>, int, v8::Local<v8::Value>*, ...` |
| 0 | 1844 | 0.0% | 53.8% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 1842 | 0.0% | 53.7% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 1815 | 0.0% | 53.0% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 1512 | 0.0% | 44.1% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 7 | 1463 | 0.2% | 42.7% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 1418 | 0.0% | 41.4% | node | `uv__io_poll` |
| 0 | 1260 | 0.0% | 36.8% | node | `node::InternalCallbackScope::Close()` |
| 0 | 1259 | 0.0% | 36.7% | node | `Builtins_JSRunMicrotasksEntry` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1844 | 0.0% | 53.8% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 1842 | 0.0% | 53.7% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 1815 | 0.0% | 53.0% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 1512 | 0.0% | 44.1% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 7 | 1463 | 0.2% | 42.7% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 1078 | 0.0% | 31.5% | reference-native.darwin-x64.node | `reference_native::atomic::__napi__compile_system` |
| 0 | 1072 | 0.0% | 31.3% | reference-native.darwin-x64.node | `atomic::compile` |
| 0 | 1046 | 0.0% | 30.5% | reference-native.darwin-x64.node | `std::thread::scoped::scope` |
| 0 | 1016 | 0.0% | 29.6% | reference-native.darwin-x64.node | `atomic::phase_parallel::drive_rounds` |
| 0 | 853 | 0.0% | 24.9% | reference-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |
| 4 | 751 | 0.1% | 21.9% | reference-native.darwin-x64.node | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 24 | 636 | 0.7% | 18.6% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 19 | 563 | 0.6% | 16.4% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 0 | 546 | 0.0% | 15.9% | reference-native.darwin-x64.node | `atomic::phase_merge::publish` |
| 0 | 544 | 0.0% | 15.9% | reference-native.darwin-x64.node | `atomic::hosts::resolve_prepared` |
| 0 | 543 | 0.0% | 15.8% | reference-native.darwin-x64.node | `styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 0 | 543 | 0.0% | 15.8% | reference-native.darwin-x64.node | `styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 0 | 542 | 0.0% | 15.8% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 0 | 533 | 0.0% | 15.6% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 0 | 533 | 0.0% | 15.6% | reference-native.darwin-x64.node | `styletrace::analysis::parser::parse_trace_module` |
