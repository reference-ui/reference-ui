//! Streaming compiles over virtual sources: byte-gated files drop their
//! programs after staging and refine on demand by re-parse. The gate truth
//! table pins which bytes stream; the compile tests pin resolution through
//! streamed files (direct import, barrel hop into a streamed target, unbound
//! bag lookup) plus located parse errors and sibling isolation for a
//! Broken-shaped streamed file. Each case compiles whole files, so staging,
//! demand-driven refinement, and error replay run exactly as in stations.

use crate::{compile, CompileRequest, VirtualSource};

/// Compile virtual sources with proof rows, asserting success.
fn compile_files(files: &[(&str, &str)]) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(
            files
                .iter()
                .map(|(path, content)| VirtualSource {
                    path: path.to_string(),
                    content: content.to_string(),
                })
                .collect(),
        ),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        logs: Some(vec!["proof".to_string()]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

/// True when a want carries this prop and authored number value.
fn has_number_want(result: &crate::CompileResult, prop: &str, value: &str) -> bool {
    result.wants.iter().any(|want| {
        want.prop.as_ref() == prop
            && matches!(&want.value, crate::atom::AtomValue::Number(text) if text.as_ref() == value)
    })
}

/// True when a want carries this prop and authored string value.
fn has_string_want(result: &crate::CompileResult, prop: &str, value: &str) -> bool {
    result.wants.iter().any(|want| {
        want.prop.as_ref() == prop
            && matches!(&want.value, crate::atom::AtomValue::String(text) if text.as_ref() == value)
    })
}

const STREAMED_UTIL: &str = "export const FACTOR = 3\n";
const BROKEN_SHAPE: &str = "export function Broken( {\n";

#[test]
fn stream_gate_pins_streaming_bytes() {
    assert!(crate::streaming_candidate(STREAMED_UTIL));
    assert!(crate::streaming_candidate(BROKEN_SHAPE));
    assert!(!crate::streaming_candidate(
        "import { x } from './y'\nexport const a = 1\n"
    ));
    assert!(!crate::streaming_candidate(
        "import { css } from '@reference-ui/react'\n"
    ));
    assert!(!crate::streaming_candidate("export const a = css({})\n"));
    assert!(!crate::streaming_candidate("export const r = recipe()\n"));
    assert!(!crate::streaming_candidate("export const el = <div />\n"));
    assert!(!crate::streaming_candidate("export const s = 'red'\n"));
    assert!(!crate::streaming_candidate("export const t = `4r`\n"));
    // Comments and strings holding needles retain: conservative is sound.
    assert!(!crate::streaming_candidate("// import nothing\nexport const a = 1\n"));
    assert!(!crate::streaming_candidate("export const a = 1 // <\n"));
}

#[test]
fn streamed_scalar_resolves_through_direct_import() {
    let res = compile_files(&[
        ("/v/src/util.ts", STREAMED_UTIL),
        (
            "/v/src/card.ts",
            "import { FACTOR } from './util'\nimport { css } from '@reference-ui/react'\nexport const a = css({ margin: FACTOR })\n",
        ),
    ]);
    assert!(has_number_want(&res, "margin", "3"));
    assert!(
        res.diagnostics
            .iter()
            .all(|diag| diag.severity != crate::diagnostics::DiagnosticSeverity::Error)
    );
}

#[test]
fn barrel_hop_routes_into_streamed_target() {
    // Barrels always retain (the specifier quotes fail string_skip); the hop
    // routes through the retained barrel record into the streamed target.
    let res = compile_files(&[
        ("/v/src/util.ts", STREAMED_UTIL),
        ("/v/src/barrel.ts", "export { FACTOR } from './util'\n"),
        (
            "/v/src/view.ts",
            "import { FACTOR } from './barrel'\nimport { css } from '@reference-ui/react'\nexport const a = css({ margin: FACTOR })\n",
        ),
    ]);
    assert!(has_number_want(&res, "margin", "3"));
}

#[test]
fn unbound_name_resolves_to_streamed_const() {
    // No import: the use answers from the project bag, whose merge keeps
    // streamed files. Imports never consult the bag; unbound names do.
    let res = compile_files(&[
        ("/v/src/util.ts", STREAMED_UTIL),
        (
            "/v/src/loose.ts",
            "import { css } from '@reference-ui/react'\nexport const a = css({ margin: FACTOR })\n",
        ),
    ]);
    assert!(has_number_want(&res, "margin", "3"));
}

#[test]
fn streamed_parse_error_reports_exact_location() {
    let res = compile_files(&[
        ("/v/src/broken.ts", BROKEN_SHAPE),
        (
            "/v/src/ok.ts",
            "import { css } from '@reference-ui/react'\nexport const a = css({ color: 'red' })\n",
        ),
    ]);
    let errors: Vec<_> = res
        .diagnostics
        .iter()
        .filter(|diag| diag.code == crate::DiagnosticCode::ParseError)
        .collect();
    assert_eq!(errors.len(), 1);
    let err = errors[0];
    assert_eq!(err.file.as_deref(), Some("/v/src/broken.ts"));
    // Same EOF shape as SITE-57's Broken golden, on line 2 here: oxc
    // reports the missing `}` at end of input, not at the brace.
    assert_eq!(err.line, Some(2));
    assert_eq!(err.column, Some(1));
    assert!(err.message.contains("Expected"));
    // Siblings still compile: isolation holds through streamed files.
    assert!(has_string_want(&res, "color", "red"));
}
