# Flame summary: enterprise (ff64ab75b594)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1068 samples (weight 1091) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 422 | 38.7% | libsystem_kernel.dylib |
| 250 | 22.9% | virtual-native.darwin-x64.node |
| 159 | 14.6% | node |
| 136 | 12.5% | libsystem_malloc.dylib |
| 98 | 9.0% | libsystem_platform.dylib |
| 11 | 1.0% | perf-81849.map |
| 5 | 0.5% | dyld |
| 5 | 0.5% | libsystem_c.dylib |
| 2 | 0.2% | libc++.1.dylib |
| 1 | 0.1% | libc++abi.dylib |
| 1 | 0.1% | (unmapped jit) |
| 1 | 0.1% | libdyld.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 127.3 | 126 | node (77) |
| config | 28.4 | 25 | libsystem_kernel.dylib (16) |
| scan | 349.3 | 349 | libsystem_kernel.dylib (298) |
| evaluate | 3.2 | 2 | libsystem_kernel.dylib (1) |
| compile | 525.7 | 525 | virtual-native.darwin-x64.node (250) |
| publish | 56.8 | 57 | libsystem_kernel.dylib (33) |
| syncResidual | 0.0 | 0 | — (0) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 0 | — |
| postWorker samples | — | 7 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 138.6 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 245 | 245 | 22.5% | 22.5% | libsystem_kernel.dylib | `__open` |
| 56 | 56 | 5.1% | 5.1% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 55 | 61 | 5.0% | 5.6% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 37 | 37 | 3.4% | 3.4% | libsystem_kernel.dylib | `kevent` |
| 36 | 38 | 3.3% | 3.5% | libsystem_malloc.dylib | `_nanov2_free` |
| 36 | 36 | 3.3% | 3.3% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 30 | 30 | 2.7% | 2.7% | libsystem_kernel.dylib | `madvise` |
| 29 | 29 | 2.7% | 2.7% | libsystem_kernel.dylib | `read` |
| 19 | 31 | 1.7% | 2.8% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 18 | 18 | 1.6% | 1.6% | libsystem_kernel.dylib | `__close_nocancel` |
| 13 | 13 | 1.2% | 1.2% | libsystem_kernel.dylib | `__write_nocancel` |
| 13 | 13 | 1.2% | 1.2% | libsystem_kernel.dylib | `stat$INODE64` |
| 12 | 12 | 1.1% | 1.1% | libsystem_kernel.dylib | `__getdirentries64` |
| 8 | 15 | 0.7% | 1.4% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 7 | 72 | 0.6% | 6.6% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 7 | 7 | 0.6% | 0.6% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 6 | 6 | 0.5% | 0.5% | libsystem_malloc.dylib | `_free` |
| 6 | 6 | 0.5% | 0.5% | libsystem_malloc.dylib | `_malloc_zone_malloc` |
| 6 | 27 | 0.5% | 2.5% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 6 | 6 | 0.5% | 0.5% | libsystem_kernel.dylib | `mach_msg2_trap` |
| 6 | 6 | 0.5% | 0.5% | node | `simdutf::haswell::implementation::convert_latin1_to_utf8(char const*, unsigned long, char*) const` |
| 6 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 6 | 6 | 0.5% | 0.5% | node | `v8::internal::CalculateLineEndsImpl<unsigned char>(v8::base::SmallVector<int, (unsigned long)32, std::__1::allocator<...` |
| 5 | 5 | 0.5% | 0.5% | libsystem_kernel.dylib | `__munmap` |
| 5 | 13 | 0.5% | 1.2% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 19 | 31 | 1.7% | 2.8% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 8 | 15 | 0.7% | 1.4% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 7 | 72 | 0.6% | 6.6% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 7 | 7 | 0.6% | 0.6% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 6 | 27 | 0.5% | 2.5% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 6 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 5 | 13 | 0.5% | 1.2% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 5 | 5 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `atomic::atom::decl::Atom::new` |
| 5 | 5 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 5 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `module_graph::key::normalize_str` |
| 5 | 5 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 4 | 6 | 0.4% | 0.5% | virtual-native.darwin-x64.node | `<smallvec::SmallVec<A> as core::iter::traits::collect::Extend<<A as smallvec::Array>::Item>>::extend` |
| 4 | 55 | 0.4% | 5.0% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 4 | 5 | 0.4% | 0.5% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 4 | 10 | 0.4% | 0.9% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 3 | 8 | 0.3% | 0.7% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T,A> as core::clone::Clone>::clone` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `atomic::diagnostics::proof::memo::hash_value` |
| 3 | 47 | 0.3% | 4.3% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `atomic::resolve::conditions::pseudoselectors::nesting::nest_member_into` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `atomic::wire::split_shared_suffix` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1091 | 0.0% | 100.0% | dyld | `start` |
| 0 | 1088 | 0.0% | 99.7% | node | `node::Start(int, char**)` |
| 0 | 1067 | 0.0% | 97.8% | node | `node::NodeMainInstance::Run()` |
| 0 | 1022 | 0.0% | 93.7% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 1 | 1021 | 0.1% | 93.6% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 953 | 0.0% | 87.4% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 953 | 0.0% | 87.4% | node | `uv_run` |
| 0 | 952 | 0.0% | 87.3% | node | `uv__io_poll` |
| 0 | 933 | 0.0% | 85.5% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 933 | 0.0% | 85.5% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 933 | 0.0% | 85.5% | node | `Builtins_RunMicrotasks` |
| 0 | 933 | 0.0% | 85.5% | node | `node::InternalCallbackScope::Close()` |
| 0 | 933 | 0.0% | 85.5% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 933 | 0.0% | 85.5% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 933 | 0.0% | 85.5% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 933 | 0.0% | 85.5% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 930 | 0.0% | 85.2% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 686 | 0.0% | 62.9% | node | `Builtins_CallApiCallbackGeneric` |
| 1 | 682 | 0.1% | 62.5% | node | `Builtins_JSEntry` |
| 0 | 681 | 0.0% | 62.4% | node | `Builtins_JSEntryTrampoline` |
| 0 | 678 | 0.0% | 62.1% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 678 | 0.0% | 62.1% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 572 | 0.0% | 52.4% | node | `node::AsyncWrap::MakeCallback(v8::Local<v8::Function>, int, v8::Local<v8::Value>*)` |
| 0 | 572 | 0.0% | 52.4% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 571 | 0.0% | 52.3% | node | `node::EmitToJSStreamListener::OnStreamRead(long, uv_buf_t const&)` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 506 | 0.0% | 46.4% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 0 | 480 | 0.0% | 44.0% | virtual-native.darwin-x64.node | `atomic::compile` |
| 2 | 98 | 0.2% | 9.0% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 7 | 72 | 0.6% | 6.6% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 1 | 68 | 0.1% | 6.2% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 0 | 66 | 0.0% | 6.0% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 0 | 60 | 0.0% | 5.5% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 4 | 55 | 0.4% | 5.0% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 0 | 53 | 0.0% | 4.9% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 0 | 53 | 0.0% | 4.9% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 3 | 47 | 0.3% | 4.3% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
| 2 | 36 | 0.2% | 3.3% | virtual-native.darwin-x64.node | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 0 | 35 | 0.0% | 3.2% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 0 | 35 | 0.0% | 3.2% | virtual-native.darwin-x64.node | `atomic::extract::css::extract` |
| 0 | 35 | 0.0% | 3.2% | virtual-native.darwin-x64.node | `atomic::extract::css::handle_css_arg` |
| 2 | 35 | 0.2% | 3.2% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 0 | 32 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `atomic::hosts::resolve` |
| 0 | 32 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 1 | 32 | 0.1% | 2.9% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 19 | 31 | 1.7% | 2.8% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
