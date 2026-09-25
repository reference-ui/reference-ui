//! Validated diagnostic codes: the stable identity every diagnostic carries across the native boundary.
//! A code reads `NS-SEV-NAME` (namespace, severity tag, kebab name), so hosts can filter, group, and document
//! failures without parsing messages. Shape is enforced here at parse time; namespace allocation stays deliberate
//! in `REGISTRY.md`, which per-module agents extend without ever renaming or removing a shipped code.

use std::fmt;
use std::str::FromStr;

use serde::{Deserialize, Deserializer, Serialize, Serializer};

/// Namespace owned by the diagnostics template itself: registry tests, doc examples, and shared helpers.
/// Shipped modules never mint `RS-*` codes; `RS-W-EXAMPLE-*` and `RS-E-EXAMPLE-*` are reserved for tests and docs.
pub const TEMPLATE_NAMESPACE: &str = "RS";

/// Machine-readable copy of the `REGISTRY.md` namespace table, for advisory checks and documentation.
/// The registry document is the deliberate gate; parsing stays shape-open so consumers keep reading newer codes.
pub const REGISTERED_NAMESPACES: [&str; 10] = [
    "RS", "ATM", "ATL", "TST", "STT", "TGN", "CAN", "BSS", "VRS", "MGP",
];

/// Longest accepted code text; names stay short enough to grep and pin in goldens.
const MAX_CODE_LEN: usize = 64;

/// Stable identity of a diagnostic's failure class, validated at parse time.
/// Always `NS-SEV-NAME`: 2–4 uppercase letters of namespace, `W` or `E`, then one or more kebab segments.
/// No ts-rs export: the wire form is a plain string (see the `code` field override), and the js mirror
/// declares `DiagnosticCode` as `string` with validation in `parseCode`, not in the type.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct DiagnosticCode(String);

impl DiagnosticCode {
    /// Parse and validate a wire code; anything off-shape fails closed with the reason.
    pub fn parse(text: &str) -> Result<Self, CodeError> {
        if text.len() > MAX_CODE_LEN {
            return Err(CodeError::new("code exceeds 64 characters"));
        }
        let mut parts = text.split('-');
        let namespace = parts.next().unwrap_or_default();
        let tag = parts.next().unwrap_or_default();
        let name: Vec<&str> = parts.collect();
        validate_namespace(namespace)?;
        validate_tag(tag)?;
        validate_name(&name)?;
        Ok(Self(text.to_string()))
    }

    /// The validated wire text, e.g. `ATM-W-UNKNOWN-PROPERTY`.
    pub fn as_str(&self) -> &str {
        &self.0
    }

    /// The owning-module namespace, e.g. `ATM`.
    pub fn namespace(&self) -> &str {
        self.0.split('-').next().unwrap_or_default()
    }

    /// The severity tag the code was minted with: `W` or `E`.
    pub fn severity_tag(&self) -> char {
        self.0
            .split('-')
            .nth(1)
            .and_then(|tag| tag.chars().next())
            .unwrap_or('W')
    }

    /// The kebab name after the tag, e.g. `UNKNOWN-PROPERTY`.
    pub fn name(&self) -> &str {
        self.0.splitn(3, '-').nth(2).unwrap_or_default()
    }

    /// Whether the code was minted as a warning (`-W-`).
    pub fn is_warning_code(&self) -> bool {
        self.severity_tag() == 'W'
    }

    /// Whether the code was minted as an error (`-E-`).
    pub fn is_error_code(&self) -> bool {
        self.severity_tag() == 'E'
    }

    /// Advisory check against the registry table; unregistered but well-shaped codes still parse.
    /// Producers run this in their own tests to catch typos before minting a new namespace by accident.
    pub fn is_registered_namespace(&self) -> bool {
        REGISTERED_NAMESPACES.contains(&self.namespace())
    }
}

/// Two to four uppercase alphanumerics starting with a letter, e.g. `ATM` or `RS`.
fn validate_namespace(namespace: &str) -> Result<(), CodeError> {
    if !(2..=4).contains(&namespace.len()) {
        return Err(CodeError::new("namespace must be 2-4 characters"));
    }
    let mut chars = namespace.chars();
    let first = chars.next().unwrap_or('0');
    if !first.is_ascii_uppercase() {
        return Err(CodeError::new("namespace must start with A-Z"));
    }
    if !chars.all(|c| c.is_ascii_uppercase() || c.is_ascii_digit()) {
        return Err(CodeError::new(
            "namespace must be uppercase letters or digits",
        ));
    }
    Ok(())
}

