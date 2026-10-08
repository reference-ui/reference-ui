# Flame summary: enterprise (latest)

Samples (main thread): 1347 at 1000 Hz.
Profile: `profile.json.gz` — view with `samply load profile.json.gz`.

## Samples by library (self)

| samples | share | lib |
| --- | --- | --- |
| 396 | 29.4% | libsystem_kernel.dylib |
| 363 | 26.9% | virtual-native.darwin-x64.node |
| 264 | 19.6% | libsystem_malloc.dylib |
| 183 | 13.6% | node |
| 110 | 8.2% | libsystem_platform.dylib |
| 22 | 1.6% | perf-22737.map |
| 5 | 0.4% | dyld |
| 3 | 0.2% | libsystem_c.dylib |
| 1 | 0.1% | libdyld.dylib |

## Top self frames

| samples | share | lib | frame |
| --- | --- | --- | --- |
| 243 | 18.0% | libsystem_kernel.dylib | `__open` |
| 41 | 3.0% | libsystem_malloc.dylib | `_nanov2_free` |
| 38 | 2.8% | libsystem_kernel.dylib | `madvise` |
| 36 | 2.7% | libsystem_kernel.dylib | `read` |
| 25 | 1.9% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 20 | 1.5% | libsystem_platform.dylib | `_platform_memmove$VARIANT$Haswell` |
| 16 | 1.2% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 13 | 1.0% | libsystem_kernel.dylib | `kevent` |
| 13 | 1.0% | libsystem_kernel.dylib | `__getdirentries64` |
| 12 | 0.9% | libsystem_kernel.dylib | `__close_nocancel` |
| 12 | 0.9% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 11 | 0.8% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 10 | 0.7% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 9 | 0.7% | libsystem_kernel.dylib | `stat$INODE64` |
| 9 | 0.7% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 8 | 0.6% | libsystem_malloc.dylib | `nanov2_allocate_outlined` |
| 7 | 0.5% | libsystem_kernel.dylib | `__write_nocancel` |
| 7 | 0.5% | libsystem_malloc.dylib | `_nanov2_free` |
| 7 | 0.5% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 6 | 0.4% | libsystem_malloc.dylib | `_nanov2_free` |
| 6 | 0.4% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 6 | 0.4% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 6 | 0.4% | libsystem_platform.dylib | `_platform_memcmp$VARIANT$Base` |
| 5 | 0.4% | libsystem_malloc.dylib | `nanov2_malloc_type` |
| 5 | 0.4% | libsystem_malloc.dylib | `nanov2_malloc` |

## Top self frames in the native addon

| samples | share | lib | frame |
| --- | --- | --- | --- |
| 9 | 0.7% | virtual-native.darwin-x64.node | `alloc::raw_vec::RawVecInner<A>::reserve::do_reserve_and_handle` |
| 7 | 0.5% | virtual-native.darwin-x64.node | `<atomic::atom::decl::Atom as core::cmp::PartialEq>::eq` |
| 4 | 0.3% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 3 | 0.2% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 3 | 0.2% | virtual-native.darwin-x64.node | `oxc_parser::module_record::ModuleRecordBuilder::add_module_request` |
| 3 | 0.2% | virtual-native.darwin-x64.node | `oxc_allocator::bump::Bump::alloc_layout_slow` |
| 3 | 0.2% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 3 | 0.2% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 3 | 0.2% | virtual-native.darwin-x64.node | `oxc_ast_visit::generated::visit::walk::walk_expression` |
| 3 | 0.2% | virtual-native.darwin-x64.node | `canon::css::find_property` |
| 3 | 0.2% | virtual-native.darwin-x64.node | `hashbrown::map::HashMap<K,V,S,A>::insert` |
| 2 | 0.1% | virtual-native.darwin-x64.node | `std::path::compare_components` |
| 2 | 0.1% | virtual-native.darwin-x64.node | `oxc_parser::lexer::string::<impl oxc_parser::lexer::Lexer>::read_string_literal_single_quote` |
| 2 | 0.1% | virtual-native.darwin-x64.node | `alloc::collections::btree::map::BTreeMap<K,V,A>::insert` |
| 2 | 0.1% | virtual-native.darwin-x64.node | `core::num::flt2dec::strategy::grisu::format_shortest_opt` |
| 2 | 0.1% | virtual-native.darwin-x64.node | `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write` |
| 2 | 0.1% | virtual-native.darwin-x64.node | `oxc_parser::js::expression::<impl oxc_parser::ParserImpl>::parse_binary_expression_or_higher` |
| 2 | 0.1% | virtual-native.darwin-x64.node | `__rustc::__rust_alloc` |
| 2 | 0.1% | virtual-native.darwin-x64.node | `<core::hash::sip::Hasher<S> as core::hash::Hasher>::write` |
| 2 | 0.1% | virtual-native.darwin-x64.node | `atomic::diagnostics::site::LineIndex::line_col` |
