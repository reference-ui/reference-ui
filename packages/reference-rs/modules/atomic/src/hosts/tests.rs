//! Host gating tests: configured hosts admit unimported tags, empty hosts match legacy.
//! Proves explicit `jsxHosts` promote an unimported tag from an external
//! component (capital, no file-local import — G0 §D/C8) to a host, while
//! absent and empty host lists compile identically to each other. Also proves
//! the system's declared `jsxOwned` gates with no trace and ships sorted.

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
        logs: Some(vec!["proof".to_string()]),
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
    // Unconfigured, the capital tag is an external component (G0 §D/C8):
    // its want is external, never a host want.
    assert!(
        !gated.wants.is_empty() && gated.wants.iter().all(|w| w.external),
        "unconfigured tag is external, not a host: {:?}",
        gated.wants
    );

    let admitted =
        compile(&host_request(Some(vec!["ConfiguredHost".to_string()]))).expect("compile succeeds");
    assert!(has_mt(&admitted.wants, "4r"));
    assert!(
        admitted
            .wants
            .iter()
            .any(|w| &*w.prop == "mt" && !w.external),
        "a configured host collects a host want"
    );
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
    let located = super::diagnostics::convert_trace_diagnostic(
        styletrace::StyletraceDiagnostic::warning(
            "STT-W-SKIPPED-FILE",
            "trace skipped: unparsable",
        )
        .unwrap()
        .with_location("entry.ts", None, None),
    );
    assert_eq!(located.file.as_deref(), Some("entry.ts"));
    assert_eq!(located.message, "trace skipped: unparsable");
    let bare = super::diagnostics::convert_trace_diagnostic(
        styletrace::StyletraceDiagnostic::warning("STT-W-SKIPPED-FILE", "trace skipped").unwrap(),
    );
    assert_eq!(bare.file, None);
    assert_eq!(bare.message, "trace skipped");
}

fn owned_request(jsx_hosts: Option<Vec<String>>, owned: &[(&str, &[&str])]) -> CompileRequest {
    let mut request = host_request(jsx_hosts);
    for (host, names) in owned {
        request.base_system.jsx_owned.insert(
            (*host).to_string(),
            names.iter().map(|name| (*name).to_string()).collect(),
        );
    }
    request
}

/// No root and no entries: nothing traces, so only the system's declared
/// `jsxOwned` speaks. An owned name is an attribute on its component, never a
/// style, whether the tag is an external component or a configured host.
#[test]
fn test_declared_owned_props_gate_without_a_trace() {
    for hosts in [None, Some(vec!["ConfiguredHost".to_string()])] {
        let request = owned_request(hosts.clone(), &[("ConfiguredHost", &["mt"])]);
        let result = compile(&request).expect("compile succeeds");
        assert!(
            !result.wants.iter().any(|w| &*w.prop == "mt"),
            "hosts {hosts:?}: owned `mt` minted {:?}",
            result.wants
        );
        assert!(!result.stylesheet.contains("mt_4r"));
        assert_eq!(
            result.traced_jsx_owned,
            BTreeMap::from([("ConfiguredHost".to_string(), vec!["mt".to_string()])])
        );
    }
}

/// An owned name shadows only its own prop on its own tag: a sibling name
/// still extracts, and another component's owned names do not leak.
#[test]
fn test_declared_owned_props_shadow_only_their_own_names() {
    let sibling = owned_request(None, &[("ConfiguredHost", &["p"])]);
    let result = compile(&sibling).expect("compile succeeds");
    assert!(has_mt(&result.wants, "4r"), "{:?}", result.wants);

    let other_tag = owned_request(None, &[("OtherHost", &["mt"])]);
    let result = compile(&other_tag).expect("compile succeeds");
    assert!(has_mt(&result.wants, "4r"), "{:?}", result.wants);
}

/// Declared names union as sets and ship as sorted, unique arrays; a host
/// that owns nothing drops out of the result.
#[test]
fn test_declared_owned_wire_is_sorted_unique_and_drops_empty() {
    let request = owned_request(
        None,
        &[("CodeIcon", &["variant", "size", "size"]), ("Ghost", &[])],
    );
    let result = compile(&request).expect("compile succeeds");
    assert_eq!(
        result.traced_jsx_owned,
        BTreeMap::from([(
            "CodeIcon".to_string(),
            vec!["size".to_string(), "variant".to_string()]
        )])
    );
}

/// Nothing owned keeps the key off the wire, so existing results stay byte-identical.
#[test]
fn test_no_owned_props_keeps_the_wire_key_absent() {
    let result = compile(&host_request(None)).expect("compile succeeds");
    assert!(result.traced_jsx_owned.is_empty());
    let wire = serde_json::to_value(&result).expect("result serializes");
    assert!(wire.get("tracedJsxOwned").is_none(), "{wire}");
}
