# Architectural Design & Feasibility Plan: Robust CSS Value Parsing

**Status**: Draft / RFC  
**Scope**: `@reference-ui/core` (rhythm units, shorthand decomposition, custom utilities, fonts), `@reference-ui/lib`, `@matrix/primitives`  
**Date**: September 7, 2026  

---

## 1. Executive Summary & Context

As a public, open-source design system, `@reference-ui` requires bulletproof, standard-compliant code. We provide custom utility features that require introspecting and transforming author-provided CSS values at build/runtime. Historically, this relied on naive string splitting (`value.split(' ')`) or Regex replacement. 

This fragile approach has caused issues across several domains:
1. **Custom `r` (Rhythm) Units**: We compile `2r` into `calc(2 * var(--spacing-root))`. Regex replacements risk corrupting valid CSS like `var(--r-color)` or `url("/assets/icon-r.svg")`.
2. **Space-Delimited Shorthands (Padding/Margin)**: Splitting `padding="1r var(--bottom-gutter) 2r"` by space using regex fails or forces aggressive bails when encountering parentheses inside `var()` or `calc()`.
3. **Border Shorthand Decomposition**: As detailed in the `STYLE_ERRORS_REPORT.md`, we decompose `borderBottom="1px solid"` into `borderBottomWidth` and `borderBottomStyle` to prevent CSS from resetting omitted colors to `currentColor`. However, splitting a value like `borderBottom="calc(1px + 1r) solid rgba(0, 0, 0, 0.1)"` by space will destroy the `calc()` and `rgba()` functions if using naive string methods.
4. **Font Family Extraction**: In `extensions/api/font.ts`, we extract the primary font name using a regex `^["']([^"']+)["']` and naive `.split(',')[0]`. This is non-standard and could fail on complex nested quotes or CSS functions.

To guarantee zero false-positives and support advanced authoring, **manual regex and string splitting are completely out the window**.

---

## 2. The New Standard: AST-Based Value Parsing

Across the board, any utility that needs to introspect, split, or transform CSS values will adopt an **AST (Abstract Syntax Tree) approach** using `postcss-value-parser`.

### Why `postcss-value-parser`?
- **Bulletproof Tokenization**: It tokenizes CSS values into `word`, `string`, `function`, `space`, and `div` (comma/slash) nodes.
- **Safe Splitting**: We can split multi-value shorthands (borders, shadows, padding) by looking only at top-level `space` nodes, gracefully ignoring spaces *inside* `rgba()`, `calc()`, or `var()`.
- **Safe Traversal**: We can explicitly ignore the contents of `var()`, `url()`, and `env()` functions, guaranteeing we never corrupt author variables or assets when replacing `r` units.
- **Deep Interpolation**: We can safely transform `2r` inside nested `clamp()` or `calc()` functions.

---

## 3. Implementation Plan

### 3.1 Rhythm Unit Transforms (`extensions/rhythm/helpers.ts`)
Replace string/regex interpolation with AST traversal:
1. Parse the value: `const parsed = valueParser(value)`.
2. Walk the tree. 
3. **Bail**: If `node.type === 'function'` and name is `var`, `url`, or `env`, return `false`.
4. **Transform**: If `node.type === 'word'`, apply a strict regex (`/^-?\d*(?:\.\d+)?(?:\/\d+)?r$/`) to match the standalone `r` token, and replace it with the resolved `calc()`.

### 3.2 Border Shorthand Decomposition (`extensions/rhythm/border.ts`)
Upgrade the logic that decomposes `border="1px solid colors.gray.800"`.
- Use the AST parser to split the value by top-level `space` nodes.
- This allows authors to write complex border values like `border="calc(1px + 1r) solid rgba(0, 0, 0, 0.5)"` without the string parser breaking the functions.
- Safely extract width, style, and color nodes from the AST.

### 3.3 General Shorthand Parsing (`extensions/shorthands/parser.ts`)
Remove the manual parenthesis depth-counter (`depth++`, `depth--`) in `splitShorthandTokens`.
- For padding, margin, and other space-separated lists, split by top-level AST space nodes.
- This ensures `padding="1r var(--bottom-spacing) 2r"` resolves the `r` units without destroying the `var()`, and properly handles strings (e.g. `url("...")`) without breaking depth counting.

