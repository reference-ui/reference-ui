# Flame summary: lib-styletrace (84faa918f)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 2895 samples (weight 3302) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 1469 | 44.5% | libsystem_malloc.dylib |
| 936 | 28.3% | libsystem_kernel.dylib |
| 509 | 15.4% | reference-native.darwin-x64.node |
| 195 | 5.9% | libsystem_platform.dylib |
| 166 | 5.0% | node |
| 15 | 0.5% | perf-25249.map |
| 5 | 0.2% | dyld |
| 3 | 0.1% | libsystem_c.dylib |
| 2 | 0.1% | libdyld.dylib |
| 1 | 0.0% | (unmapped jit) |
| 1 | 0.0% | libsystem_pthread.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 84.7 | 84 | node (49) |
| config | 30.9 | 27 | libsystem_kernel.dylib (17) |
| scan | 184.1 | 178 | libsystem_kernel.dylib (155) |
| evaluate | 9.6 | 10 | node (7) |
| compile | 955.1 | 954 | libsystem_malloc.dylib (335) |
| publish | 56.4 | 57 | libsystem_kernel.dylib (40) |
| syncResidual | 2.3 | 2 | libsystem_kernel.dylib (1) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 70 | — |
| postWorker samples | — | 1920 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 230.1 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 347 | 671 | 10.5% | 20.3% | libsystem_malloc.dylib | `free_tiny` |
| 321 | 720 | 9.7% | 21.8% | libsystem_malloc.dylib | `tiny_malloc_should_clear` |
| 279 | 279 | 8.4% | 8.4% | libsystem_kernel.dylib | `semaphore_wait_trap` |
| 214 | 214 | 6.5% | 6.5% | libsystem_kernel.dylib | `kevent` |
| 143 | 282 | 4.3% | 8.5% | libsystem_malloc.dylib | `tiny_malloc_from_free_list` |
| 131 | 131 | 4.0% | 4.0% | libsystem_kernel.dylib | `__open` |
| 124 | 124 | 3.8% | 3.8% | libsystem_kernel.dylib | `stat$INODE64` |
| 122 | 295 | 3.7% | 8.9% | libsystem_malloc.dylib | `tiny_free_no_lock` |
| 113 | 113 | 3.4% | 3.4% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 110 | 110 | 3.3% | 3.3% | libsystem_malloc.dylib | `rack_get_thread_index` |
| 106 | 106 | 3.2% | 3.2% | libsystem_malloc.dylib | `set_tiny_meta_header_in_use` |
| 97 | 97 | 2.9% | 2.9% | libsystem_malloc.dylib | `tiny_free_list_add_ptr` |
| 82 | 82 | 2.5% | 2.5% | libsystem_kernel.dylib | `madvise` |
| 64 | 64 | 1.9% | 1.9% | libsystem_malloc.dylib | `tiny_free_list_remove_ptr` |
| 52 | 52 | 1.6% | 1.6% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 37 | 87 | 1.1% | 2.6% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 36 | 151 | 1.1% | 4.6% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 34 | 99 | 1.0% | 3.0% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 30 | 564 | 0.9% | 17.1% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 28 | 88 | 0.8% | 2.7% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 27 | 27 | 0.8% | 0.8% | libsystem_malloc.dylib | `_szone_free` |
| 23 | 23 | 0.7% | 0.7% | libsystem_platform.dylib | `_platform_bzero$VARIANT$Haswell` |
| 21 | 745 | 0.6% | 22.6% | libsystem_malloc.dylib | `szone_malloc_should_clear` |
| 20 | 20 | 0.6% | 0.6% | libsystem_malloc.dylib | `_tiny_check_and_zero_inline_meta_from_freelist` |
| 20 | 20 | 0.6% | 0.6% | libsystem_malloc.dylib | `get_tiny_previous_free_msize` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 37 | 87 | 1.1% | 2.6% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 36 | 151 | 1.1% | 4.6% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 34 | 99 | 1.0% | 3.0% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 30 | 564 | 0.9% | 17.1% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 28 | 88 | 0.8% | 2.7% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 17 | 621 | 0.5% | 18.8% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 16 | 72 | 0.5% | 2.2% | reference-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 15 | 58 | 0.5% | 1.8% | reference-native.darwin-x64.node | `core::slice::sort::stable::drift::sort` |
| 13 | 13 | 0.4% | 0.4% | reference-native.darwin-x64.node | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 12 | 71 | 0.4% | 2.2% | reference-native.darwin-x64.node | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 9 | 123 | 0.3% | 3.7% | reference-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binary_expression_or_higher` |
| 8 | 8 | 0.2% | 0.2% | reference-native.darwin-x64.node | `std::path::Components::parse_next_component_back` |
| 7 | 20 | 0.2% | 0.6% | reference-native.darwin-x64.node | `indexmap::map::IndexMap<K,V,S>::insert_full` |
| 6 | 6 | 0.2% | 0.2% | reference-native.darwin-x64.node | `<serde_json::de::MapAccess<R> as serde_core::de::MapAccess>::next_key_seed::has_next_key` |
| 6 | 10 | 0.2% | 0.3% | reference-native.darwin-x64.node | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::mar...` |
| 6 | 30 | 0.2% | 0.9% | reference-native.darwin-x64.node | `oxc_parser::jsx::<impl oxc_parser::ParserImpl>::parse_jsx_element` |
| 6 | 6 | 0.2% | 0.2% | reference-native.darwin-x64.node | `oxc_parser::lexer::whitespace::<impl oxc_parser::lexer::Lexer>::line_break_handler` |
| 6 | 1472 | 0.2% | 44.6% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 5 | 83 | 0.2% | 2.5% | reference-native.darwin-x64.node | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 5 | 5 | 0.2% | 0.2% | reference-native.darwin-x64.node | `__rustc::__rust_alloc` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 3300 | 0.0% | 99.9% | dyld | `start` |
| 0 | 3296 | 0.0% | 99.8% | node | `node::Start(int, char**)` |
| 0 | 3277 | 0.0% | 99.2% | node | `node::NodeMainInstance::Run()` |
| 0 | 3137 | 0.0% | 95.0% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 3137 | 0.0% | 95.0% | node | `uv_run` |
| 0 | 3043 | 0.0% | 92.2% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 1 | 3032 | 0.0% | 91.8% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 2996 | 0.0% | 90.7% | node | `Builtins_JSEntry` |
| 0 | 2996 | 0.0% | 90.7% | node | `Builtins_JSEntryTrampoline` |
| 0 | 2994 | 0.0% | 90.7% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 2994 | 0.0% | 90.7% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 2974 | 0.0% | 90.1% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 2891 | 0.0% | 87.6% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 2821 | 0.0% | 85.4% | node | `v8impl::(anonymous namespace)::FunctionCallbackWrapper::Invoke(v8::FunctionCallbackInfo<v8::Value> const&)` |
| 1 | 1859 | 0.0% | 56.3% | node | `uv__run_check` |
| 0 | 1858 | 0.0% | 56.3% | node | `node::Environment::CheckImmediate(uv_check_s*)` |
| 0 | 1858 | 0.0% | 56.3% | node | `node::InternalMakeCallback(v8::Isolate*, v8::Local<v8::Object>, v8::Local<v8::Function>, int, v8::Local<v8::Value>*, ...` |
| 0 | 1855 | 0.0% | 56.2% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 1852 | 0.0% | 56.1% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 1825 | 0.0% | 55.3% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 1522 | 0.0% | 46.1% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 6 | 1472 | 0.2% | 44.6% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 1277 | 0.0% | 38.7% | node | `uv__io_poll` |
| 0 | 1131 | 0.0% | 34.3% | node | `node::InternalCallbackScope::Close()` |
| 0 | 1130 | 0.0% | 34.2% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1855 | 0.0% | 56.2% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 1852 | 0.0% | 56.1% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 1825 | 0.0% | 55.3% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 1522 | 0.0% | 46.1% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 6 | 1472 | 0.2% | 44.6% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 952 | 0.0% | 28.8% | reference-native.darwin-x64.node | `reference_native::atomic::__napi__compile_system` |
| 0 | 947 | 0.0% | 28.7% | reference-native.darwin-x64.node | `atomic::compile` |
| 0 | 920 | 0.0% | 27.9% | reference-native.darwin-x64.node | `std::thread::scoped::scope` |
| 0 | 891 | 0.0% | 27.0% | reference-native.darwin-x64.node | `atomic::phase_parallel::drive_rounds` |
| 1 | 863 | 0.0% | 26.1% | reference-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |
| 0 | 798 | 0.0% | 24.2% | reference-native.darwin-x64.node | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 17 | 621 | 0.5% | 18.8% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 30 | 564 | 0.9% | 17.1% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 0 | 461 | 0.0% | 14.0% | reference-native.darwin-x64.node | `atomic::phase_merge::publish` |
| 0 | 458 | 0.0% | 13.9% | reference-native.darwin-x64.node | `atomic::hosts::resolve_prepared` |
| 0 | 457 | 0.0% | 13.8% | reference-native.darwin-x64.node | `styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 0 | 457 | 0.0% | 13.8% | reference-native.darwin-x64.node | `styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 0 | 456 | 0.0% | 13.8% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 0 | 449 | 0.0% | 13.6% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 0 | 449 | 0.0% | 13.6% | reference-native.darwin-x64.node | `styletrace::analysis::parser::parse_trace_module` |
