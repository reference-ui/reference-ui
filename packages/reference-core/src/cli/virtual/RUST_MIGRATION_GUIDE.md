# Rust Migration Guide

**Goal**: Replace TypeScript-based transforms with Rust + NAPI for 10-20× speed, 50-100 MB memory reduction per worker.

**Status**: ✅ Import rewrites (`rewrite_css_imports`, `rewrite_cva_imports`) are now using the Rust/NAPI implementation when available. JS fallback (TypeScript-based) used when native addon is unavailable.

---

## 1. Overview

### Current Bottlenecks

- **Import rewriting** (`rewrite-css-imports.ts`, `rewrite-cva-imports.ts`): Pulls in full TypeScript compiler (~60-80 MB), high memory, 200-500ms per file.
- **MDX compilation** (`mdx-to-jsx.ts`): Already uses `@rspress/mdx-rs` (Rust binding); we'll upgrade to pure `mdxjs` crate.

### Architecture

```
Node.js → reference-core (TS) ──NAPI FFI──→ @reference-ui/native (.node)
                                              ├─ mdx.rs (mdxjs crate)
                                              └─ rewrite.rs (oxc_parser)
```

**Benefits**: No V8 marshaling overhead for large strings, Oxc ~10× faster than TS compiler, native memory, zero-copy slicing.

### Package Structure

```
packages/reference-native/     ← NEW
  src/
    lib.rs, mdx.rs, rewrite.rs
  Cargo.toml

packages/reference-core/
  transforms/
    mdx-to-jsx.ts       → native.compileMdx()
    rewrite-css-imports.ts → native.rewriteCssImports()
    rewrite-cva-imports.ts  → native.rewriteCvaImports()
```

---

## 2. Setup (Day 1)

### 2.1 Create Native Package

```bash
cd packages/
npm install -g @napi-rs/cli
napi new reference-native

# Name: @reference-ui/native
# Platforms: darwin-x64, darwin-arm64, linux-x64-gnu, win32-x64
# GitHub Actions: yes
```

### 2.2 Cargo.toml Dependencies

```toml
[dependencies]
napi = { version = "2", features = ["napi8"] }
napi-derive = "2"
mdxjs = "1.56"
oxc_parser = "0.115"
oxc_ast = "0.115"
oxc_ast_visit = "0.115"
oxc_span = "0.115"
oxc_allocator = "0.115"
regex = "1.10"

[build-dependencies]
napi-build = "2"
```

### 2.3 Verify Build

```bash
cd reference-native && npm install && npm run build && npm test
```

---

## 3. Implementation

### 3.1 Import Rewriting (rewrite.rs)

**Core flow**:

1. Parse with Oxc: `Parser::new(&allocator, &source_code, source_type).parse()`
2. Find `import ... from '@reference-ui/react'`; extract spans
3. Check for `css` or `recipe`/`cva` specifiers; build replacement import
4. Replace byte-for-byte: `format!("{}{}{}", &source[..start], replacement, &source[end..])`
5. For CVA: replace `recipe(` → `cva(` via `regex::Regex` with `regex::escape(name)`

**Path helper**:

```rust
fn compute_styled_system_path(relative_path: &str) -> String {
  let path = Path::new(relative_path);
  let parent = path.parent().unwrap_or(Path::new(""));
  let depth = parent.components().count() + 1;  // +1 for .virtual/
  format!("{}src/system/css", "../".repeat(depth))
}
```

**Oxc import inspection**:

```rust
for stmt in &program.body {
  if let Statement::ImportDeclaration(import) = stmt {
    if import.source.value != "@reference-ui/react" { continue; }
    for spec in &import.specifiers {
      match spec {
        ImportDeclarationSpecifier::ImportSpecifier(named) => {
          let imported = named.imported.name();
          let local = named.local.name.as_str();
          // ...
        }
        ImportDeclarationSpecifier::ImportDefaultSpecifier(default) => { /* ... */ }
        _ => {}
      }
    }
    let start = import.span.start as usize;  // byte offsets
    let end = import.span.end as usize;
  }
}
```

### 3.2 MDX Compilation (mdx.rs)

