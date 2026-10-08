# Flame summary: enterprise (latest)

Procedure: `agentrs-flame/2` — merge same-function addresses by symbolized name; honor sample weights; publish self + inclusive costs (v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1347 samples (weight 1368) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 417 | 30.5% | libsystem_kernel.dylib |
| 363 | 26.5% | virtual-native.darwin-x64.node |
| 264 | 19.3% | libsystem_malloc.dylib |
| 183 | 13.4% | node |
| 110 | 8.0% | libsystem_platform.dylib |
| 22 | 1.6% | perf-22737.map |
| 5 | 0.4% | dyld |
| 3 | 0.2% | libsystem_c.dylib |
| 1 | 0.1% | libdyld.dylib |

## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 243 | 243 | 17.8% | 17.8% | libsystem_kernel.dylib | `__open` |
| 108 | 121 | 7.9% | 8.8% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 83 | 84 | 6.1% | 6.1% | libsystem_malloc.dylib | `_nanov2_free` |
| 50 | 50 | 3.7% | 3.7% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 50 | 50 | 3.7% | 3.7% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 38 | 38 | 2.8% | 2.8% | libsystem_kernel.dylib | `madvise` |
| 38 | 38 | 2.8% | 2.8% | libsystem_kernel.dylib | `read` |
| 31 | 31 | 2.3% | 2.3% | libsystem_kernel.dylib | `kevent` |
| 26 | 43 | 1.9% | 3.1% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 17 | 43 | 1.2% | 3.1% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 13 | 13 | 1.0% | 1.0% | libsystem_kernel.dylib | `__getdirentries64` |
| 13 | 15 | 1.0% | 1.1% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 12 | 12 | 0.9% | 0.9% | virtual-native.darwin-x64.node | `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write` |
| 12 | 12 | 0.9% | 0.9% | libsystem_kernel.dylib | `__close_nocancel` |
| 12 | 30 | 0.9% | 2.2% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 12 | 13 | 0.9% | 1.0% | libsystem_malloc.dylib | `nanov2_malloc` |
| 10 | 65 | 0.7% | 4.8% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 10 | 24 | 0.7% | 1.8% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 9 | 9 | 0.7% | 0.7% | libsystem_kernel.dylib | `stat$INODE64` |
| 8 | 21 | 0.6% | 1.5% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 8 | 37 | 0.6% | 2.7% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 8 | 14 | 0.6% | 1.0% | libsystem_malloc.dylib | `nanov2_allocate_outlined` |
| 8 | 8 | 0.6% | 0.6% | node | `v8::internal::CalculateLineEndsImpl<unsigned char>(v8::base::SmallVector<int, (unsigned long)32, std::__1::allocator<...` |
| 8 | 13 | 0.6% | 1.0% | node | `v8::internal::JsonStringifier::SerializeString<false>(v8::internal::Handle<v8::internal::String>)` |
| 7 | 7 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 26 | 43 | 1.9% | 3.1% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 17 | 43 | 1.2% | 3.1% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 13 | 15 | 1.0% | 1.1% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 12 | 12 | 0.9% | 0.9% | virtual-native.darwin-x64.node | `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write` |
| 12 | 30 | 0.9% | 2.2% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 10 | 65 | 0.7% | 4.8% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 10 | 24 | 0.7% | 1.8% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 8 | 21 | 0.6% | 1.5% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 8 | 37 | 0.6% | 2.7% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 7 | 7 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 7 | 16 | 0.5% | 1.2% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 6 | 16 | 0.4% | 1.2% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 5 | 11 | 0.4% | 0.8% | virtual-native.darwin-x64.node | `alloc::slice::<impl [T]>::sort_by::{{closure}}` |
| 5 | 40 | 0.4% | 2.9% | virtual-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binary_expression_or_higher` |
| 4 | 30 | 0.3% | 2.2% | virtual-native.darwin-x64.node | `alloc::fmt::format::format_inner` |
| 4 | 4 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `atomic::diagnostics::site::LineIndex::line_col` |
| 4 | 5 | 0.3% | 0.4% | virtual-native.darwin-x64.node | `atomic::diagnostics::site::line_col` |
| 4 | 133 | 0.3% | 9.7% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 4 | 10 | 0.3% | 0.7% | virtual-native.darwin-x64.node | `canon::css::is_color_prop` |
| 4 | 7 | 0.3% | 0.5% | virtual-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_literal_expression` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1366 | 0.0% | 99.9% | dyld | `start` |
| 0 | 1361 | 0.0% | 99.5% | node | `node::Start(int, char**)` |
| 0 | 1340 | 0.0% | 98.0% | node | `node::NodeMainInstance::Run()` |
| 0 | 1297 | 0.0% | 94.8% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 1 | 1296 | 0.1% | 94.7% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 1229 | 0.0% | 89.8% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 1229 | 0.0% | 89.8% | node | `uv__io_poll` |
| 0 | 1229 | 0.0% | 89.8% | node | `uv_run` |
| 0 | 1215 | 0.0% | 88.8% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 1215 | 0.0% | 88.8% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 1215 | 0.0% | 88.8% | node | `Builtins_RunMicrotasks` |
| 0 | 1215 | 0.0% | 88.8% | node | `node::InternalCallbackScope::Close()` |
| 0 | 1215 | 0.0% | 88.8% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 1215 | 0.0% | 88.8% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 1215 | 0.0% | 88.8% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 1215 | 0.0% | 88.8% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 1212 | 0.0% | 88.6% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 936 | 0.0% | 68.4% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 929 | 0.0% | 67.9% | node | `Builtins_JSEntry` |
| 0 | 929 | 0.0% | 67.9% | node | `Builtins_JSEntryTrampoline` |
| 0 | 924 | 0.0% | 67.5% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 924 | 0.0% | 67.5% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 823 | 0.0% | 60.2% | node | `uv__stream_io` |
| 0 | 822 | 0.0% | 60.1% | node | `node::AsyncWrap::MakeCallback(v8::Local<v8::Function>, int, v8::Local<v8::Value>*)` |
| 0 | 822 | 0.0% | 60.1% | node | `node::EmitToJSStreamListener::OnStreamRead(long, uv_buf_t const&)` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 758 | 0.0% | 55.4% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 2 | 730 | 0.1% | 53.4% | virtual-native.darwin-x64.node | `atomic::compile` |
| 1 | 299 | 0.1% | 21.9% | virtual-native.darwin-x64.node | `atomic::assembly::AssembleCtx::finish` |
| 4 | 133 | 0.3% | 9.7% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 2 | 124 | 0.1% | 9.1% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 2 | 90 | 0.1% | 6.6% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 0 | 83 | 0.0% | 6.1% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 0 | 81 | 0.0% | 5.9% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 2 | 69 | 0.1% | 5.0% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::finish_grow` |
| 10 | 65 | 0.7% | 4.8% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 0 | 65 | 0.0% | 4.8% | virtual-native.darwin-x64.node | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 0 | 63 | 0.0% | 4.6% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 0 | 61 | 0.0% | 4.5% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 0 | 55 | 0.0% | 4.0% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 0 | 54 | 0.0% | 3.9% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 2 | 54 | 0.1% | 3.9% | virtual-native.darwin-x64.node | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 2 | 53 | 0.1% | 3.9% | virtual-native.darwin-x64.node | `atomic::stylesheet::cascade::write_utilities` |
| 0 | 52 | 0.0% | 3.8% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 0 | 52 | 0.0% | 3.8% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_statement_list_item` |
| 1 | 49 | 0.1% | 3.6% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
