//! Bare-attr refusal positions: `<Div color />` and `<Div r />` warn located.
//! Bare style attributes mint through the locating path like string attrs, so the
//! `InvalidCssValue` refusal carries file + line + column of the attr name. Each
//! case pins the exact refusal site; ATM-DIAG-05's eleven refusals stay untouched.

use crate::{compile, CompileRequest, VirtualSource};

fn compile_code(code: &str) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "probe.tsx".into(),
            content: code.into(),
        }]),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        logs: Some(vec!["proof".to_string()]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

fn refusal_site(code: &str) -> (Option<String>, Option<u32>, Option<u32>) {
    let res = compile_code(code);
    let hits: Vec<_> = res
        .diagnostics
        .iter()
        .filter(|d| d.code == crate::diagnostics::DiagnosticCode::InvalidCssValue)
        .collect();
    assert_eq!(hits.len(), 1, "one refusal: {:?}", res.diagnostics);
    (hits[0].file.clone(), hits[0].line, hits[0].column)
}

/// Bare style attrs refuse located: file + line + column name the attr (B pin).
#[test]
fn bare_color_attr_refusal_carries_file_line_and_column() {
    let (file, line, column) = refusal_site(
        "import { Div } from '@reference-ui/react';\nexport const el = <Div color />;\n",
    );
    assert_eq!(file.as_deref(), Some("probe.tsx"));
    assert_eq!((line, column), (Some(2), Some(24)));
}

/// Bare `r` refuses located like its sibling spellings (B pin).
#[test]
fn bare_r_attr_refusal_carries_file_line_and_column() {
    let (file, line, column) =
        refusal_site("import { Div } from '@reference-ui/react';\nexport const el = <Div r />;\n");
    assert_eq!(file.as_deref(), Some("probe.tsx"));
    assert_eq!((line, column), (Some(2), Some(24)));
}
