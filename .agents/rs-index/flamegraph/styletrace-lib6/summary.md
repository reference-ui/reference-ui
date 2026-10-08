# Flame summary: lib-styletrace (84faa918f)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 2924 samples (weight 3320) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 1439 | 43.3% | libsystem_malloc.dylib |
| 966 | 29.1% | libsystem_kernel.dylib |
| 539 | 16.2% | reference-native.darwin-x64.node |
| 196 | 5.9% | libsystem_platform.dylib |
| 159 | 4.8% | node |
| 10 | 0.3% | perf-25329.map |
| 5 | 0.2% | dyld |
| 3 | 0.1% | libsystem_c.dylib |
| 2 | 0.1% | libc++.1.dylib |
| 1 | 0.0% | libobjc.A.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 84.5 | 85 | node (49) |
| config | 30.8 | 27 | libsystem_kernel.dylib (20) |
| scan | 184.1 | 180 | libsystem_kernel.dylib (153) |
| evaluate | 9.6 | 9 | node (7) |
| compile | 947.0 | 946 | libsystem_malloc.dylib (322) |
| publish | 58.1 | 59 | libsystem_kernel.dylib (40) |
| syncResidual | 2.4 | 2 | libobjc.A.dylib (1) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 68 | — |
| postWorker samples | — | 1944 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 206.9 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 344 | 685 | 10.4% | 20.6% | libsystem_malloc.dylib | `free_tiny` |
| 303 | 673 | 9.1% | 20.3% | libsystem_malloc.dylib | `tiny_malloc_should_clear` |
| 277 | 277 | 8.3% | 8.3% | libsystem_kernel.dylib | `semaphore_wait_trap` |
| 213 | 213 | 6.4% | 6.4% | libsystem_kernel.dylib | `kevent` |
| 148 | 148 | 4.5% | 4.5% | libsystem_kernel.dylib | `__open` |
| 142 | 305 | 4.3% | 9.2% | libsystem_malloc.dylib | `tiny_free_no_lock` |
| 136 | 264 | 4.1% | 8.0% | libsystem_malloc.dylib | `tiny_malloc_from_free_list` |
| 125 | 125 | 3.8% | 3.8% | libsystem_kernel.dylib | `stat$INODE64` |
| 120 | 120 | 3.6% | 3.6% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 95 | 95 | 2.9% | 2.9% | libsystem_malloc.dylib | `rack_get_thread_index` |
| 91 | 91 | 2.7% | 2.7% | libsystem_malloc.dylib | `set_tiny_meta_header_in_use` |
| 87 | 87 | 2.6% | 2.6% | libsystem_kernel.dylib | `madvise` |
| 82 | 82 | 2.5% | 2.5% | libsystem_malloc.dylib | `tiny_free_list_add_ptr` |
| 66 | 66 | 2.0% | 2.0% | libsystem_malloc.dylib | `tiny_free_list_remove_ptr` |
| 42 | 42 | 1.3% | 1.3% | libsystem_malloc.dylib | `_szone_free` |
| 40 | 40 | 1.2% | 1.2% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 34 | 71 | 1.0% | 2.1% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 32 | 80 | 1.0% | 2.4% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 31 | 31 | 0.9% | 0.9% | libsystem_malloc.dylib | `_tiny_check_and_zero_inline_meta_from_freelist` |
| 31 | 162 | 0.9% | 4.9% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 29 | 29 | 0.9% | 0.9% | libsystem_platform.dylib | `_platform_bzero$VARIANT$Haswell` |
| 28 | 523 | 0.8% | 15.8% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 25 | 86 | 0.8% | 2.6% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 24 | 24 | 0.7% | 0.7% | libsystem_kernel.dylib | `read` |
| 23 | 584 | 0.7% | 17.6% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 34 | 71 | 1.0% | 2.1% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 32 | 80 | 1.0% | 2.4% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 31 | 162 | 0.9% | 4.9% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 28 | 523 | 0.8% | 15.8% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 25 | 86 | 0.8% | 2.6% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 23 | 584 | 0.7% | 17.6% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 20 | 64 | 0.6% | 1.9% | reference-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 12 | 12 | 0.4% | 0.4% | reference-native.darwin-x64.node | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 11 | 65 | 0.3% | 2.0% | reference-native.darwin-x64.node | `core::slice::sort::stable::drift::sort` |
| 11 | 75 | 0.3% | 2.3% | reference-native.darwin-x64.node | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 10 | 152 | 0.3% | 4.6% | reference-native.darwin-x64.node | `<alloc::vec::into_iter::IntoIter<T,A> as core::iter::traits::iterator::Iterator>::try_fold` |
| 10 | 119 | 0.3% | 3.6% | reference-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_assignment_expression_or_higher_impl` |
| 10 | 10 | 0.3% | 0.3% | reference-native.darwin-x64.node | `std::path::Components::parse_next_component_back` |
| 7 | 40 | 0.2% | 1.2% | reference-native.darwin-x64.node | `<serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize::ValueVisitor as...` |
| 7 | 7 | 0.2% | 0.2% | reference-native.darwin-x64.node | `core::slice::memchr::memchr_aligned` |
| 7 | 1495 | 0.2% | 45.0% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 6 | 22 | 0.2% | 0.7% | reference-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_member_expression_rest` |
| 6 | 6 | 0.2% | 0.2% | reference-native.darwin-x64.node | `serde_json::read::SliceRead::skip_to_escape` |
| 5 | 74 | 0.2% | 2.2% | reference-native.darwin-x64.node | `<alloc::collections::btree::map::BTreeMap<K,V,A> as core::clone::Clone>::clone::clone_subtree` |
| 5 | 5 | 0.2% | 0.2% | reference-native.darwin-x64.node | `<alloc::collections::btree::map::Iter<K,V> as core::iter::traits::iterator::Iterator>::next` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 3320 | 0.0% | 100.0% | dyld | `start` |
| 0 | 3316 | 0.0% | 99.9% | node | `node::Start(int, char**)` |
| 0 | 3297 | 0.0% | 99.3% | node | `node::NodeMainInstance::Run()` |
| 0 | 3157 | 0.0% | 95.1% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 3157 | 0.0% | 95.1% | node | `uv_run` |
| 1 | 3066 | 0.0% | 92.3% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 1 | 3050 | 0.0% | 91.9% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 3015 | 0.0% | 90.8% | node | `Builtins_JSEntry` |
| 0 | 3015 | 0.0% | 90.8% | node | `Builtins_JSEntryTrampoline` |
| 0 | 3012 | 0.0% | 90.7% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 3011 | 0.0% | 90.7% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 2991 | 0.0% | 90.1% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 2910 | 0.0% | 87.7% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 2837 | 0.0% | 85.5% | node | `v8impl::(anonymous namespace)::FunctionCallbackWrapper::Invoke(v8::FunctionCallbackInfo<v8::Value> const&)` |
| 0 | 1881 | 0.0% | 56.7% | node | `node::Environment::CheckImmediate(uv_check_s*)` |
| 0 | 1881 | 0.0% | 56.7% | node | `node::InternalMakeCallback(v8::Isolate*, v8::Local<v8::Object>, v8::Local<v8::Function>, int, v8::Local<v8::Value>*, ...` |
| 0 | 1881 | 0.0% | 56.7% | node | `uv__run_check` |
| 0 | 1878 | 0.0% | 56.6% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 1877 | 0.0% | 56.5% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 1848 | 0.0% | 55.7% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 1545 | 0.0% | 46.5% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 7 | 1495 | 0.2% | 45.0% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 1276 | 0.0% | 38.4% | node | `uv__io_poll` |
| 0 | 1129 | 0.0% | 34.0% | node | `node::InternalCallbackScope::Close()` |
| 0 | 1126 | 0.0% | 33.9% | node | `Builtins_JSRunMicrotasksEntry` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1878 | 0.0% | 56.6% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 1877 | 0.0% | 56.5% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 1848 | 0.0% | 55.7% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 1545 | 0.0% | 46.5% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 7 | 1495 | 0.2% | 45.0% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 944 | 0.0% | 28.4% | reference-native.darwin-x64.node | `reference_native::atomic::__napi__compile_system` |
| 0 | 938 | 0.0% | 28.3% | reference-native.darwin-x64.node | `atomic::compile` |
| 0 | 912 | 0.0% | 27.5% | reference-native.darwin-x64.node | `std::thread::scoped::scope` |
| 0 | 884 | 0.0% | 26.6% | reference-native.darwin-x64.node | `atomic::phase_parallel::drive_rounds` |
| 0 | 820 | 0.0% | 24.7% | reference-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |
| 0 | 781 | 0.0% | 23.5% | reference-native.darwin-x64.node | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 23 | 584 | 0.7% | 17.6% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 28 | 523 | 0.8% | 15.8% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 0 | 460 | 0.0% | 13.9% | reference-native.darwin-x64.node | `atomic::phase_merge::publish` |
| 0 | 458 | 0.0% | 13.8% | reference-native.darwin-x64.node | `atomic::hosts::resolve_prepared` |
| 0 | 456 | 0.0% | 13.7% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 0 | 456 | 0.0% | 13.7% | reference-native.darwin-x64.node | `styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 0 | 456 | 0.0% | 13.7% | reference-native.darwin-x64.node | `styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 0 | 449 | 0.0% | 13.5% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 0 | 448 | 0.0% | 13.5% | reference-native.darwin-x64.node | `styletrace::analysis::parser::parse_trace_module` |
