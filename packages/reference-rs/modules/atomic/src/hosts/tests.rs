//! Host gating tests: configured hosts admit unimported tags, empty hosts match legacy.
//! Proves explicit `jsxHosts` widen extraction without a file-local import while
//! absent and empty host lists compile identically to the pre-hosts baseline.

use super::*;
use crate::{compile, BaseSystem, VirtualSource};

fn host_request(jsx_hosts: Option<Vec<String>>) -> CompileRequest {
    CompileRequest {
        files: Some(vec![VirtualSource {
            path: "src/host.tsx".to_string(),
            content: "import { Div } from '@reference-ui/react'\n\
                export const el = <ConfiguredHost mt=\"4r\" />\n\
                void Div\n"
                .to_string(),
        }]),
        base_system: BaseSystem::lib_fixture().clone(),
        jsx_hosts,
        ..CompileRequest::default()
    }
}

fn has_mt(wants: &[crate::Want], value: &str) -> bool {
    wants
        .iter()
        .any(|w| &*w.prop == "mt" && w.value.to_string() == value)
}

#[test]
fn test_explicit_hosts_admit_unimported_tags() {
    let gated = compile(&host_request(None)).expect("compile succeeds");
    assert!(!has_mt(&gated.wants, "4r"));

    let admitted =
        compile(&host_request(Some(vec!["ConfiguredHost".to_string()]))).expect("compile succeeds");
    assert!(has_mt(&admitted.wants, "4r"));
    assert!(admitted.stylesheet.contains("mt_4r"));
}

#[test]
fn test_empty_hosts_match_legacy_fields() {
    let legacy = compile(&host_request(None)).expect("compile succeeds");
    let empty = compile(&host_request(Some(Vec::new()))).expect("compile succeeds");
    assert_eq!(empty.stylesheet, legacy.stylesheet);
    assert_eq!(empty.wants, legacy.wants);
    assert_eq!(empty.diagnostics, legacy.diagnostics);
}

#[test]
fn test_trace_skip_converts_to_host_report() {
    let located = super::diagnostics::convert_trace_diagnostic(styletrace::TraceDiagnostic {
        file: Some(std::path::PathBuf::from("entry.ts")),
        message: "trace skipped: unparsable".to_string(),
    });
    assert_eq!(located.file.as_deref(), Some("entry.ts"));
    assert_eq!(located.message, "trace skipped: unparsable");
    let bare = super::diagnostics::convert_trace_diagnostic(styletrace::TraceDiagnostic {
        file: None,
        message: "trace skipped".to_string(),
    });
    assert_eq!(bare.file, None);
    assert_eq!(bare.message, "trace skipped");
}
