# Flame summary: enterprise (b8a75b0bd74c)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1094 samples (weight 1119) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 435 | 38.9% | libsystem_kernel.dylib |
| 240 | 21.4% | virtual-native.darwin-x64.node |
| 165 | 14.7% | node |
| 143 | 12.8% | libsystem_malloc.dylib |
| 100 | 8.9% | libsystem_platform.dylib |
| 23 | 2.1% | perf-95063.map |
| 5 | 0.4% | dyld |
| 3 | 0.3% | libsystem_c.dylib |
| 2 | 0.2% | libsystem_pthread.dylib |
| 1 | 0.1% | libc++.1.dylib |
| 1 | 0.1% | libsamply_mac_preload.dylib |
| 1 | 0.1% | libdyld.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 144.7 | 144 | node (83) |
| config | 28.7 | 24 | libsystem_kernel.dylib (14) |
| scan | 365.1 | 365 | libsystem_kernel.dylib (299) |
| evaluate | 6.0 | 6 | libsystem_kernel.dylib (4) |
| compile | 522.2 | 520 | virtual-native.darwin-x64.node (240) |
| publish | 52.1 | 52 | libsystem_kernel.dylib (33) |
| syncResidual | 0.0 | 0 | — (0) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 0 | — |
| postWorker samples | — | 8 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 156.2 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 260 | 260 | 23.2% | 23.2% | libsystem_kernel.dylib | `__open` |
| 66 | 66 | 5.9% | 5.9% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 50 | 62 | 4.5% | 5.5% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 45 | 49 | 4.0% | 4.4% | libsystem_malloc.dylib | `_nanov2_free` |
| 38 | 38 | 3.4% | 3.4% | libsystem_kernel.dylib | `kevent` |
| 30 | 30 | 2.7% | 2.7% | libsystem_kernel.dylib | `madvise` |
| 26 | 26 | 2.3% | 2.3% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 25 | 25 | 2.2% | 2.2% | libsystem_kernel.dylib | `read` |
| 23 | 23 | 2.1% | 2.1% | libsystem_kernel.dylib | `__write_nocancel` |
| 15 | 15 | 1.3% | 1.3% | libsystem_kernel.dylib | `__getdirentries64` |
| 14 | 14 | 1.3% | 1.3% | libsystem_kernel.dylib | `stat$INODE64` |
| 12 | 12 | 1.1% | 1.1% | libsystem_malloc.dylib | `nanov2_allocate_outlined` |
| 10 | 23 | 0.9% | 2.1% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 9 | 9 | 0.8% | 0.8% | libsystem_kernel.dylib | `__close_nocancel` |
| 9 | 13 | 0.8% | 1.2% | virtual-native.darwin-x64.node | `canon::css::is_color_prop` |
| 9 | 13 | 0.8% | 1.2% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 9 | 11 | 0.8% | 1.0% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 8 | 11 | 0.7% | 1.0% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 8 | 8 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 7 | 12 | 0.6% | 1.1% | virtual-native.darwin-x64.node | `core::slice::sort::stable::quicksort::quicksort` |
| 7 | 7 | 0.6% | 0.6% | node | `v8::internal::CalculateLineEndsImpl<unsigned char>(v8::base::SmallVector<int, (unsigned long)32, std::__1::allocator<...` |
| 7 | 15 | 0.6% | 1.3% | node | `v8::internal::Scanner::ScanString()` |
| 6 | 15 | 0.5% | 1.3% | perf-95063.map | `JS:*'resolve node:path:1245:10` |
| 6 | 11 | 0.5% | 1.0% | node | `v8::internal::JsonStringifier::SerializeString<false>(v8::internal::Handle<v8::internal::String>)` |
| 5 | 7 | 0.4% | 0.6% | node | `Builtins_StringAdd_CheckNone` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 10 | 23 | 0.9% | 2.1% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 9 | 13 | 0.8% | 1.2% | virtual-native.darwin-x64.node | `canon::css::is_color_prop` |
| 9 | 13 | 0.8% | 1.2% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 9 | 11 | 0.8% | 1.0% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 8 | 11 | 0.7% | 1.0% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 8 | 8 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 7 | 12 | 0.6% | 1.1% | virtual-native.darwin-x64.node | `core::slice::sort::stable::quicksort::quicksort` |
| 5 | 9 | 0.4% | 0.8% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 5 | 7 | 0.4% | 0.6% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 4 | 4 | 0.4% | 0.4% | virtual-native.darwin-x64.node | `atomic::diagnostics::site::LineIndex::for_source` |
| 4 | 83 | 0.4% | 7.4% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 4 | 4 | 0.4% | 0.4% | virtual-native.darwin-x64.node | `core::str::<impl str>::trim_matches` |
| 3 | 4 | 0.3% | 0.4% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `__rustc::__rust_alloc` |
| 3 | 9 | 0.3% | 0.8% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::IntoIter<K,V,A>::dying_next` |
| 3 | 19 | 0.3% | 1.7% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 3 | 5 | 0.3% | 0.4% | virtual-native.darwin-x64.node | `atomic::resolve::conditions::pseudoselectors::split_selector_list` |
| 3 | 33 | 0.3% | 2.9% | virtual-native.darwin-x64.node | `atomic::resolve::tokens::resolve_token_value` |
| 3 | 4 | 0.3% | 0.4% | virtual-native.darwin-x64.node | `canon::css::unrealizable::is_unrealizable_extension` |
| 3 | 5 | 0.3% | 0.4% | virtual-native.darwin-x64.node | `core::num::dec2flt::<impl core::str::traits::FromStr for f64>::from_str` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1119 | 0.0% | 100.0% | dyld | `start` |
| 0 | 1116 | 0.0% | 99.7% | node | `node::Start(int, char**)` |
| 0 | 1089 | 0.0% | 97.3% | node | `node::NodeMainInstance::Run()` |
| 1 | 1042 | 0.1% | 93.1% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 1042 | 0.0% | 93.1% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 0 | 962 | 0.0% | 86.0% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 962 | 0.0% | 86.0% | node | `uv__io_poll` |
| 0 | 962 | 0.0% | 86.0% | node | `uv_run` |
| 0 | 948 | 0.0% | 84.7% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 948 | 0.0% | 84.7% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 948 | 0.0% | 84.7% | node | `Builtins_RunMicrotasks` |
| 0 | 948 | 0.0% | 84.7% | node | `node::InternalCallbackScope::Close()` |
| 0 | 948 | 0.0% | 84.7% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 948 | 0.0% | 84.7% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 948 | 0.0% | 84.7% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 948 | 0.0% | 84.7% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 945 | 0.0% | 84.5% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 684 | 0.0% | 61.1% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 684 | 0.0% | 61.1% | node | `Builtins_JSEntry` |
| 0 | 684 | 0.0% | 61.1% | node | `Builtins_JSEntryTrampoline` |
| 0 | 678 | 0.0% | 60.6% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 678 | 0.0% | 60.6% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 566 | 0.0% | 50.6% | node | `node::AsyncWrap::MakeCallback(v8::Local<v8::Function>, int, v8::Local<v8::Value>*)` |
| 0 | 566 | 0.0% | 50.6% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 564 | 0.0% | 50.4% | node | `node::EmitToJSStreamListener::OnStreamRead(long, uv_buf_t const&)` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 502 | 0.0% | 44.9% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 2 | 477 | 0.2% | 42.6% | virtual-native.darwin-x64.node | `atomic::compile` |
| 1 | 90 | 0.1% | 8.0% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 4 | 83 | 0.4% | 7.4% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 2 | 72 | 0.2% | 6.4% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 0 | 63 | 0.0% | 5.6% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 0 | 61 | 0.0% | 5.5% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 1 | 55 | 0.1% | 4.9% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 0 | 49 | 0.0% | 4.4% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 0 | 48 | 0.0% | 4.3% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 43 | 0.1% | 3.8% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 1 | 39 | 0.1% | 3.5% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
| 0 | 33 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `atomic::extract::css::extract` |
| 3 | 33 | 0.3% | 2.9% | virtual-native.darwin-x64.node | `atomic::resolve::tokens::resolve_token_value` |
| 0 | 33 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 0 | 32 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `atomic::extract::css::handle_css_arg` |
| 0 | 32 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `atomic::hosts::resolve` |
| 0 | 31 | 0.0% | 2.8% | virtual-native.darwin-x64.node | `atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 0 | 30 | 0.0% | 2.7% | virtual-native.darwin-x64.node | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 0 | 29 | 0.0% | 2.6% | virtual-native.darwin-x64.node | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
