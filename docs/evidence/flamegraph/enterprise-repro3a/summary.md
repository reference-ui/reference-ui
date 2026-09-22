# Flame summary: enterprise (3dd32a659715)

Procedure: `agentrs-flame/3` — same-run phase boundaries + per-phase sample buckets, startup measured in-run (v2 merged addresses by name with weights; v1 keyed resource:address:func and counted +1 per sample)

Samples (main thread): 1133 samples (weight 1151) at 1000 Hz.
Costs are sample weights; self counts the leaf, inclusive counts each sample once per function on its stack.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 422 | 36.7% | libsystem_kernel.dylib |
| 261 | 22.7% | virtual-native.darwin-x64.node |
| 186 | 16.2% | libsystem_malloc.dylib |
| 163 | 14.2% | node |
| 94 | 8.2% | libsystem_platform.dylib |
| 20 | 1.7% | perf-26453.map |
| 3 | 0.3% | dyld |
| 1 | 0.1% | libdyld.dylib |
| 1 | 0.1% | libsystem_c.dylib |

## Same-run phases (agentrs-phases/1)

| phase | ms | weight | top self lib (weight) |
| --- | --- | --- | --- |
| startup | 121.2 | 118 | node (75) |
| config | 27.5 | 23 | libsystem_kernel.dylib (12) |
| scan | 365.0 | 365 | libsystem_kernel.dylib (301) |
| evaluate | 6.1 | 6 | libsystem_kernel.dylib (4) |
| compile | 579.1 | 578 | virtual-native.darwin-x64.node (261) |
| publish | 53.0 | 53 | libsystem_kernel.dylib (26) |
| syncResidual | 0.0 | 0 | — (0) |
| workerTail | 0.0 | 0 | — (0) |
| preMain samples | — | 0 | — |
| postWorker samples | — | 8 | — |

RECONCILED — phase sums match to 0.000 ms (sync) / 0.000 ms (worker). Weight ≈ ms at the profile rate; each sample counts fully in the phase containing its timestamp.
Alignment: processStart 238.0 ms after profile start.


## Top functions by self cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 245 | 245 | 21.3% | 21.3% | libsystem_kernel.dylib | `__open` |
| 82 | 87 | 7.1% | 7.6% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 54 | 57 | 4.7% | 5.0% | libsystem_malloc.dylib | `_nanov2_free` |
| 51 | 51 | 4.4% | 4.4% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 39 | 39 | 3.4% | 3.4% | libsystem_kernel.dylib | `madvise` |
| 36 | 36 | 3.1% | 3.1% | libsystem_kernel.dylib | `kevent` |
| 31 | 31 | 2.7% | 2.7% | libsystem_kernel.dylib | `read` |
| 29 | 29 | 2.5% | 2.5% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 16 | 27 | 1.4% | 2.3% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 14 | 14 | 1.2% | 1.2% | libsystem_kernel.dylib | `__close_nocancel` |
| 14 | 14 | 1.2% | 1.2% | libsystem_kernel.dylib | `__write_nocancel` |
| 11 | 11 | 1.0% | 1.0% | libsystem_kernel.dylib | `__getdirentries64` |
| 11 | 19 | 1.0% | 1.7% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 10 | 10 | 0.9% | 0.9% | libsystem_kernel.dylib | `stat$INODE64` |
| 9 | 9 | 0.8% | 0.8% | virtual-native.darwin-x64.node | `atomic::diagnostics::site::LineIndex::line_col` |
| 9 | 14 | 0.8% | 1.2% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 9 | 27 | 0.8% | 2.3% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 8 | 12 | 0.7% | 1.0% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 8 | 20 | 0.7% | 1.7% | node | `v8::internal::Scanner::Next()` |
| 8 | 12 | 0.7% | 1.0% | node | `v8::internal::Scanner::ScanString()` |
| 7 | 7 | 0.6% | 0.6% | libsystem_platform.dylib | `_platform_bzero$VARIANT$Haswell` |
| 7 | 10 | 0.6% | 0.9% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 6 | 19 | 0.5% | 1.7% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 6 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 5 | 6 | 0.4% | 0.5% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |

