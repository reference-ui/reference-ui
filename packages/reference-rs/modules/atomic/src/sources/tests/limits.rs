//! Brace-limit refusal on every source path (`ATM-E-INCLUDE-BRACE-LIMIT`).
//! Each test hands a request an include pattern past 1,024 globs or 64 levels and asserts that the gather, the checked
//! collect on the legacy and token paths and the whole compile refuse it by name, that a refusal on
//! the token path leaves the token live, and that patterns exactly at the limits compile. Compiled only under `cfg(test)`.

use super::{gathered, temp_root, token_request};
use crate::sources::{collect, collect_checked};
use crate::sources::gather::gather;
use crate::{CompileRequest, DiagnosticCode, DiagnosticSeverity};

const WIDE: usize = 11;
const DEEP: usize = 65;

fn wide() -> String {
    format!("src/{}.ts", "{a,b}".repeat(WIDE))
}

fn deep() -> String {
    format!("src/{}b{}.ts", "{a,".repeat(DEEP), "}".repeat(DEEP))
}

fn request(include: &str) -> CompileRequest {
    CompileRequest {
        include: Some(vec![include.to_string()]),
        ..Default::default()
    }
}

#[test]
fn gather_and_collect_refuse_a_wide_or_deep_pattern_by_name() {
    let message = format!("include pattern '{}' expands to more than 1,024 globs", wide());
    assert_eq!(collect(&request(&wide())).unwrap_err().to_string(), message);
    let message = format!("include pattern '{}' nests braces deeper than 64 levels", deep());
    assert_eq!(collect(&request(&deep())).unwrap_err().to_string(), message);
    assert_eq!(gather(&request(&deep())).unwrap_err().to_string(), message);
}

#[test]
fn collect_checked_rejects_with_the_stable_code() {
    let negated = format!("!{}", wide());
    let (code, message) = collect_checked(&request(&negated)).unwrap_err();
    assert_eq!(code, DiagnosticCode::IncludeBraceLimit);
    assert_eq!(code.as_str(), "ATM-E-INCLUDE-BRACE-LIMIT");
    assert!(message.contains(&negated), "{message}");
}

#[test]
fn patterns_exactly_at_the_limits_still_gather() {
    let ten = format!("src/{}.ts", "{a,b}".repeat(10));
    let sixty_four = format!("src/{}b{}.ts", "{a,".repeat(64), "}".repeat(64));
    for pattern in [ten, sixty_four] {
        assert!(gathered(&request(&pattern)).is_empty());
    }
}

#[test]
fn a_refused_pattern_leaves_the_retention_token_live() {
    let root = temp_root("brace-limit-token");
    std::fs::create_dir_all(root.join("src")).unwrap();
    std::fs::write(root.join("src/a.ts"), "export const a = 1;\n").unwrap();
    let root_str = root.to_string_lossy().to_string();
    let paths = vec![root.join("src/a.ts").to_string_lossy().to_string()];
    let response = crate::scan::scan(&super::scan_request(paths, &root_str, Vec::new(), true));
    let token = response.retention_token.unwrap();
    let refused = token_request(&root_str, token, Some(vec![wide()]));
    let (code, _) = collect_checked(&refused).unwrap_err();
    assert_eq!(code, DiagnosticCode::IncludeBraceLimit);
    let retried = token_request(&root_str, token, Some(vec!["src/**".to_string()]));
    let (sources, _) = collect_checked(&retried).unwrap();
    assert_eq!(sources.len(), 1);
    std::fs::remove_dir_all(&root).unwrap();
}

#[test]
fn compile_returns_the_named_error_diagnostic_and_no_atoms() {
    let result = crate::compile(&CompileRequest {
        base_system: crate::BaseSystem::lib_fixture().clone(),
        ..request(&wide())
    })
    .expect("a refused include is a diagnostic, not a thrown error");
    let [diagnostic] = result.diagnostics.as_slice() else {
        panic!("one diagnostic");
    };
    assert_eq!(diagnostic.code, DiagnosticCode::IncludeBraceLimit);
    assert_eq!(diagnostic.severity, DiagnosticSeverity::Error);
    assert!(diagnostic.message.contains(&wide()));
    assert_eq!(result.atom_count, 0);
}

#[test]
fn thousands_of_sequential_pairs_are_refused_without_overflowing_the_stack() {
    let pairs = format!("src/{}.ts", "{x,y}".repeat(5000));
    let (code, _) = collect_checked(&request(&pairs)).unwrap_err();
    assert_eq!(code, DiagnosticCode::IncludeBraceLimit);
    let literal = format!("src/{}.ts", "{x}".repeat(5000));
    assert!(gathered(&request(&literal)).is_empty());
}