```rust
#[napi(object)]
pub struct MdxOptions {
  pub value: String,
  pub filepath: String,
  pub development: bool,
}

#[napi]
pub fn compile_mdx(options: MdxOptions) -> Result<String> {
  let opts = mdxjs::Options {
    development: options.development,
    filepath: Some(options.filepath),
    jsx: true,
    ..Default::default()
  };
  compile(&options.value, opts)
    .map(|r| r.code)
    .map_err(|e| Error::new(Status::GenericFailure, format!("{}", e)))
}
```

### 3.3 TypeScript Wrappers

```typescript
// rewrite-css-imports.ts
import { rewriteCssImports as nativeRewrite } from '@reference-ui/native'

export async function rewriteCssImports(
  sourceCode: string,
  relativePath: string
): Promise<string> {
  try {
    return nativeRewrite(sourceCode, relativePath)
  } catch (error) {
    console.error('Native rewrite failed:', error)
    return sourceCode  // or fallback to TS impl
  }
}
```

Same pattern for `rewrite-cva-imports.ts` and `mdx-to-jsx.ts`. Add `@reference-ui/native: "workspace:*"` to `reference-core` deps.

---

## 4. Technical Reference

### NAPI Type Mapping

| TypeScript | Rust | Notes |
|------------|------|-------|
| string | String | UTF-8, copied on boundary |
| number | f64 / i32 | via `#[napi]` |
| boolean | bool | Direct |
| Buffer | Buffer | Zero-copy possible |
| object | `#[napi(object)] struct` | Derive macro |
| Promise | `impl Future<Output = T>` | `ts_return_type = "Promise<T>"` |
| Error | `napi::Error` | `Err(Error::new(...))` |

### Common Pitfalls

- **Byte vs char offsets**: Oxc spans are byte offsets; use `import.span.start as usize` directly.
- **Allocator lifetime**: Don't return AST nodes; extract spans/data before allocator drops.
- **Regex escaping**: Use `regex::escape(name)` when building patterns from user identifiers.
- **String pre-allocation**: `String::with_capacity(len)` to avoid reallocations.

### Error Handling

```rust
Err(Error::new(Status::GenericFailure, format!("Parse error: {}", e)))
```

### Debugging

- `RUST_BACKTRACE=full npm test`
- `npm run build -- --debug` for symbols; `node --inspect-brk bench.js`
- `eprintln!("DEBUG: ...")` to stderr

---

## 5. Testing & Validation

### Rust Unit Tests

```rust
#[cfg(test)]
mod tests {
  #[test]
  fn test_rewrite_css_imports() {
    let r = rewrite_css_imports(
      r#"import { css } from '@reference-ui/react'"#.into(),
      "test.tsx".into(),
    ).unwrap();
    assert_eq!(r, r#"import { css } from '../src/system/css';"#);
  }
}
```

Run: `cargo test`

### Integration (Vitest)

```typescript
it('rewrites css import', async () => {
  const r = await rewriteCssImports(`import { css } from '@reference-ui/react'`, 'test.tsx')
  expect(r).toContain(`from '../src/system/css'`)
})
```

### Benchmarks

Create `bench.js` with `performance.now()` and 1000 iterations. Expected: 10-20× speedup, 5-10× memory reduction vs TS.

---

## 6. CI/CD & Rollout

### GitHub Actions

NAPI CLI generates workflow. Ensure multi-platform build (mac/linux/win) and artifact upload. Tag `native-v0.1.0` to trigger.

### Rollout Options

**Big bang**: Ship native when ready.  
**Gradual**: Feature flag `USE_NATIVE_TRANSFORMS`, keep TS fallback 1–2 weeks, monitor errors/build times.

### Rollback

```bash
USE_NATIVE=false pnpm build
```

Or switch import to TS fallback module.

---

## 7. Success Criteria & Maintenance

- [ ] Imports rewrite < 30ms/file (vs 200–500ms)
- [ ] Worker memory < 25 MB (vs 80–100 MB)
- [ ] All tests pass, CI builds all platforms
- [ ] No regression in transform correctness

**Quarterly**: `cargo update`, `npm update`, run full test suite.

---

## 8. Resources

- [NAPI-RS](https://napi.rs/) · [Oxc](https://oxc-project.github.io/) · [mdxjs crate](https://docs.rs/mdxjs/)
- [cargo-flamegraph](https://github.com/flamegraph-rs/flamegraph) · [hyperfine](https://github.com/sharkdp/hyperfine)

---

**Last Updated**: February 25, 2026
