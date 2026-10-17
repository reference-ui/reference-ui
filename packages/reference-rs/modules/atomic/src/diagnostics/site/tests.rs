//! Pins source positions: line and column numbers count from one, columns count UTF-16 units, the
//! line index agrees with the linear scan, and located or empty-location diagnostics carry exactly
//! the position they were given. The catalog's fallback for an unknown source must stay honest
//! rather than silently dropping the position.

use super::*;
use crate::diagnostics::DiagnosticSeverity;

#[test]
fn line_col_counts_from_one() {
    assert_eq!(line_col("ab\ncd", 0), Some((1, 1)));
    assert_eq!(line_col("ab\ncd", 3), Some((2, 1)));
    assert_eq!(line_col("ab\ncd", 4), Some((2, 2)));
}

#[test]
fn line_col_counts_columns_in_utf16_units() {
    assert_eq!(line_col("a😀b", 5), Some((1, 4)));
}

#[test]
fn line_col_rejects_offsets_past_the_end() {
    assert_eq!(line_col("ab", 3), None);
}

fn assert_index_matches_scan(source: &str) {
    let index = LineIndex::for_source(source);
    for offset in 0..=source.len() as u32 + 1 {
        assert_eq!(
            index.line_col(source, offset),
            line_col(source, offset),
            "offset {offset} of {source:?}"
        );
    }
}

#[test]
fn line_index_matches_scan_on_edge_shapes() {
    for source in [
        "",
        "ab",
        "ab\ncd",
        "\n",
        "\n\n\n",
        "trailing\n",
        "\r\nmixed\nendings\r\n",
        "a😀b\n😀😀\nend",
        "line one\nline two is longer\nx",
    ] {
        assert_index_matches_scan(source);
    }
}

#[test]
fn tail_is_ascii_checks_every_word_position() {
    for len in 0..40 {
        assert!(tail_is_ascii(&vec![b'a'; len]), "len {len}");
    }
    for pos in 0..24 {
        let mut bytes = vec![b'a'; 24];
        bytes[pos] = 0x80;
        assert!(!tail_is_ascii(&bytes), "high bit at {pos}");
        bytes[pos] = 0x7f;
        assert!(tail_is_ascii(&bytes), "DEL at {pos}");
    }
    assert!(!tail_is_ascii("a\u{e9}b".as_bytes()));
    assert!(tail_is_ascii(b""));
}

#[test]
fn line_index_ascii_tail_matches_scan() {
    // ASCII edges through the arithmetic path, offset-for-offset vs the
    // scan; the mixed tail falls through to the walk on the same queries.
    for source in [
        "",
        "ab",
        "ab\ncd",
        "\n",
        "\n\n\n",
        "trailing\n",
        "a\r\nb\r\n",
        "prefix \u{1f600} tail\nsecond line here",
    ] {
        let index = LineIndex::for_source(source);
        for offset in 0..=source.len() as u32 + 1 {
            assert_eq!(
                index.line_col(source, offset),
                line_col(source, offset),
                "offset {offset} of {source:?}"
            );
        }
    }
}

#[test]
fn line_index_matches_scan_on_generated_text() {
    let alphabet = ["a", "bb", "\n", "😀", "\r\n", "z", "\n\n", "é"];
    let mut seed = 0x1234_5678u64;
    let mut text = String::new();
    for _ in 0..400 {
        seed = seed
            .wrapping_mul(6364136223846793005)
            .wrapping_add(1442695040888963407);
        text.push_str(alphabet[(seed >> 33) as usize % alphabet.len()]);
    }
    assert_index_matches_scan(&text);
}

