//! Stack-fit test for the depth gate: a style value just under the limit compiles on a small stack.
//! Takes one `css()` call per chain shape through `compile()` on a 4 MiB thread in a release build, half the smallest
//! stack a caller gives and a quarter of the lane floor, and emits assertion failures when a call is refused or the
//! process overflows. The 4 MiB was measured: the costliest shape needs between 1.5 and 2 MiB at the limit.

use crate::{compile, CompileRequest, DiagnosticCode, VirtualSource};

/// The stack the compile runs on: 4 MiB in a release build, which fits the worst chain shape at the limit twice over. A debug
/// build keeps far larger frames, so it gets 64 MiB and the test there only pins that no shape recurses without bound.
const STACK: usize = if cfg!(debug_assertions) { 64 << 20 } else { 4 << 20 };

/// Links in each chain: the limit less a margin for the call, the object and the statement around the value.
const LINKS: usize = crate::depth::MAX_DEPTH - 16;

/// One `css()` value per construct the walkers recurse through, each `LINKS` deep.
fn values() -> Vec<(&'static str, String)> {
    let chain = |head: &str, link: &str, tail: &str| format!("{head}{}{tail}", link.repeat(LINKS));
    vec![
        ("binary", chain("'r'", " + 'e'", "")),
        ("logical", chain("'red'", " || 'x'", "")),
        ("conditional", chain("", "flag ? 'red' : ", "'blue'")),
        ("unary", chain("", "!", "flag")),
        ("negation", chain("", "- ", "1")),
        ("member", chain("theme", ".a", "")),
        ("computed", chain("theme", "['a']", "")),
        ("optional", chain("theme", "?.a", "")),
        ("call", chain("pick", "()", "")),
        ("as", chain("'red'", " as string", "")),
        ("non-null", chain("flag", "!", "")),
    ]
}

/// Compiles one file holding `value` as a colour, and returns the diagnostics' codes.
fn compile_value(value: &str) -> Vec<DiagnosticCode> {
    let content = format!(
        "import {{ css }} from '@reference-ui/react'\nconst theme = {{ a: 'red' }}\nconst flag = true\nconst pick = () => 'red'\nexport const deep = css({{ color: {value} }})\n"
    );
    let request = CompileRequest {
        files: Some(vec![VirtualSource {
            path: "src/deep.ts".to_string(),
            content,
        }]),
        base_system: crate::BaseSystem::lib_fixture().clone(),
        logs: Some(vec!["proof".to_string()]),
        ..CompileRequest::default()
    };
    let result = compile(&request).expect("compile must not fail");
    result.diagnostics.iter().map(|d| d.code).collect()
}

#[test]
fn every_chain_just_under_the_limit_compiles_on_a_small_stack() {
    for (name, value) in values() {
        let codes = std::thread::Builder::new()
            .stack_size(STACK)
            .spawn(move || compile_value(&value))
            .expect("thread must start")
            .join()
            .unwrap_or_else(|_| panic!("{name} chain panicked"));
        assert!(!codes.contains(&DiagnosticCode::ParseError), "{name} chain was refused: {codes:?}");
    }
}
