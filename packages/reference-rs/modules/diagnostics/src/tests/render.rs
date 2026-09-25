//! Contract tests for the frame renderer: headers, arrows, gutters, carets, and caps.
//! Mirrors the js render vectors input-for-input so both sides of napi stay byte-identical.

use crate::diagnostic::Diagnostic;
use crate::render::{render_batch, render_frame, render_one_line, MAX_FRAMES};
use crate::span::{ByteSpan, Label};

const SOURCE: &str = "import { css } from \"./css\";\n\nconst style = css({ colr: \"red\" });\n";

fn warning() -> Diagnostic {
    Diagnostic::warning("RS-W-EXAMPLE-TOKEN", "unknown token path `colors.nope`").unwrap()
}

fn span_for(needle: &str) -> ByteSpan {
    let start = SOURCE.find(needle).unwrap();
    ByteSpan::new(start as u32, (start + needle.len()) as u32).unwrap()
}

#[test]
fn frame_shows_header_arrow_gutter_carets_label_and_help() {
    let diagnostic = warning()
        .with_span("app/Card.tsx", span_for("colr"))
        .push_label(Label::new(span_for("colr"), "no such token path").unwrap())
        .with_help(vec!["point the path at an existing token".to_string()])
        .unwrap();
    let frame = render_frame(&diagnostic, SOURCE).unwrap();
    assert!(frame.contains("warning[RS-W-EXAMPLE-TOKEN]: unknown token path"), "{frame}");
    assert!(frame.contains("--> app/Card.tsx:3:21"), "{frame}");
    assert!(frame.contains("3 | const style = css({ colr: \"red\" });"), "{frame}");
    assert!(frame.contains("^^^^ no such token path"), "{frame}");
    assert!(frame.contains("= help: point the path at an existing token"), "{frame}");
}

#[test]
fn frames_are_byte_identical_per_input() {
    let diagnostic = warning()
        .with_span("a.tsx", span_for("colr"))
        .push_label(Label::new(span_for("colr"), "note").unwrap());
    let first = render_frame(&diagnostic, SOURCE).unwrap();
    let second = render_frame(&diagnostic, SOURCE).unwrap();
    assert_eq!(first, second);
    let rebuilt = warning()
        .with_span("a.tsx", span_for("colr"))
        .push_label(Label::new(span_for("colr"), "note").unwrap());
    assert_eq!(render_frame(&rebuilt, SOURCE).unwrap(), first);
}

#[test]
fn unrenderable_diagnostics_report_none() {
    assert_eq!(render_frame(&warning(), SOURCE), None);
    let file_only = warning().with_location("a.tsx", Some(1), Some(2));
    assert_eq!(render_frame(&file_only, SOURCE), None);
    let past_end = warning().with_span("a.tsx", ByteSpan::new(9000, 9005).unwrap());
    assert_eq!(render_frame(&past_end, SOURCE), None);
    let split = warning().with_span("a.tsx", ByteSpan::new(1, 2).unwrap());
    assert_eq!(render_frame(&split, "héllo"), None);
}

#[test]
fn points_render_a_single_caret() {
    let offset = SOURCE.find("colr").unwrap() as u32;
    let diagnostic = warning().with_span("a.tsx", ByteSpan::point(offset));
    let frame = render_frame(&diagnostic, SOURCE).unwrap();
    assert!(frame.contains("--> a.tsx:3:21"), "{frame}");
    let carets = frame.lines().find(|line| line.contains('^')).unwrap();
    assert_eq!(carets.chars().filter(|c| *c == '^').count(), 1);
}

#[test]
fn multiline_spans_underline_every_touched_line() {
    let end = SOURCE.find("colr").unwrap() as u32 + 4;
    let diagnostic = warning().with_span("a.tsx", ByteSpan::new(0, end).unwrap());
    let frame = render_frame(&diagnostic, SOURCE).unwrap();
    assert!(frame.contains("1 | import"), "{frame}");
    assert!(frame.contains("2 | "), "{frame}");
    assert!(frame.contains("3 | const"), "{frame}");
    assert_eq!(frame.matches("-->").count(), 1);
}

#[test]
fn labels_on_other_lines_open_their_own_arrow() {
    let diagnostic = warning()
        .with_span("a.tsx", span_for("colr"))
        .push_label(Label::new(span_for("import"), "starts here").unwrap());
    let frame = render_frame(&diagnostic, SOURCE).unwrap();
    assert_eq!(frame.matches("-->").count(), 2);
    assert!(frame.contains("starts here"), "{frame}");
}

#[test]
fn batch_caps_frames_and_falls_back_to_one_liners() {
    let diagnostics = vec![
        warning().with_span("a.tsx", span_for("colr")),
        warning().with_span("a.tsx", span_for("css")),
        warning().with_span("a.tsx", span_for("red")),
    ];
    let source_for = |_: &str| Some(SOURCE.to_string());
    let capped = render_batch(&diagnostics, &source_for, 1);
    assert_eq!(capped.matches("-->").count(), 1);
    assert!(capped.contains("RS-W-EXAMPLE-TOKEN unknown token path"), "{capped}");
    let none = render_batch(&diagnostics, &source_for, 0);
    assert!(!none.contains("-->"), "{none}");
    let all = render_batch(&diagnostics, &source_for, MAX_FRAMES);
    assert_eq!(all.matches("-->").count(), 3);
}

#[test]
fn batch_falls_back_when_the_source_is_missing() {
    let diagnostics = vec![warning().with_span("a.tsx", span_for("colr"))];
    let missing = |_: &str| None;
    let out = render_batch(&diagnostics, &missing, MAX_FRAMES);
    assert!(!out.contains("-->"), "{out}");
    assert!(out.contains("a.tsx RS-W-EXAMPLE-TOKEN unknown token path"), "{out}");
    assert_eq!(render_batch(&[], &missing, MAX_FRAMES), "");
}

#[test]
fn one_line_mirrors_the_js_shape() {
    let located = warning().with_location("app/Button.tsx", Some(12), Some(7));
    assert_eq!(
        render_one_line(&located),
        "app/Button.tsx:12:7 RS-W-EXAMPLE-TOKEN unknown token path `colors.nope`"
    );
    let file_only = warning().with_location("a.tsx", None, None);
    assert_eq!(
        render_one_line(&file_only),
        "a.tsx RS-W-EXAMPLE-TOKEN unknown token path `colors.nope`"
    );
    assert_eq!(
        render_one_line(&warning()),
        "RS-W-EXAMPLE-TOKEN unknown token path `colors.nope`"
    );
    let multi = Diagnostic::warning("RS-W-EXAMPLE-TOKEN", "subject\nsecond line").unwrap();
    assert_eq!(render_one_line(&multi), "RS-W-EXAMPLE-TOKEN subject");
}

#[test]
fn error_frames_lead_with_error() {
    let diagnostic = Diagnostic::error("RS-E-EXAMPLE-BOOM", "refused: two recipes claim `btn`")
        .unwrap()
        .with_span("a.tsx", span_for("colr"));
    let frame = render_frame(&diagnostic, SOURCE).unwrap();
    assert!(frame.contains("error[RS-E-EXAMPLE-BOOM]: refused"), "{frame}");
}