### 3.4 Shadow Utilities (`extensions/rhythm/utilities.ts`)
Currently, shadows with `r` units (`boxShadow="0 1r 2r rgba(0,0,0,0.1)"`) leak invalid CSS.
- Introduce `boxShadow` and `textShadow` into the rhythm transforms.
- The AST parser will safely find `1r` and `2r` offsets, leaving `rgba()` untouched.

### 3.5 Font Family Extraction (`extensions/api/font.ts`)
Replace the regex and `.split(',')[0]` hack used to extract the primary font name.
- Parse the font-family list using the AST.
- Walk the nodes and extract the first valid `word` or `string` node, safely avoiding commas and correctly stripping quotes.

---

## 4. Modules Affected

| Module | Location | Required Changes |
|---|---|---|
| **Dependencies** | `@reference-ui/core/package.json` | Add `postcss-value-parser`. |
| **Rhythm Helpers** | `packages/reference-core/src/system/panda/config/extensions/rhythm/helpers.ts` | Rewrite using AST walker. |
| **Border Shorthands** | `packages/reference-core/src/system/panda/config/extensions/rhythm/border.ts` | Refactor token decomposition to split by AST space nodes. |
| **Shorthands Parser** | `packages/reference-core/src/system/panda/config/extensions/shorthands/parser.ts` | Replace manual parenthesis counting with AST space-delimited splits. |
| **Shadow Utilities** | `packages/reference-core/src/system/panda/config/extensions/rhythm/utilities.ts` | Map shadows to the new AST rhythm parser. |
| **Font Extraction** | `packages/reference-core/src/system/panda/config/extensions/api/font.ts` | Replace naive comma-splitting with AST-based primary font extraction. |

---

## 5. Comprehensive Test Specification

### 5.1 AST Walker Safety (`helpers.test.ts`)
```ts
describe('AST-Based Rhythm Unit Interpolation', () => {
  it('interpolates "r" inside nested calc() and min()', () => {
    expect(resolveRhythm('calc(100% - min(2r, 10px))')).toBe(...)
  })
  it('ignores var() variables ending in "r" and strings/urls', () => {
    expect(resolveRhythm('var(--r)')).toBe('var(--r)')
    expect(resolveRhythm('url("/icon-r.png")')).toBe('url("/icon-r.png")')
  })
})
```

### 5.2 Safe Shorthand Splits (`shorthands.test.ts` & `border.test.ts`)
```ts
describe('AST-Based Shorthand Parsing', () => {
  it('safely splits padding with nested functions', () => {
    expect(resolveRhythmShorthand('1r var(--spacing-y, 10px) 2r')).toEqual([
      'var(--spacing-root)',
      'var(--spacing-y, 10px)',
      'calc(2 * var(--spacing-root))'
    ])
  })
  
  it('safely decomposes border shorthands with functions', () => {
    expect(borderShorthandUtilities.border.transform('calc(1px + 1r) solid rgba(0,0,0,0.1)', { token }))
      .toEqual({
        borderWidth: 'calc(1px + var(--spacing-root))',
        borderStyle: 'solid',
        borderColor: 'rgba(0,0,0,0.1)',
      })
  })
})
```

### 5.3 Font Family Parsing (`font.test.ts`)
```ts
describe('AST-Based Font Family Extraction', () => {
  it('safely extracts the first font name across varied syntaxes', () => {
    expect(parseFontFamilyName('"Times New Roman", Inter, sans-serif')).toBe('Times New Roman')
    expect(parseFontFamilyName('Inter, "Times New Roman"')).toBe('Inter')
    expect(parseFontFamilyName('var(--my-font), sans-serif')).toBe('var(--my-font)')
  })
})
```

### 5.4 Browser Matrix Pipeline Contract (`@matrix/primitives`)
Add Playwright E2E assertions:
* `boxShadow` using `1r` applies correctly.
* `padding="calc(100% - 2r)"` and `border="calc(1px + 1r) solid rgba(...)"` evaluate properly.

---

## 6. Staged Implementation Recommendation

1. **Phase 1: Foundation (AST Integration)**
   * Install `postcss-value-parser`.
   * Rewrite `resolveSingleRhythmValue`, `resolveRhythmExpression`, and `parseFontFamilyName`.
2. **Phase 2: Advanced Splitting (Borders & Shorthands)**
   * Refactor border decomposition (`border.ts`) and general shorthands (`parser.ts`) to split via AST spaces rather than naive `.split(' ')`.
3. **Phase 3: Shadows & Matrix Verification**
   * Enable `r` interpolation for `boxShadow`.
   * Run full `pnpm pipeline test --packages=@matrix/primitives`.
