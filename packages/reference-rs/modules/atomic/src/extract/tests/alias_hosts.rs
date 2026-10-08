//! Cargo tests for same-file const alias host re-admission.
//! A shadowed tag re-admits exactly when its `const X = Y` chain ends at an
//! admitted, unshadowed host: transparent wrappers peel, chains follow
//! lexically, and cycles, non-hosts, params, `let`, and rebound terminals
//! stay silent. Virtual sources carry no trace graph; configured hosts plus
//! file-local imports are the whole terminal truth here.

use crate::{compile, CompileRequest, VirtualSource};

fn compile_hosts(code: &str, hosts: Vec<String>) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "test.tsx".to_string(),
            content: code.to_string(),
        }]),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        jsx_hosts: Some(hosts),
        logs: Some(vec!["proof".to_string()]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

fn has_want(res: &crate::CompileResult, prop: &str, value: &str) -> bool {
    res.wants
        .iter()
        .any(|w| &*w.prop == prop && w.value.to_string() == value)
}

const IMPORT_DIV: &str = "import { Div } from '@reference-ui/react';";

#[test]
fn test_const_alias_of_imported_host_extracts() {
    let res = compile_hosts(
        &format!(
            "{IMPORT_DIV} const IconShell = Div; export const el = <IconShell display=\"inline-flex\" />;"
        ),
        vec![],
    );
    assert!(has_want(&res, "display", "inline-flex"));
}

#[test]
fn test_as_cast_alias_extracts() {
    let res = compile_hosts(
        &format!(
            "{IMPORT_DIV} const IconShell = Div as unknown as any; export const el = <IconShell mt=\"2r\" />;"
        ),
        vec![],
    );
    assert!(has_want(&res, "mt", "2r"));
}

#[test]
fn test_chained_alias_extracts() {
    let res = compile_hosts(
        &format!(
            "{IMPORT_DIV} const A = Div; const B = A; export const el = <B mt=\"2r\" />;"
        ),
        vec![],
    );
    assert!(has_want(&res, "mt", "2r"));
}

#[test]
fn test_alias_of_configured_host_extracts() {
    let res = compile_hosts(
        "const C2 = Card; export const el = <C2 mt=\"2r\" />;",
        vec!["Card".to_string()],
    );
    assert!(has_want(&res, "mt", "2r"));
}

#[test]
fn test_alias_cycle_stays_silent() {
    let res = compile_hosts(
        &format!("{IMPORT_DIV} const A = B; const B = A; export const el = <A mt=\"2r\" />;"),
        vec![],
    );
    assert!(res.wants.is_empty());
}

#[test]
fn test_alias_onto_non_host_stays_silent() {
    let res = compile_hosts(
        &format!("{IMPORT_DIV} const X = Other; export const el = <X mt=\"2r\" />;"),
        vec![],
    );
    assert!(res.wants.is_empty());
}

#[test]
fn test_param_shadow_over_alias_stays_silent() {
    let res = compile_hosts(
        &format!(
            "{IMPORT_DIV} const IconShell = Div; function f(IconShell) {{ return <IconShell mt=\"2r\" />; }}"
        ),
        vec![],
    );
    assert!(res.wants.is_empty());
}

#[test]
fn test_let_alias_stays_silent() {
    let res = compile_hosts(
        &format!("{IMPORT_DIV} let IconShell = Div; export const el = <IconShell mt=\"2r\" />;"),
        vec![],
    );
    assert!(res.wants.is_empty());
}

#[test]
fn test_rebound_terminal_stays_silent() {
    let res = compile_hosts(
        "const Div = Foo; const X = Div; export const el = <X mt=\"2r\" />;",
        vec!["Div".to_string()],
    );
    assert!(res.wants.is_empty());
}

#[test]
fn test_fn_scope_alias_extracts() {
    let res = compile_hosts(
        &format!(
            "{IMPORT_DIV} export function make() {{ const Shell = Div; return <Shell mt=\"2r\" />; }}"
        ),
        vec![],
    );
    assert!(has_want(&res, "mt", "2r"));
}