/// Exactly `W` or `E`; `I` is reserved for a future template revision, never minted today.
fn validate_tag(tag: &str) -> Result<(), CodeError> {
    if tag == "W" || tag == "E" {
        return Ok(());
    }
    if tag == "I" {
        return Err(CodeError::new(
            "severity tag `I` is reserved; the template carries warnings and errors only",
        ));
    }
    Err(CodeError::new("severity tag must be `W` or `E`"))
}

/// One or more non-empty uppercase alphanumeric segments, e.g. `UNKNOWN-PROPERTY`.
fn validate_name(segments: &[&str]) -> Result<(), CodeError> {
    if segments.is_empty() {
        return Err(CodeError::new("code needs a kebab name after the tag"));
    }
    let shaped = segments.iter().all(|s| {
        !s.is_empty()
            && s.bytes()
                .all(|b| b.is_ascii_uppercase() || b.is_ascii_digit())
    });
    if !shaped {
        return Err(CodeError::new(
            "code name must be uppercase letters or digits in kebab segments",
        ));
    }
    Ok(())
}

impl FromStr for DiagnosticCode {
    type Err = CodeError;

    fn from_str(text: &str) -> Result<Self, Self::Err> {
        Self::parse(text)
    }
}

impl fmt::Display for DiagnosticCode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.as_str())
    }
}

impl Serialize for DiagnosticCode {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(self.as_str())
    }
}

impl<'de> Deserialize<'de> for DiagnosticCode {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let text = String::deserialize(deserializer)?;
        Self::parse(&text).map_err(serde::de::Error::custom)
    }
}

/// A code that failed shape validation, carrying the reason for fail-closed boundaries.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CodeError(String);

impl CodeError {
    fn new(reason: &str) -> Self {
        Self(reason.to_string())
    }
}

impl fmt::Display for CodeError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "invalid diagnostic code: {}", self.0)
    }
}

impl std::error::Error for CodeError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn valid_codes_parse_and_split() {
        let code = DiagnosticCode::parse("ATM-W-UNKNOWN-PROPERTY").unwrap();
        assert_eq!(code.namespace(), "ATM");
        assert_eq!(code.severity_tag(), 'W');
        assert_eq!(code.name(), "UNKNOWN-PROPERTY");
        assert!(code.is_warning_code());
        assert!(!code.is_error_code());
        assert_eq!(code.as_str(), "ATM-W-UNKNOWN-PROPERTY");
        assert_eq!(code.to_string(), "ATM-W-UNKNOWN-PROPERTY");
        let parsed: DiagnosticCode = "RS-E-EXAMPLE-BOOM".parse().unwrap();
        assert!(parsed.is_error_code());
        assert_eq!(parsed.namespace(), "RS");
    }

    #[test]
    fn malformed_codes_refuse_with_reasons() {
        for bad in [
            "",
            "ATM",
            "ATM-W",
            "ATM-W-",
            "ATM-X-NAME",
            "ATM-I-NAME",
            "atm-W-NAME",
            "ATM-w-NAME",
            "ATM-W-name",
            "A-W-NAME",
            "ATLAS-W-NAME",
            "1TM-W-NAME",
            "ATM-W--NAME",
            "ATM-W-NAME-",
            "W-NAME",
        ] {
            assert!(DiagnosticCode::parse(bad).is_err(), "accepted `{bad}`");
        }
        let long = format!("ATM-W-{}", "N".repeat(60));
        assert!(DiagnosticCode::parse(&long).is_err());
    }

    #[test]
    fn registry_namespaces_are_well_shaped() {
        assert_eq!(TEMPLATE_NAMESPACE, "RS");
        for namespace in REGISTERED_NAMESPACES {
            let code = format!("{namespace}-W-EXAMPLE");
            let parsed = DiagnosticCode::parse(&code).unwrap();
            assert!(parsed.is_registered_namespace());
        }
        let foreign = DiagnosticCode::parse("ZZ-W-SOMETHING").unwrap();
        assert!(!foreign.is_registered_namespace());
    }

    #[test]
    fn code_serde_round_trips_and_rejects_off_shape() {
        let code = DiagnosticCode::parse("TST-E-SCAN-FAILED").unwrap();
        let json = serde_json::to_string(&code).unwrap();
        assert_eq!(json, "\"TST-E-SCAN-FAILED\"");
        let back: DiagnosticCode = serde_json::from_str(&json).unwrap();
        assert_eq!(back, code);
        assert!(serde_json::from_str::<DiagnosticCode>("\"nope\"").is_err());
        assert!(serde_json::from_str::<DiagnosticCode>("\"ATM-I-X\"").is_err());
    }
}