## Top self functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 16 | 27 | 1.4% | 2.3% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 11 | 19 | 1.0% | 1.7% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 9 | 9 | 0.8% | 0.8% | virtual-native.darwin-x64.node | `atomic::diagnostics::site::LineIndex::line_col` |
| 9 | 14 | 0.8% | 1.2% | virtual-native.darwin-x64.node | `canon::dialect::resolve_alias` |
| 9 | 27 | 0.8% | 2.3% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 8 | 12 | 0.7% | 1.0% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 7 | 10 | 0.6% | 0.9% | virtual-native.darwin-x64.node | `core::hash::BuildHasher::hash_one` |
| 6 | 19 | 0.5% | 1.7% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 6 | 6 | 0.5% | 0.5% | virtual-native.darwin-x64.node | `canon::css::values::named_colors::is_named_color` |
| 5 | 6 | 0.4% | 0.5% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 5 | 6 | 0.4% | 0.5% | virtual-native.darwin-x64.node | `canon::css::values::lengths::is_length` |
| 5 | 7 | 0.4% | 0.6% | virtual-native.darwin-x64.node | `oxc_parser::lexer::Lexer::next_token` |
| 5 | 7 | 0.4% | 0.6% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 4 | 12 | 0.3% | 1.0% | virtual-native.darwin-x64.node | `canon::css::is_color_prop` |
| 4 | 14 | 0.3% | 1.2% | virtual-native.darwin-x64.node | `canon::css::values::classify::classify_css_value` |
| 4 | 11 | 0.3% | 1.0% | virtual-native.darwin-x64.node | `core::slice::sort::stable::quicksort::quicksort` |
| 4 | 4 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `oxc_parser::module_record::ModuleRecordBuilder::add_module_request` |
| 3 | 3 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `atomic::atom::decl::Atom::new` |
| 3 | 4 | 0.3% | 0.3% | virtual-native.darwin-x64.node | `atomic::resolve::conditions::pseudoselectors::split_selector_list` |
| 3 | 106 | 0.3% | 9.2% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |

## Top functions by inclusive cost

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 1148 | 0.0% | 99.7% | dyld | `start` |
| 0 | 1146 | 0.0% | 99.6% | node | `node::Start(int, char**)` |
| 0 | 1124 | 0.0% | 97.7% | node | `node::NodeMainInstance::Run()` |
| 1 | 1080 | 0.1% | 93.8% | node | `Builtins_InterpreterEntryTrampoline` |
| 0 | 1080 | 0.0% | 93.8% | node | `v8::internal::(anonymous namespace)::Invoke(v8::internal::Isolate*, v8::internal::(anonymous namespace)::InvokeParams...` |
| 0 | 1018 | 0.0% | 88.4% | node | `node::SpinEventLoopInternal(node::Environment*)` |
| 0 | 1018 | 0.0% | 88.4% | node | `uv_run` |
| 0 | 1016 | 0.0% | 88.3% | node | `uv__io_poll` |
| 0 | 999 | 0.0% | 86.8% | node | `Builtins_JSRunMicrotasksEntry` |
| 0 | 999 | 0.0% | 86.8% | node | `Builtins_PromiseFulfillReactionJob` |
| 0 | 999 | 0.0% | 86.8% | node | `Builtins_RunMicrotasks` |
| 0 | 999 | 0.0% | 86.8% | node | `node::InternalCallbackScope::Close()` |
| 0 | 999 | 0.0% | 86.8% | node | `v8::internal::(anonymous namespace)::InvokeWithTryCatch(v8::internal::Isolate*, v8::internal::(anonymous namespace)::...` |
| 0 | 999 | 0.0% | 86.8% | node | `v8::internal::Execution::TryRunMicrotasks(v8::internal::Isolate*, v8::internal::MicrotaskQueue*)` |
| 0 | 999 | 0.0% | 86.8% | node | `v8::internal::MicrotaskQueue::PerformCheckpoint(v8::Isolate*)` |
| 0 | 999 | 0.0% | 86.8% | node | `v8::internal::MicrotaskQueue::RunMicrotasks(v8::internal::Isolate*)` |
| 0 | 997 | 0.0% | 86.6% | node | `Builtins_AsyncFunctionAwaitResolveClosure` |
| 0 | 733 | 0.0% | 63.7% | node | `Builtins_CallApiCallbackGeneric` |
| 0 | 726 | 0.0% | 63.1% | node | `Builtins_JSEntry` |
| 0 | 726 | 0.0% | 63.1% | node | `Builtins_JSEntryTrampoline` |
| 0 | 721 | 0.0% | 62.6% | node | `v8::Function::Call(v8::Isolate*, v8::Local<v8::Context>, v8::Local<v8::Value>, int, v8::Local<v8::Value>*)` |
| 0 | 721 | 0.0% | 62.6% | node | `v8::internal::Execution::Call(v8::internal::Isolate*, v8::internal::DirectHandle<v8::internal::Object>, v8::internal:...` |
| 0 | 622 | 0.0% | 54.0% | node | `node::AsyncWrap::MakeCallback(v8::Local<v8::Function>, int, v8::Local<v8::Value>*)` |
| 0 | 622 | 0.0% | 54.0% | node | `node::EmitToJSStreamListener::OnStreamRead(long, uv_buf_t const&)` |
| 0 | 622 | 0.0% | 54.0% | node | `node::InternalMakeCallback(node::Environment*, v8::Local<v8::Object>, v8::Local<v8::Object>, v8::Local<v8::Function>,...` |

