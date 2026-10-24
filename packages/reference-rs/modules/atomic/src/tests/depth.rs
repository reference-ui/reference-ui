//! Stack-fit test for the depth gate: a style value just under the limit compiles on a small stack.
//! Takes one file per chain shape through `compile()` on an 8 MiB thread in a release build, half the 16 MiB floor a
//! lane or an N-API export falls back to, and emits assertion failures when a file is refused or the process overflows.
//! A shape is a `css()` value chain or a chain of statements or types that sits beside a `css()` call. The 8 MiB was
//! measured: the costliest shape needs about 7 MiB at the limit, and `MAX_DEPTH` is the largest power of two that fits.

use crate::{compile, CompileRequest, DiagnosticCode, VirtualSource};

/// The stack the compile runs on: 8 MiB in a release build, half the smallest stack a caller gives. A debug build keeps
/// far larger frames, so it gets 256 MiB and the test there only pins that no shape recurses without bound.
const STACK: usize = if cfg!(debug_assertions) { 256 << 20 } else { 8 << 20 };

/// Links in each chain: the limit less a margin for the call, the object and the statement around the value.
const LINKS: usize = crate::depth::MAX_DEPTH - 16;

/// Code to place before the `css()` call, and the value the call takes as its colour.
struct Shape {
    prelude: String,
    value: String,
}

/// One chain per construct the walkers recurse through, each `LINKS` deep: a `css()` value, or statements or types
/// beside a call whose colour is plain.
fn shapes() -> Vec<(&'static str, Shape)> {
    let chain = |head: &str, link: &str, tail: &str| format!("{head}{}{tail}", link.repeat(LINKS));
    let value = |value: String| Shape { prelude: String::new(), value };
    let beside = |prelude: String| Shape { prelude, value: "'red'".to_string() };
    vec![
        ("binary", value(chain("'r'", " + 'e'", ""))),
        ("logical", value(chain("'red'", " || 'x'", ""))),
        ("conditional", value(chain("", "flag ? 'red' : ", "'blue'"))),
        ("unary", value(chain("", "!", "flag"))),
        ("negation", value(chain("", "- ", "1"))),
        ("member", value(chain("theme", ".a", ""))),
        ("computed", value(chain("theme", "['a']", ""))),
        ("optional", value(chain("theme", "?.a", ""))),
        ("call", value(chain("pick", "()", ""))),
        ("as", value(chain("'red'", " as string", ""))),
        ("non-null", value(chain("flag", "!", ""))),
        ("else-if", beside(chain("let n = 0\nif (flag) { n = 1 }", " else if (flag) { n = 2 }", "\n"))),
        ("conditional type", beside(chain("type Pick<X> = ", "X extends string ? 1 : ", "2\n"))),
    ]
}

/// Compiles one file holding `shape` and a `css()` call, and returns the diagnostics' codes.
fn compile_shape(shape: &Shape) -> Vec<DiagnosticCode> {
    let Shape { prelude, value } = shape;
    let content = format!(
        "import {{ css }} from '@reference-ui/react'\nconst theme = {{ a: 'red' }}\nconst flag = true\nconst pick = () => 'red'\n{prelude}export const deep = css({{ color: {value} }})\n"
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
    for (name, shape) in shapes() {
        let codes = std::thread::Builder::new()
            .stack_size(STACK)
            .spawn(move || compile_shape(&shape))
            .expect("thread must start")
            .join()
            .unwrap_or_else(|_| panic!("{name} chain panicked"));
        assert!(!codes.contains(&DiagnosticCode::ParseError), "{name} chain was refused: {codes:?}");
    }
}
