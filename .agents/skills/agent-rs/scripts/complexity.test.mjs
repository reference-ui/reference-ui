#!/usr/bin/env node

/**
 * Hand-scored cases for the cognitive-complexity metric in complexity.mjs.
 * Each case is one small Rust or TypeScript function whose expected score follows the SonarSource
 * rule as briefed: a structure costs 1 plus its nesting depth, else and else-if cost a flat 1, each
 * run of like && or || costs 1, and nesting starts at zero inside the function body.
 * Run with: node --test .agents/skills/agent-rs/scripts/complexity.test.mjs
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyzeJsComplexity, analyzeRustComplexity } from './complexity.mjs'

function scoreRust(src) {
  const fns = analyzeRustComplexity(src)
  assert.equal(fns.length, 1, 'expected exactly one Rust function')
  return fns[0].cognitive
}

function scoreTs(src) {
  const fns = analyzeJsComplexity(src)
  assert.equal(fns.length, 1, 'expected exactly one TypeScript function')
  return fns[0].cognitive
}

// Cases the briefed rule fixes; each runs through both the Rust and the JS/TS analyser.
const SHARED_CASES = [
  {
    name: 'flat if is 1',
    expected: 1,
    rust: `fn f(a: i32) -> i32 {
    if a > 0 {
        return 1;
    }
    0
}`,
    ts: `function f(a) {
  if (a > 0) {
    return 1
  }
  return 0
}`,
  },
  {
    name: 'if nested in if is 3',
    expected: 3,
    rust: `fn f(a: i32, b: i32) -> i32 {
    if a > 0 {
        if b > 0 {
            return 2;
        }
    }
    0
}`,
    ts: `function f(a, b) {
  if (a > 0) {
    if (b > 0) {
      return 2
    }
  }
  return 0
}`,
  },
  {
    name: 'if / else if / else flat is 3',
    expected: 3,
    rust: `fn f(a: i32) -> i32 {
    if a > 0 {
        1
    } else if a < 0 {
        -1
    } else {
        0
    }
}`,
    ts: `function f(a) {
  if (a > 0) {
    return 1
  } else if (a < 0) {
    return -1
  } else {
    return 0
  }
}`,
  },
  {
    name: 'for containing an if is 3',
    expected: 3,
    rust: `fn f(xs: &[i32]) -> i32 {
    let mut n = 0;
    for x in xs {
        if *x > 0 {
            n += 1;
        }
    }
    n
}`,
    ts: `function f(xs) {
  let n = 0
  for (const x of xs) {
    if (x > 0) {
      n += 1
    }
  }
  return n
}`,
  },
  {
    name: 'one && run is 1',
    expected: 1,
    rust: `fn f(a: bool, b: bool, c: bool) -> bool {
    a && b && c
}`,
    ts: `function f(a, b, c) {
  return a && b && c
}`,
  },
]

for (const c of SHARED_CASES) {
  test(`rust: ${c.name}`, () => assert.equal(scoreRust(c.rust), c.expected))
  test(`ts: ${c.name}`, () => assert.equal(scoreTs(c.ts), c.expected))
}

// Rust-specific constructs.
test('rust: match counts once and its arms add nothing', () => {
  assert.equal(scoreRust(`fn f(x: i32) -> i32 {
    match x {
        0 => 1,
        1 => 2,
        _ => 3,
    }
}`), 1)
})

test('rust: a match guard is part of its arm, not an if', () => {
  assert.equal(scoreRust(`fn f(x: i32) -> i32 {
    match x {
        n if n > 0 => 1,
        _ => 0,
    }
}`), 1)
})

test('rust: a match arm block adds no depth beyond the match', () => {
  // match 1, the if inside the match at depth 1 costs 2, its else 1.
  assert.equal(scoreRust(`fn f(x: Option<i32>) -> i32 {
    match x {
        Some(n) => {
            if n > 0 {
                1
            } else {
                0
            }
        }
        None => 0,
    }
}`), 4)
})

test('rust: a let-else is an early exit, not a branch', () => {
  assert.equal(scoreRust(`fn f(o: Option<i32>) -> i32 {
    let Some(n) = o else {
        return 0;
    };
    n
}`), 0)
})

test('rust: the try operator ? does not count', () => {
  assert.equal(scoreRust(`fn f(a: &str) -> Result<i32, String> {
    let n = a.parse::<i32>().map_err(|e| e.to_string())?;
    Ok(n)
}`), 0)
})

test('rust: a closure bar || does not count as a boolean operator', () => {
  assert.equal(scoreRust(`fn f(o: Option<i32>) -> i32 {
    o.unwrap_or_else(|| 0)
}`), 0)
})

test('rust: a closure body nests the if inside it', () => {
  // The map closure is a nesting level: its if costs 2, the else 1.
  assert.equal(scoreRust(`fn f(xs: Vec<i32>) -> Vec<i32> {
    xs.into_iter().map(|x| {
        if x > 0 { x } else { 0 }
    }).collect()
}`), 3)
})

test('rust: mixed && and || are two runs', () => {
  assert.equal(scoreRust(`fn f(a: bool, b: bool, c: bool) -> bool {
    a && b || c
}`), 2)
})

test('rust: a labelled break costs 1 plus its nesting, per the briefed rule', () => {
  // loop 1, then the labelled break inside the loop at depth 1 costs 2.
  assert.equal(scoreRust(`fn f() {
    'outer: loop {
        break 'outer;
    }
}`), 3)
})

// TypeScript-specific constructs.
test('ts: a ternary at the top level is 1', () => {
  assert.equal(scoreTs(`function f(a) {
  return a ? 1 : 2
}`), 1)
})

test('ts: a ternary nested in an if is 3', () => {
  assert.equal(scoreTs(`function f(a, b) {
  if (a) {
    return b ? 1 : 2
  }
  return 0
}`), 3)
})

test('ts: optional chaining and nullish coalescing do not count', () => {
  assert.equal(scoreTs(`function f(o) {
  return o?.a ?? 0
}`), 0)
})

test('ts: a ? inside a regex literal does not count', () => {
  assert.equal(scoreTs(String.raw`function f(s) {
  return s.split(/\r?\n/)
}`), 0)
})

test('ts: a slash after an operand is division, so a ternary after it still counts', () => {
  assert.equal(scoreTs(`function f(a, b, c) {
  return a / b / c ? 1 : 2
}`), 1)
})

test('ts: object literal braces do not add depth', () => {
  // The ternary in the literal is depth 0 (1), the if is 1.
  assert.equal(scoreTs(`function f(a) {
  const o = { x: a ? 1 : 2 }
  if (a) {
    return o
  }
  return null
}`), 2)
})

test('ts: a do-while counts once', () => {
  assert.equal(scoreTs(`function f(n) {
  do {
    n--
  } while (n > 0)
  return n
}`), 1)
})

test('ts: a .catch() method call is not a catch clause, a real catch with an if is 3', () => {
  assert.equal(scoreTs(`function f(p) {
  p.catch((e) => e)
  try {
    g()
  } catch (e) {
    if (e) {
      h()
    }
  }
}`), 3)
})

test('ts: an arrow function body nests the if inside it', () => {
  assert.equal(scoreTs(`function f(xs) {
  xs.map((x) => {
    if (x) {
      return 1
    }
    return 0
  })
}`), 2)
})