## Top inclusive functions in the native addon

| self | incl | self% | incl% | lib | frame |
| --- | --- | --- | --- | --- | --- |
| 0 | 558 | 0.0% | 48.5% | virtual-native.darwin-x64.node | `reference_virtual_native::atomic::__napi__compile_system` |
| 0 | 535 | 0.0% | 46.5% | virtual-native.darwin-x64.node | `atomic::compile` |
| 0 | 218 | 0.0% | 18.9% | virtual-native.darwin-x64.node | `atomic::assembly::AssembleCtx::finish` |
| 3 | 106 | 0.3% | 9.2% | virtual-native.darwin-x64.node | `atomic::resolve::resolve_want_with` |
| 3 | 98 | 0.3% | 8.5% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_declaration` |
| 1 | 72 | 0.1% | 6.3% | virtual-native.darwin-x64.node | `<alloc::vec::Vec<T> as alloc::vec::spec_from_iter_nested::SpecFromIterNested<T,I>>::from_iter` |
| 0 | 68 | 0.0% | 5.9% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::build_keyed` |
| 0 | 67 | 0.0% | 5.8% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_function` |
| 0 | 64 | 0.0% | 5.6% | virtual-native.darwin-x64.node | `atomic::extract::extract_with_context` |
| 0 | 55 | 0.0% | 4.8% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_call_expression` |
| 0 | 55 | 0.0% | 4.8% | virtual-native.darwin-x64.node | `<atomic::extract::ExtractVisitor as oxc_ast_visit::generated::visit::Visit>::visit_variable_declarator` |
| 0 | 54 | 0.0% | 4.7% | virtual-native.darwin-x64.node | `atomic::runtime::builder::PlanBuilder::resolve_entry` |
| 0 | 49 | 0.0% | 4.3% | virtual-native.darwin-x64.node | `atomic::extract::expressions::object::walk_style_object` |
| 0 | 40 | 0.0% | 3.5% | virtual-native.darwin-x64.node | `atomic::runtime::builder::resolve_with_unique_diagnostics` |
| 0 | 36 | 0.0% | 3.1% | virtual-native.darwin-x64.node | `atomic::extract::css::extract` |
| 1 | 36 | 0.1% | 3.1% | virtual-native.darwin-x64.node | `oxc_parser::parser_parse::<impl oxc_parser::Parser>::parse` |
| 0 | 35 | 0.0% | 3.0% | virtual-native.darwin-x64.node | `atomic::extract::css::handle_css_arg` |
| 0 | 33 | 0.0% | 2.9% | virtual-native.darwin-x64.node | `atomic::stylesheet::emitter::build_stylesheets_with` |
| 1 | 33 | 0.1% | 2.9% | virtual-native.darwin-x64.node | `oxc_parser::js::statement::<impl oxc_parser::ParserImpl>::parse_directives_and_statements` |
| 0 | 32 | 0.0% | 2.8% | virtual-native.darwin-x64.node | `atomic::hosts::resolve` |
