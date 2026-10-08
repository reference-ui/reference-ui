# Flame summary: enterprise (6f4cf1ba392f)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1085 samples (weight 1106) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 433 | 39.2% | libsystem_kernel.dylib |
| 220 | 19.9% | virtual-native.darwin-x64.node |
| 163 | 14.7% | node |
| 142 | 12.8% | libsystem_malloc.dylib |
| 103 | 9.3% | libsystem_platform.dylib |
| 31 | 2.8% | perf-16845.map |
| 6 | 0.5% | dyld |
| 4 | 0.4% | libsystem_c.dylib |
| 3 | 0.3% | libsystem_pthread.dylib |
| 1 | 0.1% | libc++abi.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 165.3 | 132 | node (81) |
| config | 28.1 | 24 | libsystem_kernel.dylib (14) |
| scan | 365.8 | 366 | libsystem_kernel.dylib (297) |
| evaluate | 6.0 | 6 | libsystem_kernel.dylib (5) |
| compile | 520.1 | 518 | virtual-native.darwin-x64.node (220) |
| publish | 52.5 | 52 | libsystem_kernel.dylib (28) |
| syncResidual | 0.0 | 0 | — (0) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 0 | — |
| postWorker samples | — | 8 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 139.5 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 237 | 237 | 21.4% | 21.4% | libsystem_kernel.dylib | `__open` |
| 61 | 61 | 5.5% | 5.5% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 60 | 68 | 5.4% | 6.1% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 41 | 41 | 3.7% | 3.7% | libsystem_kernel.dylib | `madvise` |
| 38 | 41 | 3.4% | 3.7% | libsystem_malloc.dylib | `_nanov2_free` |
| 37 | 37 | 3.3% | 3.3% | libsystem_kernel.dylib | `kevent` |
| 36 | 36 | 3.3% | 3.3% | libsystem_kernel.dylib | `read` |
| 34 | 34 | 3.1% | 3.1% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 16 | 16 | 1.4% | 1.4% | libsystem_kernel.dylib | `__write_nocancel` |
| 14 | 14 | 1.3% | 1.3% | libsystem_kernel.dylib | `__getdirentries64` |
| 13 | 27 | 1.2% | 2.4% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 13 | 13 | 1.2% | 1.2% | libsystem_kernel.dylib | `stat$INODE64` |
| 12 | 12 | 1.1% | 1.1% | libsystem_kernel.dylib | `__close_nocancel` |
| 8 | 8 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 8 | 9 | 0.7% | 0.8% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 8 | 12 | 0.7% | 1.1% | node | `v8::internal::Scanner::ScanString()` |
| 7 | 13 | 0.6% | 1.2% | perf-16845.map | `JS:*'relative node:path:1356:11` |
| 7 | 16 | 0.6% | 1.4% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 7 | 8 | 0.6% | 0.7% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 6 | 73 | 0.5% | 6.6% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 6 | 10 | 0.5% | 0.9% | perf-16845.map | `JS:*'resolve node:path:1245:10` |
| 6 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 5 | 5 | 0.5% | 0.5% | libsystem_platform.dylib | `_platform_bzero$VARIANT$Haswell` |
| 5 | 12 | 0.5% | 1.1% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 5 | 12 | 0.5% | 1.1% | virtual-native.darwin-x64.node | `core::slice::sort::stable::quicksort::quicksort` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 13 | 27 | 1.2% | 2.4% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 8 | 8 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 8 | 9 | 0.7% | 0.8% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 7 | 16 | 0.6% | 1.4% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 7 | 8 | 0.6% | 0.7% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 6 | 73 | 0.5% | 6.6% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 6 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 5 | 12 | 0.5% | 1.1% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 5 | 12 | 0.5% | 1.1% | virtual-native.darwin-x64.node | `core::slice::sort::stable::quicksort::quicksort` |
| 5 | 24 | 0.5% | 2.2% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 5 | 5 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `oxc_parser::module_record::ModuleRecordBuilder::add_module_request` |
| 4 | 7 | 0.4% | 0.6% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 4 | 6 | 0.4% | 0.5% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::entry::Entry<K,V,A>::or_default` |
| 4 | 24 | 0.4% | 2.2% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 4 | 4 | 0.4% | 0.4% | virtual-native.darwin-x64.node | `atomic::includes::glob::match_from` |
| 4 | 12 | 0.4% | 1.1% | virtual-native.darwin-x64.node | `canon::css::is_color_prop` |
| 4 | 4 | 0.4% | 0.4% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 4 | 9 | 0.4% | 0.8% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 4 | 11 | 0.4% | 1.0% | virtual-native.darwin-x64.node | `indexmap::inner::Core<K,V>::insert_full` |
| 3 | 5 | 0.3% | 0.5% | virtual-native.darwin-x64.node | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1106 | 0.0% | 100.0% | dyld | `start` |
| 0 | 1102 | 0.0% | 99.6% | node | `node::Start(int, char**)` |
| 0 | 1079 | 0.0% | 97.6% | node | `node::NodeMainInstance::Run()` |
| 1 | 1033 | 0.1% | 93.4% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 1033 | 0.0% | 93.4% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 0 | 961 | 0.0% | 86.9% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 961 | 0.0% | 86.9% | node | `uv_run` |
| 0 | 960 | 0.0% | 86.8% | node | `uv__io_poll` |
| 0 | 943 | 0.0% | 85.3% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 943 | 0.0% | 85.3% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 943 | 0.0% | 85.3% | node | `Builtins_RunMicrotasks` |
| 0 | 943 | 0.0% | 85.3% | node | `node::InternalCallbackScope::Close()` |
| 0 | 943 | 0.0% | 85.3% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 943 | 0.0% | 85.3% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 943 | 0.0% | 85.3% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 943 | 0.0% | 85.3% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 941 | 0.0% | 85.1% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 676 | 0.0% | 61.1% | node | `Builtins_JSEntry` |
| 0 | 676 | 0.0% | 61.1% | node | `Builtins_JSEntryTrampoline` |
| 0 | 673 | 0.0% | 60.8% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 673 | 0.0% | 60.8% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 673 | 0.0% | 60.8% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 564 | 0.0% | 51.0% | node | `node::AsyncWrap::MakeCallback(v8::Local<v8::Function>, int, v8::Local<v8::Value>*)` |
| 0 | 564 | 0.0% | 51.0% | node | `node::EmitToJSStreamListener::OnStreamRead(long, uv_buf_t const&)` |
| 0 | 564 | 0.0% | 51.0% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 500 | 0.0% | 45.2% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 0 | 476 | 0.0% | 43.0% | virtual-native.darwin-x64.node | `atomic::compile` |
| 1 | 98 | 0.1% | 8.9% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 6 | 73 | 0.5% | 6.6% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 3 | 68 | 0.3% | 6.1% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 1 | 67 | 0.1% | 6.1% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 0 | 56 | 0.0% | 5.1% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 1 | 55 | 0.1% | 5.0% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 0 | 47 | 0.0% | 4.2% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 0 | 46 | 0.0% | 4.2% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 46 | 0.1% | 4.2% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
| 0 | 37 | 0.0% | 3.3% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 2 | 36 | 0.2% | 3.3% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 0 | 32 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 0 | 31 | 0.0% | 2.8% | virtual-native.darwin-x64.node | `atomic::extract::css::extract` |
| 0 | 31 | 0.0% | 2.8% | virtual-native.darwin-x64.node | `atomic::extract::css::handle_css_arg` |
| 0 | 31 | 0.0% | 2.8% | virtual-native.darwin-x64.node | `atomic::hosts::resolve` |
| 0 | 28 | 0.0% | 2.5% | virtual-native.darwin-x64.node | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 13 | 27 | 1.2% | 2.4% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 0 | 27 | 0.0% | 2.4% | virtual-native.darwin-x64.node | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
