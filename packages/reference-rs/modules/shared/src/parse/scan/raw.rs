//! The raw bracket net, and the opener count that lets a small source skip the scan.
//! The net counts `(`, `[` and `{` in every byte of the source as brackets, and `)`, `]` and `}` as their closers, never
//! taking the count below zero. It reads strings, comments, template text and JSX text as code, so it needs no lexing rule
//! to be right, and a mistake in the main scan cannot hide a pathological nest from it: it refuses a source whose count passes
//! `MAX_RAW`. A bound built from per-block counts clears almost every source without a byte-by-byte walk, and the walk runs
//! only when the bound cannot rule a refusal out. The opener count is the cheap test in front of the whole gate: every counted
//! level and every frame on the main scan's stack comes from one opener byte, so a source with no more than `MAX_NESTING` of
//! them cannot reach any limit.

use super::NestingRefusal;
use crate::parse::{MAX_NESTING, MAX_OPEN, MAX_RAW};

/// Bytes tallied per step; a `u8` tally per step cannot overflow, and the compiler turns it into wide byte compares.
const STEP: usize = 255;

/// Bytes per block of the bound.
const BLOCK: usize = 4096;

/// Whether `src` could reach any limit: it holds more than `MAX_NESTING` of `(`, `[`, `{` and `<`, or more than `MAX_OPEN` of
/// the bytes chain links are made of, or more than `MAX_OPEN` keyword letters (see `may_hold_keyword_run`).
pub(in crate::parse) fn can_refuse(src: &[u8]) -> bool {
    exceeds(src, MAX_NESTING, |byte| {
        matches!(byte, b'(' | b'[' | b'{' | b'<')
    }) || exceeds(src, MAX_OPEN, |byte| {
        matches!(byte, b'!' | b'~' | b'-' | b'+' | b'?' | b'=')
    }) || may_hold_keyword_run(src)
}

/// Whether `src` holds enough keyword letters for a run of more than `MAX_OPEN` keyword operators. Each of `typeof`, `void`,
/// `delete`, `await`, `keyof`, `readonly` and `new` holds a `y`, `v`, `l`, `w` or `k`, so a run of them holds that many such
/// letters. Only then does the scan look at words.
pub(in crate::parse) fn may_hold_keyword_run(src: &[u8]) -> bool {
    exceeds(src, MAX_OPEN, |byte| {
        matches!(byte, b'y' | b'v' | b'l' | b'w' | b'k')
    })
}

/// Whether more than `limit` bytes of `src` satisfy `wanted`, stopping as soon as that is so.
fn exceeds(src: &[u8], limit: usize, wanted: impl Fn(u8) -> bool + Copy) -> bool {
    let mut seen = 0usize;
    for step in src.chunks(STEP) {
        seen += tally(step, wanted);
        if seen > limit {
            return true;
        }
    }
    false
}

/// Refuses `src` when its raw bracket depth passes `MAX_RAW`, naming the line of the bracket that passes it.
pub(in crate::parse) fn check_raw(src: &[u8]) -> Result<(), NestingRefusal> {
    if !could_pass(src) {
        return Ok(());
    }
    let mut depth = 0usize;
    for (at, &byte) in src.iter().enumerate() {
        if is_opener(byte) {
            depth += 1;
            if depth > MAX_RAW {
                return Err(NestingRefusal {
                    depth,
                    line: 1 + super::literals::count_newlines(&src[..at]),
                });
            }
        } else if is_closer(byte) {
            depth = depth.saturating_sub(1);
        }
    }
    Ok(())
}

/// Whether the raw depth could pass `MAX_RAW`, judged from the openers and closers of each block alone. A block with `o`
/// openers and `c` closers starting at depth `d` peaks at `d + o` or less and ends at `max(d + o - c, o)` or less, because the
/// count never goes below zero. The bound follows those two limits, so it is never below the true depth, and when it stays
/// under `MAX_RAW` the walk can be skipped.
fn could_pass(src: &[u8]) -> bool {
    let mut bound = 0usize;
    for block in src.chunks(BLOCK) {
        let openers = tally(block, is_opener);
        if bound + openers > MAX_RAW {
            return true;
        }
        bound = (bound + openers)
            .saturating_sub(tally(block, is_closer))
            .max(openers);
    }
    false
}

/// The deepest raw bracket depth `src` reaches. The survey reports it beside the scan's own depth.
#[cfg(test)]
pub(in crate::parse) fn peak(src: &[u8]) -> usize {
    let (mut depth, mut deepest) = (0usize, 0usize);
    for &byte in src {
        if is_opener(byte) {
            depth += 1;
            deepest = deepest.max(depth);
        } else if is_closer(byte) {
            depth = depth.saturating_sub(1);
        }
    }
    deepest
}

fn is_opener(byte: u8) -> bool {
    matches!(byte, b'(' | b'[' | b'{')
}

fn is_closer(byte: u8) -> bool {
    matches!(byte, b')' | b']' | b'}')
}

/// How many bytes of `block` satisfy `wanted`, in steps small enough for a `u8` tally.
fn tally(block: &[u8], wanted: impl Fn(u8) -> bool + Copy) -> usize {
    block
        .chunks(STEP)
        .map(|step| {
            usize::from(
                step.iter()
                    .fold(0u8, |sum, &byte| sum + u8::from(wanted(byte))),
            )
        })
        .sum()
}
