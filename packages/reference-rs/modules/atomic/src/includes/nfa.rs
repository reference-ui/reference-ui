//! Token-position automaton for one include glob alternative, stepped one character at a time.
//! A state is a closed, sorted, deduplicated set of positions into the token list, so a
//! directory's state is a small value that can be stored and compared without rereading its
//! path. Each transition and zero-width skip mirrors `glob::matches`, so `accepts` on the reached
//! set equals the glob verdict. A `**/` that has taken characters since its last `/` sits in an
//! open position, tagged by `OPEN`, because it may not yet hand over to the token after it.

use super::glob::{single_hit, Token};

/// Tag for a `**/` head that has consumed text since its last `/`.
/// Such a position may not yet skip to the token after it; a `/` returns it to the plain head.
const OPEN: u32 = 1 << 31;

/// Positions reached from `start` after reading `text`: closed, sorted and unique.
/// `start` is closed first, so `[0]` is the initial state of a pattern.
pub(super) fn advance(tokens: &[Token], start: &[u32], text: &str) -> Vec<u32> {
    let mut set = close(tokens, start.to_vec());
    for hit in text.chars() {
        set = step_char(tokens, &set, hit);
    }
    set
}

/// True when the reached set contains the position past the last token.
#[cfg(test)]
pub(super) fn accepts(tokens: &[Token], positions: &[u32]) -> bool {
    positions
        .iter()
        .any(|&position| position as usize == tokens.len())
}

/// Zero-width closure: a star or a `**/` head also admits the token after it.
/// Positions are walked in ascending order, so every skip lands after the position that made it.
fn close(tokens: &[Token], mut set: Vec<u32>) -> Vec<u32> {
    set.sort_unstable();
    set.dedup();
    let mut at = 0;
    while at < set.len() {
        if let Some(next) = skip_target(tokens, set[at]) {
            if let Err(slot) = set.binary_search(&next) {
                set.insert(slot, next);
            }
        }
        at += 1;
    }
    set
}

/// The position a zero-width token at `position` also admits, if it has one.
fn skip_target(tokens: &[Token], position: u32) -> Option<u32> {
    if position & OPEN != 0 {
        return None;
    }
    match tokens.get(position as usize)? {
        Token::AnyInSegment | Token::AnyAcross | Token::AnySegments => Some(position + 1),
        _ => None,
    }
}

/// One character from every position of a closed set, then the closure of what it reaches.
fn step_char(tokens: &[Token], set: &[u32], hit: char) -> Vec<u32> {
    let mut next = Vec::new();
    for &position in set {
        step_position(tokens, position, hit, &mut next);
    }
    close(tokens, next)
}

/// Push every position that one character leads to from `position`.
fn step_position(tokens: &[Token], position: u32, hit: char, next: &mut Vec<u32>) {
    if position & OPEN != 0 {
        // The open segment ends at `/`, back on the plain head; any other character keeps it open.
        next.push(if hit == '/' {
            position & !OPEN
        } else {
            position
        });
        return;
    }
    let Some(token) = tokens.get(position as usize) else {
        return;
    };
    match token {
        Token::AnyInSegment => {
            if hit != '/' {
                next.push(position);
            }
        }
        Token::AnyAcross => next.push(position),
        Token::AnySegments => next.push(if hit == '/' {
            position
        } else {
            position | OPEN
        }),
        _ => {
            if single_hit(token, hit) {
                next.push(position + 1);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::super::glob;
    use super::*;

    /// Every concatenation of up to `max_len` pieces, the empty text included.
    fn sequences(pieces: &[&str], max_len: usize) -> Vec<String> {
        let mut all = vec![String::new()];
        let mut frontier = vec![String::new()];
        for _ in 0..max_len {
            let mut next = Vec::new();
            for stem in &frontier {
                for piece in pieces {
                    next.push(format!("{stem}{piece}"));
                }
            }
            all.extend(next.iter().cloned());
            frontier = next;
        }
        all
    }

    const PATTERN_PIECES: [&str; 6] = ["a", "*", "**", "?", "/", "[ab]"];
    const PATH_PIECES: [&str; 3] = ["a", "b", "/"];

    #[test]
    fn accepts_exactly_what_glob_matches() {
        for pattern in sequences(&PATTERN_PIECES, 4) {
            let tokens = glob::parse(&pattern);
            for path in sequences(&PATH_PIECES, 5) {
                let reached = advance(&tokens, &[0], &path);
                assert!(
                    reached.windows(2).all(|pair| pair[0] < pair[1]),
                    "pattern {pattern:?} path {path:?}: not sorted and unique: {reached:?}"
                );
                assert_eq!(
                    accepts(&tokens, &reached),
                    glob::matches(&tokens, &path),
                    "pattern {pattern:?} path {path:?} reached {reached:?}"
                );
            }
        }
    }

    #[test]
    fn stepping_in_parts_equals_stepping_whole() {
        let mut live_splits = 0;
        for pattern in sequences(&PATTERN_PIECES, 4) {
            let tokens = glob::parse(&pattern);
            for path in sequences(&PATH_PIECES, 5) {
                let whole = advance(&tokens, &[0], &path);
                for (cut, _) in path.match_indices('/') {
                    let (head, tail) = path.split_at(cut + 1);
                    let parts = advance(&tokens, &advance(&tokens, &[0], head), tail);
                    assert_eq!(parts, whole, "pattern {pattern:?} path {path:?} cut {cut}");
                    live_splits += usize::from(!whole.is_empty());
                }
            }
        }
        assert!(live_splits > 0, "no split pair reached a live state");
    }

    #[test]
    fn a_double_star_segment_needs_its_slash() {
        let tokens = glob::parse("**/a");
        assert!(accepts(&tokens, &advance(&tokens, &[0], "/a")));
        assert!(!accepts(&tokens, &advance(&tokens, &[0], "xa")));
    }
}
