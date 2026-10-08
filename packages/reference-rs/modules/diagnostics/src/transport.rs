//! Minimal JSON transport carrying diagnostics from the native compiler to every consumer.
//! Native functions return `encode_batch` strings over napi; TypeScript parses them with the `diagnostics` js
//! mirror, which validates the same contract. Nothing here knows about napi types, so the template stays a pure
//! domain crate while each module's `native.rs` keeps owning its own boundary functions and payload shapes.

use std::fmt;

use crate::diagnostic::Diagnostic;

/// Encode one diagnostic to its wire JSON; decoding it anywhere must yield the same value.
pub fn encode(diagnostic: &Diagnostic) -> Result<String, TransportError> {
    serde_json::to_string(diagnostic).map_err(TransportError::from_json)
}

/// Decode one diagnostic, failing closed on off-shape codes, blank messages, and tag mismatches.
pub fn decode(json: &str) -> Result<Diagnostic, TransportError> {
    serde_json::from_str(json).map_err(TransportError::from_json)
}

/// Encode a batch for napi return: `Ok(encode_batch(&diagnostics)?)` is the whole native side.
pub fn encode_batch(diagnostics: &[Diagnostic]) -> Result<String, TransportError> {
    serde_json::to_string(diagnostics).map_err(TransportError::from_json)
}

/// Decode a batch produced by `encode_batch` or the js mirror; any bad row refuses the batch.
pub fn decode_batch(json: &str) -> Result<Vec<Diagnostic>, TransportError> {
    serde_json::from_str(json).map_err(TransportError::from_json)
}

/// A payload that failed transport encode or decode, carrying serde's reason.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TransportError(String);

impl TransportError {
    fn from_json(error: serde_json::Error) -> Self {
        Self(error.to_string())
    }
}

impl fmt::Display for TransportError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "diagnostic transport failed: {}", self.0)
    }
}

impl std::error::Error for TransportError {}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::span::{ByteSpan, Label};

    /// Cross-language golden: the vitest suite parses these exact bytes, so any drift fails loudly there too.
    const SINGLE_GOLDEN: &str = "{\"severity\":\"warning\",\"code\":\"RS-W-EXAMPLE-TOKEN\",\
        \"message\":\"unknown token path `colors.nope` for prop `color`\",\
        \"file\":\"app/Button.tsx\",\"line\":12,\"column\":7}";

    const BATCH_GOLDEN: &str = "[{\"severity\":\"warning\",\"code\":\"RS-W-EXAMPLE-TOKEN\",\
        \"message\":\"unknown token path `colors.nope` for prop `color`\"},\
        {\"severity\":\"error\",\"code\":\"RS-E-EXAMPLE-BOOM\",\"message\":\"refused: two recipes claim `btn`\"}]";

    /// Rendering-channel golden: the span plus one label plus one help line the frame renderer reads.
    /// The vitest suite pins these exact bytes, so any cross-language drift fails loudly there too.
    const SPAN_GOLDEN: &str = "{\"severity\":\"warning\",\"code\":\"RS-W-EXAMPLE-TOKEN\",\
        \"message\":\"unknown token path `colors.nope` for prop `color`\",\
        \"file\":\"app/Button.tsx\",\"line\":12,\"column\":7,\
        \"span\":{\"start\":240,\"end\":252},\
        \"labels\":[{\"span\":{\"start\":240,\"end\":252},\"message\":\"no such token path\"}],\
        \"help\":[\"point the path at an existing token\"]}";

    #[test]
    fn golden_vectors_encode_exactly() {
        let single = Diagnostic::warning(
            "RS-W-EXAMPLE-TOKEN",
            "unknown token path `colors.nope` for prop `color`",
        )
        .unwrap()
        .with_location("app/Button.tsx", Some(12), Some(7));
        assert_eq!(encode(&single).unwrap(), SINGLE_GOLDEN);
        let batch = vec![
            Diagnostic::warning(
                "RS-W-EXAMPLE-TOKEN",
                "unknown token path `colors.nope` for prop `color`",
            )
            .unwrap(),
            Diagnostic::error("RS-E-EXAMPLE-BOOM", "refused: two recipes claim `btn`").unwrap(),
        ];
        assert_eq!(encode_batch(&batch).unwrap(), BATCH_GOLDEN);
    }

    #[test]
    fn span_golden_encodes_and_decodes_exactly() {
        let rendered = Diagnostic::warning(
            "RS-W-EXAMPLE-TOKEN",
            "unknown token path `colors.nope` for prop `color`",
        )
        .unwrap()
        .with_location("app/Button.tsx", Some(12), Some(7))
        .with_span("app/Button.tsx", ByteSpan::new(240, 252).unwrap())
        .push_label(
            Label::new(ByteSpan::new(240, 252).unwrap(), "no such token path").unwrap(),
        )
        .with_help(vec!["point the path at an existing token".to_string()])
        .unwrap();
        assert_eq!(encode(&rendered).unwrap(), SPAN_GOLDEN);
        let back = decode(SPAN_GOLDEN).unwrap();
        assert_eq!(back, rendered);
        assert_eq!(back.span, Some(ByteSpan::new(240, 252).unwrap()));
        assert_eq!(back.labels.as_ref().map(Vec::len), Some(1));
        assert_eq!(back.help.as_ref().map(Vec::len), Some(1));
    }

    #[test]
    fn golden_vectors_decode_to_structured_values() {
        let single = decode(SINGLE_GOLDEN).unwrap();
        assert_eq!(single.code.as_str(), "RS-W-EXAMPLE-TOKEN");
        assert_eq!(single.file.as_deref(), Some("app/Button.tsx"));
        assert_eq!(single.line, Some(12));
        let batch = decode_batch(BATCH_GOLDEN).unwrap();
        assert_eq!(batch.len(), 2);
        let round = decode_batch(&encode_batch(&batch).unwrap()).unwrap();
        assert_eq!(round, batch);
    }

    #[test]
    fn corrupt_batches_fail_closed() {
        assert!(decode("{\"severity\":\"warning\"}").is_err());
        assert!(
            decode_batch("[{\"severity\":\"warning\",\"code\":\"bogus\",\"message\":\"m\"}]")
                .is_err()
        );
        assert!(decode_batch("not json").is_err());
    }
}
