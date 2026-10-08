# Flame summary: lib-styletrace (ec4f6f725)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 2953 samples (weight 3371) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 1431 | 42.5% | libsystem_malloc.dylib |
| 1027 | 30.5% | libsystem_kernel.dylib |
| 541 | 16.0% | reference-native.darwin-x64.node |
| 178 | 5.3% | libsystem_platform.dylib |
| 170 | 5.0% | node |
| 14 | 0.4% | perf-27098.map |
| 4 | 0.1% | dyld |
| 2 | 0.1% | libsystem_c.dylib |
| 2 | 0.1% | libsystem_pthread.dylib |
| 1 | 0.0% | (unmapped jit) |
| 1 | 0.0% | libdyld.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 87.1 | 88 | node (59) |
| config | 30.3 | 25 | libsystem_kernel.dylib (17) |
| scan | 186.7 | 182 | libsystem_kernel.dylib (156) |
| evaluate | 9.3 | 10 | node (8) |
| compile | 952.1 | 952 | libsystem_kernel.dylib (327) |
| publish | 58.5 | 58 | libsystem_kernel.dylib (45) |
| syncResidual | 2.3 | 3 | node (2) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 66 | — |
| postWorker samples | — | 1987 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 215.5 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 311 | 628 | 9.2% | 18.6% | libsystem_malloc.dylib | `free_tiny` |
| 299 | 706 | 8.9% | 20.9% | libsystem_malloc.dylib | `tiny_malloc_should_clear` |
| 283 | 283 | 8.4% | 8.4% | libsystem_kernel.dylib | `semaphore_wait_trap` |
| 219 | 219 | 6.5% | 6.5% | libsystem_kernel.dylib | `kevent` |
| 148 | 148 | 4.4% | 4.4% | libsystem_kernel.dylib | `stat$INODE64` |
| 146 | 146 | 4.3% | 4.3% | libsystem_kernel.dylib | `madvise` |
| 142 | 295 | 4.2% | 8.8% | libsystem_malloc.dylib | `tiny_malloc_from_free_list` |
| 136 | 136 | 4.0% | 4.0% | libsystem_kernel.dylib | `__open` |
| 122 | 297 | 3.6% | 8.8% | libsystem_malloc.dylib | `tiny_free_no_lock` |
| 110 | 110 | 3.3% | 3.3% | libsystem_malloc.dylib | `set_tiny_meta_header_in_use` |
| 107 | 107 | 3.2% | 3.2% | libsystem_malloc.dylib | `tiny_free_list_add_ptr` |
| 104 | 104 | 3.1% | 3.1% | libsystem_malloc.dylib | `rack_get_thread_index` |
| 100 | 100 | 3.0% | 3.0% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 64 | 64 | 1.9% | 1.9% | libsystem_malloc.dylib | `tiny_free_list_remove_ptr` |
| 54 | 54 | 1.6% | 1.6% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 38 | 38 | 1.1% | 1.1% | libsystem_malloc.dylib | `_szone_free` |
| 34 | 208 | 1.0% | 6.2% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 30 | 86 | 0.9% | 2.6% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 29 | 574 | 0.9% | 17.0% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 28 | 28 | 0.8% | 0.8% | libsystem_malloc.dylib | `_tiny_check_and_zero_inline_meta_from_freelist` |
| 28 | 84 | 0.8% | 2.5% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 28 | 79 | 0.8% | 2.3% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 25 | 78 | 0.7% | 2.3% | reference-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 22 | 639 | 0.7% | 19.0% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 21 | 21 | 0.6% | 0.6% | libsystem_malloc.dylib | `_malloc_zone_malloc` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 34 | 208 | 1.0% | 6.2% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 30 | 86 | 0.9% | 2.6% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 29 | 574 | 0.9% | 17.0% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 28 | 84 | 0.8% | 2.5% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 28 | 79 | 0.8% | 2.3% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 25 | 78 | 0.7% | 2.3% | reference-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 22 | 639 | 0.7% | 19.0% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 18 | 18 | 0.5% | 0.5% | reference-native.darwin-x64.node | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 14 | 72 | 0.4% | 2.1% | reference-native.darwin-x64.node | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 12 | 51 | 0.4% | 1.5% | reference-native.darwin-x64.node | `core::slice::sort::stable::drift::sort` |
| 9 | 858 | 0.3% | 25.5% | reference-native.darwin-x64.node | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 9 | 27 | 0.3% | 0.8% | reference-native.darwin-x64.node | `indexmap::map::IndexMap<K,V,S>::insert_full` |
| 9 | 19 | 0.3% | 0.6% | reference-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_member_expression_rest` |
| 8 | 118 | 0.2% | 3.5% | reference-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binary_expression_or_higher` |
| 8 | 83 | 0.2% | 2.5% | reference-native.darwin-x64.node | `styletrace::resolver::parser::parse_type_expr_with_source` |
| 7 | 7 | 0.2% | 0.2% | reference-native.darwin-x64.node | `std::path::Components::parse_next_component_back` |
| 6 | 6 | 0.2% | 0.2% | reference-native.darwin-x64.node | `__rustc::__rust_no_alloc_shim_is_unstable_v2` |
| 6 | 12 | 0.2% | 0.4% | reference-native.darwin-x64.node | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::mar...` |
| 6 | 11 | 0.2% | 0.3% | reference-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_literal_expression` |
| 6 | 188 | 0.2% | 5.6% | reference-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 3368 | 0.0% | 99.9% | dyld | `start` |
| 0 | 3364 | 0.0% | 99.8% | node | `node::Start(int, char**)` |
| 0 | 3344 | 0.0% | 99.2% | node | `node::NodeMainInstance::Run()` |
| 0 | 3206 | 0.0% | 95.1% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 3206 | 0.0% | 95.1% | node | `uv_run` |
| 0 | 3105 | 0.0% | 92.1% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 2 | 3094 | 0.1% | 91.8% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 3059 | 0.0% | 90.7% | node | `Builtins_JSEntry` |
| 0 | 3059 | 0.0% | 90.7% | node | `Builtins_JSEntryTrampoline` |
| 0 | 3056 | 0.0% | 90.7% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 3056 | 0.0% | 90.7% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 3037 | 0.0% | 90.1% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 2953 | 0.0% | 87.6% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 2883 | 0.0% | 85.5% | node | `v8impl::(anonymous namespace)::FunctionCallbackWrapper::Invoke(v8::FunctionCallbackInfo<v8::Value> const&)` |
| 0 | 1924 | 0.0% | 57.1% | node | `node::Environment::CheckImmediate(uv_check_s*)` |
| 0 | 1924 | 0.0% | 57.1% | node | `node::InternalMakeCallback(v8::Isolate*, v8::Local<v8::Object>, v8::Local<v8::Function>, int, v8::Local<v8::Value>*, ...` |
| 0 | 1924 | 0.0% | 57.1% | node | `uv__run_check` |
| 0 | 1922 | 0.0% | 57.0% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 1920 | 0.0% | 57.0% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 1891 | 0.0% | 56.1% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 1580 | 0.0% | 46.9% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 6 | 1529 | 0.2% | 45.4% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 1282 | 0.0% | 38.0% | node | `uv__io_poll` |
| 0 | 1130 | 0.0% | 33.5% | node | `node::InternalCallbackScope::Close()` |
| 1 | 1129 | 0.0% | 33.5% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1922 | 0.0% | 57.0% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 1920 | 0.0% | 57.0% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 1891 | 0.0% | 56.1% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 1580 | 0.0% | 46.9% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 6 | 1529 | 0.2% | 45.4% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 949 | 0.0% | 28.2% | reference-native.darwin-x64.node | `reference_native::atomic::__napi__compile_system` |
| 0 | 943 | 0.0% | 28.0% | reference-native.darwin-x64.node | `atomic::compile` |
| 0 | 917 | 0.0% | 27.2% | reference-native.darwin-x64.node | `std::thread::scoped::scope` |
| 0 | 887 | 0.0% | 26.3% | reference-native.darwin-x64.node | `atomic::phase_parallel::drive_rounds` |
| 0 | 880 | 0.0% | 26.1% | reference-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |
| 9 | 858 | 0.3% | 25.5% | reference-native.darwin-x64.node | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 22 | 639 | 0.7% | 19.0% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 29 | 574 | 0.9% | 17.0% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 0 | 456 | 0.0% | 13.5% | reference-native.darwin-x64.node | `atomic::phase_merge::publish` |
| 0 | 454 | 0.0% | 13.5% | reference-native.darwin-x64.node | `atomic::hosts::resolve_prepared` |
| 0 | 452 | 0.0% | 13.4% | reference-native.darwin-x64.node | `styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 0 | 452 | 0.0% | 13.4% | reference-native.darwin-x64.node | `styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 0 | 451 | 0.0% | 13.4% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 0 | 447 | 0.0% | 13.3% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 0 | 447 | 0.0% | 13.3% | reference-native.darwin-x64.node | `styletrace::analysis::parser::parse_trace_module` |
