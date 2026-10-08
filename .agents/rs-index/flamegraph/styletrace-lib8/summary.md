# Flame summary: lib-styletrace (ec4f6f725)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 2872 samples (weight 3263) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 1430 | 43.8% | libsystem_malloc.dylib |
| 922 | 28.3% | libsystem_kernel.dylib |
| 525 | 16.1% | reference-native.darwin-x64.node |
| 194 | 5.9% | libsystem_platform.dylib |
| 164 | 5.0% | node |
| 14 | 0.4% | perf-27181.map |
| 5 | 0.2% | dyld |
| 5 | 0.2% | libsystem_pthread.dylib |
| 1 | 0.0% | (unmapped jit) |
| 1 | 0.0% | libdyld.dylib |
| 1 | 0.0% | libsystem_c.dylib |
| 1 | 0.0% | libc++abi.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 83.5 | 83 | node (50) |
| config | 30.7 | 26 | libsystem_kernel.dylib (17) |
| scan | 181.2 | 177 | libsystem_kernel.dylib (156) |
| evaluate | 9.5 | 10 | node (7) |
| compile | 936.4 | 935 | libsystem_malloc.dylib (318) |
| publish | 61.5 | 61 | libsystem_kernel.dylib (43) |
| syncResidual | 2.3 | 4 | node (3) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 69 | — |
| postWorker samples | — | 1898 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 208.2 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 325 | 681 | 10.0% | 20.9% | libsystem_malloc.dylib | `free_tiny` |
| 278 | 679 | 8.5% | 20.8% | libsystem_malloc.dylib | `tiny_malloc_should_clear` |
| 265 | 265 | 8.1% | 8.1% | libsystem_kernel.dylib | `semaphore_wait_trap` |
| 212 | 212 | 6.5% | 6.5% | libsystem_kernel.dylib | `kevent` |
| 150 | 327 | 4.6% | 10.0% | libsystem_malloc.dylib | `tiny_free_no_lock` |
| 137 | 137 | 4.2% | 4.2% | libsystem_kernel.dylib | `stat$INODE64` |
| 136 | 269 | 4.2% | 8.2% | libsystem_malloc.dylib | `tiny_malloc_from_free_list` |
| 125 | 125 | 3.8% | 3.8% | libsystem_kernel.dylib | `__open` |
| 125 | 125 | 3.8% | 3.8% | libsystem_malloc.dylib | `rack_get_thread_index` |
| 95 | 95 | 2.9% | 2.9% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 94 | 94 | 2.9% | 2.9% | libsystem_malloc.dylib | `set_tiny_meta_header_in_use` |
| 84 | 84 | 2.6% | 2.6% | libsystem_malloc.dylib | `tiny_free_list_add_ptr` |
| 82 | 82 | 2.5% | 2.5% | libsystem_malloc.dylib | `tiny_free_list_remove_ptr` |
| 67 | 67 | 2.1% | 2.1% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 67 | 67 | 2.1% | 2.1% | libsystem_kernel.dylib | `madvise` |
| 45 | 138 | 1.4% | 4.2% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 39 | 39 | 1.2% | 1.2% | libsystem_malloc.dylib | `_szone_free` |
| 39 | 82 | 1.2% | 2.5% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 36 | 118 | 1.1% | 3.6% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 27 | 27 | 0.8% | 0.8% | libsystem_malloc.dylib | `_tiny_check_and_zero_inline_meta_from_freelist` |
| 25 | 25 | 0.8% | 0.8% | libsystem_platform.dylib | `_platform_bzero$VARIANT$Haswell` |
| 24 | 81 | 0.7% | 2.5% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 23 | 23 | 0.7% | 0.7% | libsystem_kernel.dylib | `read` |
| 20 | 600 | 0.6% | 18.4% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 19 | 55 | 0.6% | 1.7% | reference-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 45 | 138 | 1.4% | 4.2% | reference-native.darwin-x64.node | `alloc::collections::btree::append::<impl alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::ma...` |
| 39 | 82 | 1.2% | 2.5% | reference-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 36 | 118 | 1.1% | 3.6% | reference-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 24 | 81 | 0.7% | 2.5% | reference-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 20 | 600 | 0.6% | 18.4% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 19 | 55 | 0.6% | 1.7% | reference-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 17 | 533 | 0.5% | 16.3% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 11 | 11 | 0.3% | 0.3% | reference-native.darwin-x64.node | `oxc_parser::lexer::identifier::<impl oxc_parser::lexer::Lexer>::identifier_name_handler` |
| 11 | 11 | 0.3% | 0.3% | reference-native.darwin-x64.node | `std::path::Components::parse_next_component_back` |
| 10 | 49 | 0.3% | 1.5% | reference-native.darwin-x64.node | `core::slice::sort::stable::drift::sort` |
| 9 | 9 | 0.3% | 0.3% | reference-native.darwin-x64.node | `__rustc::__rust_dealloc` |
| 8 | 112 | 0.2% | 3.4% | reference-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binary_expression_or_higher` |
| 7 | 7 | 0.2% | 0.2% | reference-native.darwin-x64.node | `__rustc::__rdl_alloc` |
| 7 | 25 | 0.2% | 0.8% | reference-native.darwin-x64.node | `indexmap::map::IndexMap<K,V,S>::insert_full` |
| 7 | 66 | 0.2% | 2.0% | reference-native.darwin-x64.node | `serde_json::value::de::<impl serde_core::de::Deserialize for serde_json::value::Value>::deserialize` |
| 6 | 6 | 0.2% | 0.2% | reference-native.darwin-x64.node | `__rustc::__rust_alloc` |
| 6 | 112 | 0.2% | 3.4% | reference-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_lhs_expression_or_higher` |
| 6 | 25 | 0.2% | 0.8% | reference-native.darwin-x64.node | `oxc_parser::jsx::<impl oxc_parser::ParserImpl>::parse_jsx_element` |
| 6 | 6 | 0.2% | 0.2% | reference-native.darwin-x64.node | `oxc_parser::lexer::whitespace::<impl oxc_parser::lexer::Lexer>::line_break_handler` |
| 5 | 5 | 0.2% | 0.2% | reference-native.darwin-x64.node | `oxc_allocator::ident_hasher::ident_hash` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 3262 | 0.0% | 100.0% | dyld | `start` |
| 0 | 3258 | 0.0% | 99.8% | node | `node::Start(int, char**)` |
| 0 | 3237 | 0.0% | 99.2% | node | `node::NodeMainInstance::Run()` |
| 0 | 3099 | 0.0% | 95.0% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 3099 | 0.0% | 95.0% | node | `uv_run` |
| 0 | 3001 | 0.0% | 92.0% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 2 | 2991 | 0.1% | 91.7% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 2952 | 0.0% | 90.5% | node | `Builtins_JSEntry` |
| 0 | 2952 | 0.0% | 90.5% | node | `Builtins_JSEntryTrampoline` |
| 0 | 2951 | 0.0% | 90.4% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 2951 | 0.0% | 90.4% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 2931 | 0.0% | 89.8% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 2852 | 0.0% | 87.4% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 2777 | 0.0% | 85.1% | node | `v8impl::(anonymous namespace)::FunctionCallbackWrapper::Invoke(v8::FunctionCallbackInfo<v8::Value> const&)` |
| 0 | 1835 | 0.0% | 56.2% | node | `node::Environment::CheckImmediate(uv_check_s*)` |
| 0 | 1835 | 0.0% | 56.2% | node | `node::InternalMakeCallback(v8::Isolate*, v8::Local<v8::Object>, v8::Local<v8::Function>, int, v8::Local<v8::Value>*, ...` |
| 0 | 1835 | 0.0% | 56.2% | node | `uv__run_check` |
| 0 | 1831 | 0.0% | 56.1% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 1829 | 0.0% | 56.1% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 1800 | 0.0% | 55.2% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 1485 | 0.0% | 45.5% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 4 | 1435 | 0.1% | 44.0% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 1264 | 0.0% | 38.7% | node | `uv__io_poll` |
| 1 | 1110 | 0.0% | 34.0% | node | `node::InternalCallbackScope::Close()` |
| 0 | 1109 | 0.0% | 34.0% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1831 | 0.0% | 56.1% | reference-native.darwin-x64.node | `reference_native::tasty::__napi__scan_and_emit_modules` |
| 0 | 1829 | 0.0% | 56.1% | reference-native.darwin-x64.node | `tasty::scan::scan_and_emit_modules` |
| 0 | 1800 | 0.0% | 55.2% | reference-native.darwin-x64.node | `tasty::scan::scan_typescript_bundle` |
| 0 | 1485 | 0.0% | 45.5% | reference-native.darwin-x64.node | `tasty::scanner::workspace::scan_workspace` |
| 4 | 1435 | 0.1% | 44.0% | reference-native.darwin-x64.node | `tasty::scanner::workspace::crawler::Crawler::run` |
| 0 | 933 | 0.0% | 28.6% | reference-native.darwin-x64.node | `reference_native::atomic::__napi__compile_system` |
| 0 | 927 | 0.0% | 28.4% | reference-native.darwin-x64.node | `atomic::compile` |
| 0 | 903 | 0.0% | 27.7% | reference-native.darwin-x64.node | `std::thread::scoped::scope` |
| 0 | 875 | 0.0% | 26.8% | reference-native.darwin-x64.node | `atomic::phase_parallel::drive_rounds` |
| 0 | 845 | 0.0% | 25.9% | reference-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter::SpecFromIter<T,I>>::from_iter` |
| 4 | 744 | 0.1% | 22.8% | reference-native.darwin-x64.node | `<alloc::collections::btree::set::BTreeSet<T> as core::iter::traits::collect::FromIterator<T>>::from_iter` |
| 20 | 600 | 0.6% | 18.4% | reference-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |
| 17 | 533 | 0.5% | 16.3% | reference-native.darwin-x64.node | `<core::iter::adapters::cloned::Cloned<I> as core::iter::traits::iterator::Iterator>::fold` |
| 0 | 462 | 0.0% | 14.2% | reference-native.darwin-x64.node | `atomic::phase_merge::publish` |
| 0 | 460 | 0.0% | 14.1% | reference-native.darwin-x64.node | `atomic::hosts::resolve_prepared` |
| 0 | 458 | 0.0% | 14.0% | reference-native.darwin-x64.node | `styletrace::analysis::surface::SurfaceTraceSession::trace_with` |
| 0 | 458 | 0.0% | 14.0% | reference-native.darwin-x64.node | `styletrace::analysis::surface::trace_style_bindings_with_modules` |
| 0 | 457 | 0.0% | 14.0% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::collect_exported_bindings` |
| 0 | 447 | 0.0% | 13.7% | reference-native.darwin-x64.node | `styletrace::analysis::analyzer::StyleTraceAnalyzer::ensure_module_loaded` |
| 0 | 446 | 0.0% | 13.7% | reference-native.darwin-x64.node | `styletrace::analysis::parser::parse_trace_module` |
