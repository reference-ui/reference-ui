//! Byte-offset spans and labeled underlines for rustc-grade diagnostic rendering.
//! Producers record cheap facts only: the file plus byte offsets into the source they compiled, never line or
//! column math. The wire carries those offsets verbatim while neo-side presentation resolves them to caret positions
//! post-compile, lazily, and only for diagnostics actually shown. Labels name one underline each; the note under a
//! label and every help line stay non-blank, so frames render deterministically from the typed shape.

use std::fmt;

use serde::{Deserialize, Deserializer, Serialize};
use ts_rs::TS;

/// Byte offsets into one source file: `start` inclusive, `end` exclusive, both in UTF-8 bytes.
/// Zero-width spans (`start == end`) point at one caret position, e.g. a parse error's label offset.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, TS)]
#[ts(export, export_to = "modules/diagnostics/js/generated/")]
pub struct ByteSpan {
    /// Inclusive start offset in UTF-8 bytes.
    pub start: u32,
    /// Exclusive end offset in UTF-8 bytes, never below `start`.
    pub end: u32,
}

impl ByteSpan {
    /// Build a span, refusing reversed offsets at the boundary.
    pub fn new(start: u32, end: u32) -> Result<Self, SpanError> {
        if start > end {
            return Err(SpanError::new(format!(
                "span start {start} is past end {end}"
            )));
        }
        Ok(Self { start, end })
    }

    /// A caret at one offset: the shape for single-offset facts with no known end.
    pub fn point(offset: u32) -> Self {
        Self {
            start: offset,
            end: offset,
        }
    }

    /// Bytes covered; zero for carets, saturating because struct literals skip `new`.
    pub fn len(self) -> u32 {
        self.end.saturating_sub(self.start)
    }

    /// Whether the span is a zero-width caret.
    pub fn is_point(self) -> bool {
        self.start == self.end
    }
}

/// Serde shadow: derive the offsets, then refuse reversed ranges like `new`.
#[derive(Deserialize)]
struct RawSpan {
    start: u32,
    end: u32,
}

impl<'de> Deserialize<'de> for ByteSpan {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let raw = RawSpan::deserialize(deserializer)?;
        Self::new(raw.start, raw.end).map_err(serde::de::Error::custom)
    }
}

/// One labeled underline inside a rendered frame: the byte range plus the note beneath it.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, TS)]
#[serde(rename_all = "camelCase")]
#[ts(
    export,
    export_to = "modules/diagnostics/js/generated/",
    rename_all = "camelCase"
)]
pub struct Label {
    /// The underlined byte range.
    pub span: ByteSpan,
    /// The note under the underline; non-blank like every diagnostic message.
    pub message: String,
}

impl Label {
    /// Build a label; the note must be non-blank like every diagnostic message.
    pub fn new(span: ByteSpan, message: impl Into<String>) -> Result<Self, SpanError> {
        let message = message.into();
        if message.trim().is_empty() {
            return Err(SpanError::new("label message must not be blank"));
        }
        Ok(Self { span, message })
    }
}

/// Serde shadow: derive the fields, then validate through the same check as `new`.
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct RawLabel {
    span: ByteSpan,
    message: String,
}

impl<'de> Deserialize<'de> for Label {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let raw = RawLabel::deserialize(deserializer)?;
        Self::new(raw.span, raw.message).map_err(serde::de::Error::custom)
    }
}

/// A span or label that failed boundary validation, carrying the reason.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SpanError(String);

impl SpanError {
    fn new(reason: impl Into<String>) -> Self {
        Self(reason.into())
    }
}

impl fmt::Display for SpanError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "invalid diagnostic span: {}", self.0)
    }
}

impl std::error::Error for SpanError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn spans_build_points_and_measure_without_panicking() {
        let span = ByteSpan::new(10, 20).unwrap();
        assert_eq!((span.start, span.end), (10, 20));
        assert_eq!(span.len(), 10);
        assert!(!span.is_point());
        let caret = ByteSpan::point(7);
        assert_eq!((caret.start, caret.end), (7, 7));
        assert_eq!(caret.len(), 0);
        assert!(caret.is_point());
        assert!(ByteSpan::new(20, 10).is_err());
        assert_eq!(ByteSpan { start: 9, end: 4 }.len(), 0);
    }

    #[test]
    fn labels_require_a_note() {
        let span = ByteSpan::point(3);
        assert!(Label::new(span, "expected a token here").is_ok());
        assert!(Label::new(span, "   ").is_err());
    }

    #[test]
    fn wire_round_trips_and_rejects_reversed_or_blank() {
        let label = Label::new(ByteSpan::new(4, 9).unwrap(), "unknown prop").unwrap();
        let json = serde_json::to_string(&label).unwrap();
        assert_eq!(
            json,
            "{\"span\":{\"start\":4,\"end\":9},\"message\":\"unknown prop\"}"
        );
        assert_eq!(serde_json::from_str::<Label>(&json).unwrap(), label);
        assert!(serde_json::from_str::<ByteSpan>("{\"start\":9,\"end\":4}").is_err());
        assert!(
            serde_json::from_str::<Label>(
                "{\"span\":{\"start\":4,\"end\":9},\"message\":\"  \"}"
            )
            .is_err()
        );
        assert!(
            serde_json::from_str::<Label>("{\"span\":{\"start\":9,\"end\":4},\"message\":\"m\"}")
                .is_err()
        );
    }
}
