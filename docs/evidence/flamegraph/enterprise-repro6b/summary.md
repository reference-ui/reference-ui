# Flame summary: enterprise (ff64ab75b594)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1056 samples (weight 1082) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 423 | 39.1% | libsystem_kernel.dylib |
| 249 | 23.0% | virtual-native.darwin-x64.node |
| 156 | 14.4% | libsystem_malloc.dylib |
| 151 | 14.0% | node |
| 76 | 7.0% | libsystem_platform.dylib |
| 15 | 1.4% | perf-82054.map |
| 5 | 0.5% | dyld |
| 3 | 0.3% | libsystem_c.dylib |
| 1 | 0.1% | (unmapped jit) |
| 1 | 0.1% | libc++abi.dylib |
| 1 | 0.1% | libsystem_m.dylib |
| 1 | 0.1% | libc++.1.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 121.8 | 121 | node (74) |
| config | 28.2 | 24 | libsystem_kernel.dylib (13) |
| scan | 344.0 | 344 | libsystem_kernel.dylib (298) |
| evaluate | 6.9 | 7 | libsystem_kernel.dylib (5) |
| compile | 521.6 | 519 | virtual-native.darwin-x64.node (247) |
| publish | 59.9 | 60 | libsystem_kernel.dylib (32) |
| syncResidual | 0.0 | 0 | — (0) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 0 | — |
| postWorker samples | — | 7 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 152.2 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 239 | 239 | 22.1% | 22.1% | libsystem_kernel.dylib | `__open` |
| 56 | 64 | 5.2% | 5.9% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 49 | 49 | 4.5% | 4.5% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 46 | 46 | 4.3% | 4.3% | libsystem_malloc.dylib | `_nanov2_free` |
| 38 | 38 | 3.5% | 3.5% | libsystem_kernel.dylib | `kevent` |
| 38 | 38 | 3.5% | 3.5% | libsystem_kernel.dylib | `madvise` |
| 32 | 32 | 3.0% | 3.0% | libsystem_kernel.dylib | `read` |
| 23 | 23 | 2.1% | 2.1% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 13 | 13 | 1.2% | 1.2% | libsystem_kernel.dylib | `__getdirentries64` |
| 13 | 13 | 1.2% | 1.2% | libsystem_kernel.dylib | `__write_nocancel` |
| 13 | 26 | 1.2% | 2.4% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 12 | 12 | 1.1% | 1.1% | libsystem_kernel.dylib | `__close_nocancel` |
| 12 | 12 | 1.1% | 1.1% | libsystem_kernel.dylib | `stat$INODE64` |
| 11 | 11 | 1.0% | 1.0% | libsystem_kernel.dylib | `write` |
| 10 | 13 | 0.9% | 1.2% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 9 | 14 | 0.8% | 1.3% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 9 | 9 | 0.8% | 0.8% | node | `v8::internal::CalculateLineEndsImpl<unsigned char>(v8::base::SmallVector<int, (unsigned long)32, std::__1::allocator<...` |
| 9 | 21 | 0.8% | 1.9% | node | `v8::internal::Scanner::Next()` |
| 8 | 9 | 0.7% | 0.8% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 8 | 8 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `core::str::<impl str>::trim_matches` |
| 7 | 16 | 0.6% | 1.5% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 7 | 11 | 0.6% | 1.0% | node | `v8::internal::Scanner::ScanString()` |
| 6 | 6 | 0.6% | 0.6% | libsystem_malloc.dylib | `_malloc_zone_malloc` |
| 6 | 6 | 0.6% | 0.6% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 6 | 7 | 0.6% | 0.6% | virtual-native.darwin-x64.node | `module_graph::key::normalize_str` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 13 | 26 | 1.2% | 2.4% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 10 | 13 | 0.9% | 1.2% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 9 | 14 | 0.8% | 1.3% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 8 | 9 | 0.7% | 0.8% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 8 | 8 | 0.7% | 0.7% | virtual-native.darwin-x64.node | `core::str::<impl str>::trim_matches` |
| 7 | 16 | 0.6% | 1.5% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 6 | 6 | 0.6% | 0.6% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 6 | 7 | 0.6% | 0.6% | virtual-native.darwin-x64.node | `module_graph::key::normalize_str` |
| 6 | 7 | 0.6% | 0.6% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 5 | 9 | 0.5% | 0.8% | virtual-native.darwin-x64.node | `canon::css::is_color_prop` |
| 5 | 6 | 0.5% | 0.6% | virtual-native.darwin-x64.node | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 5 | 5 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `oxc_parser::module_record::ModuleRecordBuilder::add_module_request` |
| 4 | 5 | 0.4% | 0.5% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 4 | 6 | 0.4% | 0.6% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::entry::Entry<K,V,A>::or_default` |
| 4 | 4 | 0.4% | 0.4% | virtual-native.darwin-x64.node | `atomic::includes::glob::match_from` |
| 4 | 15 | 0.4% | 1.4% | virtual-native.darwin-x64.node | `hashbrown::raw::RawTable<T,A>::reserve_rehash` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `__rustc::__rust_no_alloc_shim_is_unstable_v2` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `alloc::collections::btree::node::Handle<alloc::collections::btree::node::NodeRef<alloc::collections::btree::node::mar...` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `atomic::diagnostics::proof::memo::hash_value` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `atomic::diagnostics::site::LineIndex::for_source` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1081 | 0.0% | 99.9% | dyld | `start` |
| 0 | 1077 | 0.0% | 99.5% | node | `node::Start(int, char**)` |
| 0 | 1058 | 0.0% | 97.8% | node | `node::NodeMainInstance::Run()` |
| 1 | 1011 | 0.1% | 93.4% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 1011 | 0.0% | 93.4% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 0 | 948 | 0.0% | 87.6% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 948 | 0.0% | 87.6% | node | `uv_run` |
| 0 | 947 | 0.0% | 87.5% | node | `uv__io_poll` |
| 0 | 930 | 0.0% | 86.0% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 930 | 0.0% | 86.0% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 930 | 0.0% | 86.0% | node | `Builtins_RunMicrotasks` |
| 0 | 930 | 0.0% | 86.0% | node | `node::InternalCallbackScope::Close()` |
| 0 | 930 | 0.0% | 86.0% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 930 | 0.0% | 86.0% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 930 | 0.0% | 86.0% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 930 | 0.0% | 86.0% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 927 | 0.0% | 85.7% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 685 | 0.0% | 63.3% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 675 | 0.0% | 62.4% | node | `Builtins_JSEntry` |
| 0 | 675 | 0.0% | 62.4% | node | `Builtins_JSEntryTrampoline` |
| 0 | 670 | 0.0% | 61.9% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 670 | 0.0% | 61.9% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 572 | 0.0% | 52.9% | node | `node::AsyncWrap::MakeCallback(v8::Local<v8::Function>, int, v8::Local<v8::Value>*)` |
| 0 | 572 | 0.0% | 52.9% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 571 | 0.0% | 52.8% | node | `node::EmitToJSStreamListener::OnStreamRead(long, uv_buf_t const&)` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 502 | 0.0% | 46.4% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 0 | 477 | 0.0% | 44.1% | virtual-native.darwin-x64.node | `atomic::compile` |
| 0 | 90 | 0.0% | 8.3% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 3 | 80 | 0.3% | 7.4% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 1 | 70 | 0.1% | 6.5% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 0 | 58 | 0.0% | 5.4% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 0 | 56 | 0.0% | 5.2% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 0 | 53 | 0.0% | 4.9% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 0 | 48 | 0.0% | 4.4% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 0 | 47 | 0.0% | 4.3% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 1 | 43 | 0.1% | 4.0% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 2 | 38 | 0.2% | 3.5% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
| 0 | 34 | 0.0% | 3.1% | virtual-native.darwin-x64.node | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 0 | 32 | 0.0% | 3.0% | virtual-native.darwin-x64.node | `atomic::hosts::resolve` |
| 0 | 32 | 0.0% | 3.0% | virtual-native.darwin-x64.node | `atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 1 | 31 | 0.1% | 2.9% | virtual-native.darwin-x64.node | `atomic::resolve::tokens::resolve_token_value` |
| 0 | 30 | 0.0% | 2.8% | virtual-native.darwin-x64.node | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 0 | 29 | 0.0% | 2.7% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 0 | 29 | 0.0% | 2.7% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 1 | 28 | 0.1% | 2.6% | virtual-native.darwin-x64.node | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
