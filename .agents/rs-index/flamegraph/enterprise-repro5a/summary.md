# Flame summary: enterprise (b8a75b0bd74c)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1058 samples (weight 1085) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 412 | 38.0% | libsystem_kernel.dylib |
| 233 | 21.5% | virtual-native.darwin-x64.node |
| 174 | 16.0% | node |
| 145 | 13.4% | libsystem_malloc.dylib |
| 89 | 8.2% | libsystem_platform.dylib |
| 27 | 2.5% | perf-94736.map |
| 4 | 0.4% | dyld |
| 1 | 0.1% | libcorecrypto.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 124.8 | 123 | node (82) |
| config | 28.5 | 22 | libsystem_kernel.dylib (12) |
| scan | 364.4 | 364 | libsystem_kernel.dylib (292) |
| evaluate | 6.2 | 7 | libsystem_kernel.dylib (5) |
| compile | 508.8 | 507 | virtual-native.darwin-x64.node (232) |
| publish | 53.3 | 54 | libsystem_kernel.dylib (30) |
| syncResidual | 0.0 | 0 | — (0) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 0 | — |
| postWorker samples | — | 8 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 183.6 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 241 | 241 | 22.2% | 22.2% | libsystem_kernel.dylib | `__open` |
| 64 | 73 | 5.9% | 6.7% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 48 | 48 | 4.4% | 4.4% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 42 | 44 | 3.9% | 4.1% | libsystem_malloc.dylib | `_nanov2_free` |
| 38 | 38 | 3.5% | 3.5% | libsystem_kernel.dylib | `kevent` |
| 36 | 36 | 3.3% | 3.3% | libsystem_kernel.dylib | `madvise` |
| 32 | 32 | 2.9% | 2.9% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 21 | 21 | 1.9% | 1.9% | libsystem_kernel.dylib | `read` |
| 16 | 16 | 1.5% | 1.5% | libsystem_kernel.dylib | `__close_nocancel` |
| 15 | 15 | 1.4% | 1.4% | libsystem_kernel.dylib | `__write_nocancel` |
| 10 | 22 | 0.9% | 2.0% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 9 | 9 | 0.8% | 0.8% | libsystem_kernel.dylib | `__getdirentries64` |
| 9 | 9 | 0.8% | 0.8% | libsystem_kernel.dylib | `stat$INODE64` |
| 8 | 13 | 0.7% | 1.2% | node | `v8::internal::Scanner::ScanString()` |
| 7 | 10 | 0.6% | 0.9% | node | `Builtins_StringAdd_CheckNone` |
| 7 | 10 | 0.6% | 0.9% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 7 | 10 | 0.6% | 0.9% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 7 | 9 | 0.6% | 0.8% | libsystem_malloc.dylib | `nanov2_allocate_outlined` |
| 6 | 6 | 0.6% | 0.6% | node | `Builtins_CallFunction_ReceiverIsAny` |
| 6 | 21 | 0.6% | 1.9% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 6 | 12 | 0.6% | 1.1% | virtual-native.darwin-x64.node | `canon::css::is_color_prop` |
| 6 | 11 | 0.6% | 1.0% | node | `v8::internal::JsonStringifier::SerializeString<false>(v8::internal::Handle<v8::internal::String>)` |
| 6 | 6 | 0.6% | 0.6% | libsystem_kernel.dylib | `write` |
| 5 | 5 | 0.5% | 0.5% | libsystem_malloc.dylib | `_free` |
| 5 | 5 | 0.5% | 0.5% | libsystem_platform.dylib | `_platform_bzero$VARIANT$Haswell` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 10 | 22 | 0.9% | 2.0% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 7 | 10 | 0.6% | 0.9% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 7 | 10 | 0.6% | 0.9% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 6 | 21 | 0.6% | 1.9% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 6 | 12 | 0.6% | 1.1% | virtual-native.darwin-x64.node | `canon::css::is_color_prop` |
| 5 | 12 | 0.5% | 1.1% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 5 | 7 | 0.5% | 0.6% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 5 | 21 | 0.5% | 1.9% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_statement` |
| 4 | 74 | 0.4% | 6.8% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 4 | 10 | 0.4% | 0.9% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 4 | 4 | 0.4% | 0.4% | virtual-native.darwin-x64.node | `core::num::dec2flt::parse::parse_number` |
| 4 | 22 | 0.4% | 2.0% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 4 | 4 | 0.4% | 0.4% | virtual-native.darwin-x64.node | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 3 | 5 | 0.3% | 0.5% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 3 | 5 | 0.3% | 0.5% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::entry::Entry<K,V,A>::or_default` |
| 3 | 9 | 0.3% | 0.8% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVec<T,A>::grow_one` |
| 3 | 6 | 0.3% | 0.6% | virtual-native.darwin-x64.node | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `atomic::atom::decl::Atom::new` |
| 3 | 12 | 0.3% | 1.1% | virtual-native.darwin-x64.node | `atomic::extract::harvest::classify::classify_harvest_value` |
| 3 | 8 | 0.3% | 0.7% | virtual-native.darwin-x64.node | `atomic::stylesheet::name::push_selector_with_prefix` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1083 | 0.0% | 99.8% | dyld | `start` |
| 0 | 1081 | 0.0% | 99.6% | node | `node::Start(int, char**)` |
| 0 | 1060 | 0.0% | 97.7% | node | `node::NodeMainInstance::Run()` |
| 0 | 1015 | 0.0% | 93.5% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 0 | 1014 | 0.0% | 93.5% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 948 | 0.0% | 87.4% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 948 | 0.0% | 87.4% | node | `uv__io_poll` |
| 0 | 948 | 0.0% | 87.4% | node | `uv_run` |
| 0 | 931 | 0.0% | 85.8% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 931 | 0.0% | 85.8% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 931 | 0.0% | 85.8% | node | `Builtins_RunMicrotasks` |
| 0 | 931 | 0.0% | 85.8% | node | `node::InternalCallbackScope::Close()` |
| 0 | 931 | 0.0% | 85.8% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 931 | 0.0% | 85.8% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 931 | 0.0% | 85.8% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 931 | 0.0% | 85.8% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 928 | 0.0% | 85.5% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 663 | 0.0% | 61.1% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 659 | 0.0% | 60.7% | node | `Builtins_JSEntry` |
| 0 | 659 | 0.0% | 60.7% | node | `Builtins_JSEntryTrampoline` |
| 0 | 656 | 0.0% | 60.5% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 655 | 0.0% | 60.4% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 553 | 0.0% | 51.0% | node | `node::AsyncWrap::MakeCallback(v8::Local<v8::Function>, int, v8::Local<v8::Value>*)` |
| 0 | 553 | 0.0% | 51.0% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |
| 0 | 552 | 0.0% | 50.9% | node | `node::EmitToJSStreamListener::OnStreamRead(long, uv_buf_t const&)` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 488 | 0.0% | 45.0% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 0 | 465 | 0.0% | 42.9% | virtual-native.darwin-x64.node | `atomic::compile` |
| 1 | 87 | 0.1% | 8.0% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 4 | 74 | 0.4% | 6.8% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 1 | 66 | 0.1% | 6.1% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 1 | 55 | 0.1% | 5.1% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 0 | 54 | 0.0% | 5.0% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 1 | 53 | 0.1% | 4.9% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 0 | 47 | 0.0% | 4.3% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 0 | 46 | 0.0% | 4.2% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 1 | 41 | 0.1% | 3.8% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
| 0 | 38 | 0.0% | 3.5% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 0 | 31 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `atomic::hosts::resolve` |
| 0 | 31 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 0 | 29 | 0.0% | 2.7% | virtual-native.darwin-x64.node | `atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 0 | 29 | 0.0% | 2.7% | virtual-native.darwin-x64.node | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 0 | 28 | 0.0% | 2.6% | virtual-native.darwin-x64.node | `atomic::extract::css::extract` |
| 0 | 28 | 0.0% | 2.6% | virtual-native.darwin-x64.node | `atomic::extract::css::handle_css_arg` |
| 1 | 28 | 0.1% | 2.6% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 0 | 28 | 0.0% | 2.6% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
