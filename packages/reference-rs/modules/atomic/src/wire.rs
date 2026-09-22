//! Slim-wire codec for the dual stylesheets crossing the N-API seam.
//! The primary and portable sheets share their recipes+utilities suffix (printed
//! once by the emitter), so the slim result refolds the portable sheet as its
//! divergent head plus the shared tail's UTF-16 length. The JS wrapper rebuilds
//! the portable sheet by concatenating the head with the primary sheet's tail,
//! observing byte-identical strings while ~half the result bytes never cross.
//! The split is content-agnostic string algebra: it stays exact for any input
//! pair, including identical or empty sheets, and falls back to a full head
//! (diet skipped, still exact) if the boundary probe ever disagrees.

/// Portable sheet refolded against the primary sheet's shared tail.
pub struct SharedTail<'a> {
    /// Portable bytes before the shared tail; the whole sheet when nothing is shared.
    pub head: &'a str,
    /// Shared tail length in UTF-16 code units, the unit `String.prototype.slice` counts.
    pub tail_utf16: usize,
}

/// Split `portable` into its divergent head and the tail it shares with `primary`.
///
/// Scans the longest common byte-suffix, snaps its start forward to a UTF-8
/// lead byte (a lead position in valid UTF-8 is always a char boundary), and
/// counts the tail in UTF-16 units. Reconstruction is `head + primary.slice
/// (primary.length - tail_utf16)` and is exact for every input pair.
pub fn split_shared_suffix<'a>(primary: &str, portable: &'a str) -> SharedTail<'a> {
    let shared = suffix_start(primary.as_bytes(), portable.as_bytes());
    let tail_utf16 = utf16_units(&primary.as_bytes()[shared..]);
    match portable.get(..portable.len() - (primary.len() - shared)) {
        Some(head) => SharedTail { head, tail_utf16 },
        None => SharedTail { head: portable, tail_utf16: 0 },
    }
}

/// Byte index where the shared tail starts in `primary`: longest common
/// suffix with `other`, snapped forward past UTF-8 continuation bytes.
fn suffix_start(primary: &[u8], other: &[u8]) -> usize {
    let mut len = 0;
    while len < primary.len()
        && len < other.len()
        && primary[primary.len() - 1 - len] == other[other.len() - 1 - len]
    {
        len += 1;
    }
    let mut start = primary.len() - len;
    while start < primary.len() && (primary[start] & 0xC0) == 0x80 {
        start += 1;
    }
    start
}

/// UTF-16 code units in `tail`: one per scalar start, two for astral scalars.
fn utf16_units(tail: &[u8]) -> usize {
    let mut units = 0;
    for byte in tail {
        if (byte & 0xC0) != 0x80 {
            units += 1;
        }
        if *byte >= 0xF0 {
            units += 1;
        }
    }
    units
}

#[cfg(test)]
mod tests {
    use super::{split_shared_suffix, SharedTail};

    fn check(primary: &str, portable: &str, head: &str, tail: &str) {
        let SharedTail { head: got_head, tail_utf16 } = split_shared_suffix(primary, portable);
        assert_eq!(got_head, head);
        assert_eq!(tail_utf16, tail.encode_utf16().count());
        assert_eq!(format!("{got_head}{tail}"), portable);
        assert!(primary.ends_with(tail));
    }

    #[test]
    fn identical_sheets_fold_to_empty_head() {
        check("@layer x {}\n", "@layer x {}\n", "", "@layer x {}\n");
    }

    #[test]
    fn empty_pair_splits_empty() {
        check("", "", "", "");
    }

    #[test]
    fn divergent_middle_keeps_shared_tail() {
        check(
            "AAA-MID1-SHARED-TAIL",
            "AAA-MID2-SHARED-TAIL",
            "AAA-MID2",
            "-SHARED-TAIL",
        );
    }

    #[test]
    fn disjoint_sheets_keep_full_head() {
        check("abc", "def", "def", "");
    }

    #[test]
    fn astral_tail_counts_surrogate_pairs() {
        check("a🌀Z", "b🌀Z", "b", "🌀Z");
    }

    #[test]
    fn mid_char_suffix_snaps_to_empty_tail() {
        // Trailing 0xA9 is shared but starts mid-char (é vs ©); the snap
        // refuses the partial byte, so the whole sheet stays in the head.
        check("x\u{e9}", "y\u{a9}", "y\u{a9}", "");
    }
}