#[test]
fn located_error_carries_file_and_position() {
    let loc = DiagnosticLocation {
        file: Some("a.tsx".to_string()),
        line: Some(4),
        column: Some(12),
        span: None,
    };
    let diagnostic = loc.error(
        DiagnosticCode::UnknownTokenReference,
        "unknown token reference `{colors.nope}`",
    );
    assert_eq!(diagnostic.severity, DiagnosticSeverity::Error);
    assert_eq!(diagnostic.code, DiagnosticCode::UnknownTokenReference);
    assert_eq!(diagnostic.file.as_deref(), Some("a.tsx"));
    assert_eq!(diagnostic.line, Some(4));
    assert_eq!(diagnostic.column, Some(12));
}

#[test]
fn located_warning_carries_file_and_position() {
    let loc = DiagnosticLocation {
        file: Some("located.ts".to_string()),
        line: Some(5),
        column: Some(15),
        span: Some(ByteSpan::new(60, 63).unwrap()),
    };
    let diagnostic = loc.warning(DiagnosticCode::UnknownTokenPath, "unknown token path `x.y`");
    assert_eq!(diagnostic.severity, DiagnosticSeverity::Warning);
    assert_eq!(diagnostic.file.as_deref(), Some("located.ts"));
    assert_eq!(diagnostic.line, Some(5));
    assert_eq!(diagnostic.column, Some(15));
    assert_eq!(diagnostic.span, Some(ByteSpan::new(60, 63).unwrap()));
}

#[test]
fn empty_location_warns_without_position() {
    let diagnostic = DiagnosticLocation::default().warning(
        DiagnosticCode::UnknownCondition,
        "unknown condition `_nope`",
    );
    assert_eq!(diagnostic.file, None);
    assert_eq!(diagnostic.line, None);
    assert_eq!(diagnostic.column, None);
}

#[test]
fn empty_location_errors_without_position() {
    let diagnostic = DiagnosticLocation::default().error(DiagnosticCode::ParseError, "boom");
    assert_eq!(diagnostic.file, None);
    assert_eq!(diagnostic.line, None);
}

#[test]
fn catalog_locates_span_starts_by_source_index() {
    let catalog = SourceCatalog::new(vec![("a.ts", "ab\ncd"), ("b.ts", "xy")]);
    let located = catalog.locate(SourceId(0), Span::new(3, 4));
    assert_eq!(located.file.as_deref(), Some("a.ts"));
    assert_eq!(located.line, Some(2));
    assert_eq!(located.column, Some(1));
    assert_eq!(located.span, Some(ByteSpan::new(3, 4).unwrap()));
    let second = catalog.locate(SourceId(1), Span::new(1, 2));
    assert_eq!(second.file.as_deref(), Some("b.ts"));
    assert_eq!(second.line, Some(1));
    assert_eq!(second.column, Some(2));
    assert_eq!(second.span, Some(ByteSpan::new(1, 2).unwrap()));
}

#[test]
fn catalog_columns_count_emoji_in_utf16_units() {
    let catalog = SourceCatalog::new(vec![("e.ts", "a😀b")]);
    let located = catalog.locate(SourceId(0), Span::new(5, 6));
    assert_eq!(located.file.as_deref(), Some("e.ts"));
    assert_eq!(located.line, Some(1));
    assert_eq!(located.column, Some(4));
}

#[test]
fn catalog_falls_back_honestly_instead_of_skipping() {
    let catalog = SourceCatalog::new(vec![("a.ts", "ab")]);
    assert_eq!(
        catalog.locate(SourceId(7), Span::new(0, 1)),
        DiagnosticLocation::default()
    );
    assert_eq!(
        catalog.locate(SourceId(0), Span::new(99, 100)),
        DiagnosticLocation::default()
    );
}

#[test]
fn source_site_owns_no_borrows() {
    let site = SourceSite {
        source: SourceId(7),
        span: Span::new(10, 20),
        surface: StyleSurfaceKind::Css,
        prop: "color".into(),
        when: vec!["md".into()],
    };
    assert_eq!(site.source, SourceId(7));
    assert_eq!(site.surface, StyleSurfaceKind::Css);
    assert_eq!(site.span.start, 10);
}
