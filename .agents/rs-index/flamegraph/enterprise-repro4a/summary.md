# Flame summary: enterprise (6f4cf1ba392f)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1070 samples (weight 1094) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 430 | 39.3% | libsystem_kernel.dylib |
| 205 | 18.7% | virtual-native.darwin-x64.node |
| 164 | 15.0% | libsystem_malloc.dylib |
| 158 | 14.4% | node |
| 103 | 9.4% | libsystem_platform.dylib |
| 23 | 2.1% | perf-16644.map |
| 5 | 0.5% | dyld |
| 2 | 0.2% | libsystem_c.dylib |
| 2 | 0.2% | libc++.1.dylib |
| 1 | 0.1% | libc++abi.dylib |
| 1 | 0.1% | libdyld.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 117.7 | 117 | node (74) |
| config | 28.2 | 23 | libsystem_kernel.dylib (15) |
| scan | 371.0 | 371 | libsystem_kernel.dylib (305) |
| evaluate | 2.7 | 3 | node (2) |
| compile | 520.0 | 518 | virtual-native.darwin-x64.node (204) |
| publish | 52.6 | 54 | libsystem_kernel.dylib (31) |
| syncResidual | 0.0 | 0 | — (0) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 0 | — |
| postWorker samples | — | 8 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 141.9 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 244 | 244 | 22.3% | 22.3% | libsystem_kernel.dylib | `__open` |
| 73 | 83 | 6.7% | 7.6% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 59 | 59 | 5.4% | 5.4% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 41 | 44 | 3.7% | 4.0% | libsystem_malloc.dylib | `_nanov2_free` |
| 40 | 40 | 3.7% | 3.7% | libsystem_kernel.dylib | `madvise` |
| 38 | 38 | 3.5% | 3.5% | libsystem_kernel.dylib | `kevent` |
| 36 | 36 | 3.3% | 3.3% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 31 | 31 | 2.8% | 2.8% | libsystem_kernel.dylib | `read` |
| 21 | 21 | 1.9% | 1.9% | libsystem_kernel.dylib | `__write_nocancel` |
| 13 | 13 | 1.2% | 1.2% | libsystem_kernel.dylib | `__close_nocancel` |
| 11 | 11 | 1.0% | 1.0% | libsystem_kernel.dylib | `__getdirentries64` |
| 11 | 20 | 1.0% | 1.8% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 9 | 10 | 0.8% | 0.9% | node | `Builtins_StringAdd_CheckNone` |
| 7 | 7 | 0.6% | 0.6% | libsystem_kernel.dylib | `__munmap` |
| 7 | 14 | 0.6% | 1.3% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 7 | 8 | 0.6% | 0.7% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 7 | 7 | 0.6% | 0.6% | libsystem_kernel.dylib | `stat$INODE64` |
| 7 | 9 | 0.6% | 0.8% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 7 | 7 | 0.6% | 0.6% | node | `v8::internal::CalculateLineEndsImpl<unsigned char>(v8::base::SmallVector<int, (unsigned long)32, std::__1::allocator<...` |
| 6 | 16 | 0.5% | 1.5% | perf-16644.map | `JS:*'resolve node:path:1245:10` |
| 6 | 10 | 0.5% | 0.9% | libsystem_malloc.dylib | `nanov2_allocate_outlined` |
| 6 | 10 | 0.5% | 0.9% | node | `v8::internal::Scanner::ScanString()` |
| 5 | 5 | 0.5% | 0.5% | libsystem_malloc.dylib | `_malloc_zone_malloc` |
| 5 | 5 | 0.5% | 0.5% | libsystem_platform.dylib | `_platform_bzero$VARIANT$Haswell` |
| 5 | 14 | 0.5% | 1.3% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 11 | 20 | 1.0% | 1.8% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 7 | 14 | 0.6% | 1.3% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 7 | 8 | 0.6% | 0.7% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 7 | 9 | 0.6% | 0.8% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 5 | 14 | 0.5% | 1.3% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 5 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::entry::Entry<K,V,A>::or_default` |
| 5 | 75 | 0.5% | 6.9% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 5 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 5 | 5 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `oxc_parser::module_record::ModuleRecordBuilder::add_module_request` |
| 4 | 4 | 0.4% | 0.4% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 4 | 22 | 0.4% | 2.0% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 4 | 6 | 0.4% | 0.5% | virtual-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 3 | 4 | 0.3% | 0.4% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 3 | 25 | 0.3% | 2.3% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `atomic::includes::glob::match_from` |
| 3 | 7 | 0.3% | 0.6% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 3 | 17 | 0.3% | 1.6% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_statement` |
| 3 | 4 | 0.3% | 0.4% | virtual-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_member_expression_rest` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `oxc_parser::js::object::<impl oxc_parser::ParserImpl>::parse_property_name` |
| 2 | 21 | 0.2% | 1.9% | virtual-native.darwin-x64.node | `<alloc::string::String as core::clone::Clone>::clone` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1093 | 0.0% | 99.9% | dyld | `start` |
| 0 | 1089 | 0.0% | 99.5% | node | `node::Start(int, char**)` |
| 0 | 1068 | 0.0% | 97.6% | node | `node::NodeMainInstance::Run()` |
| 0 | 1022 | 0.0% | 93.4% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 1 | 1021 | 0.1% | 93.3% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 962 | 0.0% | 87.9% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 962 | 0.0% | 87.9% | node | `uv__io_poll` |
| 0 | 962 | 0.0% | 87.9% | node | `uv_run` |
| 0 | 945 | 0.0% | 86.4% | node | `node::InternalCallbackScope::Close()` |
| 0 | 943 | 0.0% | 86.2% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 943 | 0.0% | 86.2% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 943 | 0.0% | 86.2% | node | `Builtins_RunMicrotasks` |
| 0 | 943 | 0.0% | 86.2% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 943 | 0.0% | 86.2% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 943 | 0.0% | 86.2% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 943 | 0.0% | 86.2% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 942 | 0.0% | 86.1% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 664 | 0.0% | 60.7% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 662 | 0.0% | 60.5% | node | `Builtins_JSEntry` |
| 0 | 662 | 0.0% | 60.5% | node | `Builtins_JSEntryTrampoline` |
| 0 | 657 | 0.0% | 60.1% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 657 | 0.0% | 60.1% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 561 | 0.0% | 51.3% | node | `node::AsyncWrap::MakeCallback(v8::Local<v8::Function>, int, v8::Local<v8::Value>*)` |
| 0 | 561 | 0.0% | 51.3% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 560 | 0.0% | 51.2% | node | `node::EmitToJSStreamListener::OnStreamRead(long, uv_buf_t const&)` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 500 | 0.0% | 45.7% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 0 | 475 | 0.0% | 43.4% | virtual-native.darwin-x64.node | `atomic::compile` |
| 0 | 95 | 0.0% | 8.7% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 5 | 75 | 0.5% | 6.9% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 2 | 68 | 0.2% | 6.2% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 0 | 60 | 0.0% | 5.5% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 1 | 58 | 0.1% | 5.3% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 0 | 56 | 0.0% | 5.1% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 0 | 53 | 0.0% | 4.8% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 0 | 52 | 0.0% | 4.8% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 46 | 0.1% | 4.2% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
| 1 | 46 | 0.1% | 4.2% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 1 | 38 | 0.1% | 3.5% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 0 | 35 | 0.0% | 3.2% | virtual-native.darwin-x64.node | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 1 | 34 | 0.1% | 3.1% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 0 | 34 | 0.0% | 3.1% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 0 | 32 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `atomic::extract::css::extract` |
| 0 | 32 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `atomic::extract::css::handle_css_arg` |
| 0 | 31 | 0.0% | 2.8% | virtual-native.darwin-x64.node | `<core::iter::adapters::map::Map<I,F> as core::iter::traits::iterator::Iterator>::fold` |
| 0 | 31 | 0.0% | 2.8% | virtual-native.darwin-x64.node | `atomic::hosts::resolve` |
