//! `ATM-W-EXTERNAL-UNBACKED` pins (component-ownership plan S3, probe 4).
//! A tag bound to an installed package renders through that package's own
//! runtime, so its style props only paint when a composed upstream system
//! backs them. With nothing composed the compile warns once per styled tag,
//! at the tag, naming the package and the fix, on the default channel; a
//! same-file wrapper handing its `css` to such a tag warns at its call site.
//! Any upstream system, an unstyled tag, or a non-package tag stays silent.

use crate::diagnostics::{Diagnostic, DiagnosticCode, DiagnosticSeverity};
use crate::{compile, BaseSystem, CompileRequest, CompileResult, VirtualSource};

/// Compile these files standalone, or under `upstream` systems, with the
/// compiler and proof channels requested, so a stray line would show up
/// and the wants ride the result. The host roster carries primitive names
/// as core sends them, `Button` included, so a package's `Button` must
/// lose by provenance, not by a missing name.
fn compile_files(files: &[(&str, &str)], upstream: &[&str], system: BaseSystem) -> CompileResult {
    let req = CompileRequest {
        files: Some(
            files
                .iter()
                .map(|(path, content)| VirtualSource {
                    path: (*path).into(),
                    content: (*content).into(),
                })
                .collect(),
        ),
        base_system: system,
        jsx_hosts: Some(vec!["Div".into(), "Button".into()]),
        upstream_systems: upstream.iter().map(|name| (*name).to_string()).collect(),
        logs: Some(vec!["compiler".to_string(), "proof".to_string()]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

/// One standalone file, as `test.tsx`, under the lib fixture system.
fn compile_standalone(code: &str) -> CompileResult {
    compile_files(
        &[("test.tsx", code)],
        &[],
        BaseSystem::lib_fixture().clone(),
    )
}

/// The unbacked warnings on the default channel.
fn unbacked(res: &CompileResult) -> Vec<&Diagnostic> {
    res.diagnostics
        .iter()
        .filter(|line| line.code == DiagnosticCode::ExternalUnbacked)
        .collect()
}

const ICONS: &str = "import { CheckIcon, ContentCopyIcon } from '@reference-ui/icons';\n\
                     export const styled = <ContentCopyIcon color=\"red\" p=\"1r\" />;\n\
                     export const plain = <CheckIcon />;\n";

/// Probe 4: a styled package tag with nothing composed warns once at the
/// tag (two style props, one line), naming the package and the fix; the
/// unstyled icon stays silent and the compiler channel carries no copy.
#[test]
fn styled_package_tag_warns_once_at_the_tag() {
    let res = compile_standalone(ICONS);
    let rows = unbacked(&res);
    assert_eq!(rows.len(), 1, "{:?}", res.diagnostics);
    let row = rows[0];
    assert_eq!(row.severity, DiagnosticSeverity::Warning);
    assert_eq!(row.file.as_deref(), Some("test.tsx"));
    assert_eq!((row.line, row.column), (Some(2), Some(23)));
    assert_eq!(
        row.message,
        "style props on <ContentCopyIcon> will not paint: '@reference-ui/icons' styles it \
         with its own system, and no system in `extends` or `layers` backs it"
    );
    let help = row.help.clone().unwrap_or_default();
    assert_eq!(
        help,
        vec!["add the '@reference-ui/icons' baseSystem to `extends` or `layers` in ui.config"]
    );
    assert!(!row.message.contains("jsxElements") && !help[0].contains("jsxElements"));
    let compiler = res.compiler_diagnostics.clone().unwrap_or_default();
    assert!(
        compiler
            .iter()
            .all(|line| line.code != DiagnosticCode::ExternalUnbacked),
        "{compiler:?}"
    );
}

/// Any composed upstream system backs external wants by fan-out, so the
/// warning is gone, and the wants still extract.
#[test]
fn any_upstream_system_silences_it() {
    let res = compile_files(
        &[("test.tsx", ICONS)],
        &["reference-icons"],
        BaseSystem::lib_fixture().clone(),
    );
    assert!(unbacked(&res).is_empty(), "{:?}", res.diagnostics);
    assert!(res
        .wants
        .iter()
        .any(|want| want.external && &*want.prop == "color"));
}

/// The warning names the package, not the subpath, including at the end of
/// a project barrel (probe 2) and through a namespace member tag.
#[test]
fn barrel_subpath_and_namespace_tags_name_their_package() {
    let res = compile_files(
        &[
            (
                "src/ui/index.ts",
                "export { Button } from '@reference-ui/lib/primitives';",
            ),
            (
                "src/main.tsx",
                "import { Button } from './ui';\
                 import * as Acme from 'acme-ui/cards';\
                 export const a = <Button color=\"blue\" />;\
                 export const b = <Acme.Card p=\"1r\" />;",
            ),
        ],
        &[],
        BaseSystem::lib_fixture().clone(),
    );
    let messages: Vec<&str> = unbacked(&res)
        .iter()
        .map(|row| row.message.as_str())
        .collect();
    assert_eq!(messages.len(), 2, "{messages:?}");
    assert!(messages[0].starts_with("style props on <Button> will not paint: '@reference-ui/lib' "));
    assert!(messages[1].starts_with("style props on <Acme.Card> will not paint: 'acme-ui' "));
}

/// A same-file `const` alias of a package import resolves to that package.
#[test]
fn alias_of_a_package_import_warns() {
    let res = compile_standalone(
        "import { Button } from 'acme-ui';\
         const Primary = Button;\
         export const el = <Primary color=\"blue\" />;",
    );
    let rows = unbacked(&res);
    assert_eq!(rows.len(), 1, "{:?}", res.diagnostics);
    assert!(rows[0].message.contains("<Primary>") && rows[0].message.contains("'acme-ui'"));
}

/// Own hosts, project components, and unbound names never warn: only a
/// package binding proves another runtime styles the tag.
#[test]
fn own_local_and_unbound_tags_stay_silent() {
    let res = compile_standalone(
        "import { Div } from '@reference-ui/react';\
         function Card(props: { color?: string }) { return <Div>{props.color}</Div>; }\
         export const own = <Div color=\"red\" />;\
         export const local = <Card color=\"red\" />;\
         export const unbound = <BoltIcon color=\"red\" />;",
    );
    assert!(unbacked(&res).is_empty(), "{:?}", res.diagnostics);
}

/// Props the package's own declaration owns mint no want, so a tag carrying
/// only those is unstyled and stays silent.
#[test]
fn owned_props_alone_stay_silent() {
    let mut system = BaseSystem::lib_fixture().clone();
    system
        .jsx_owned
        .insert("CodeIcon".into(), vec!["size".into()]);
    let res = compile_files(
        &[(
            "test.tsx",
            "import { CodeIcon } from 'icon-pkg';\
             export const el = <CodeIcon size=\"lg\" />;",
        )],
        &[],
        system,
    );
    assert!(unbacked(&res).is_empty(), "{:?}", res.diagnostics);
}

/// Probe 3: a same-file wrapper handing its `css` prop to a package tag
/// warns at the call site that sets `css`, naming that package; the inner
/// forward lowers nothing, and a call site without `css` stays silent.
#[test]
fn css_wrapper_around_a_package_tag_warns_at_its_call_site() {
    let res = compile_standalone(
        "import { Button } from '@reference-ui/lib/primitives';\
         const Wrap = ({ css }: { css?: object; color?: string }) => <Button css={css} />;\
         export const styled = <Wrap css={{ color: 'blue' }} />;\
         export const own = <Wrap color=\"blue\" />;",
    );
    let rows = unbacked(&res);
    assert_eq!(rows.len(), 1, "{:?}", res.diagnostics);
    assert!(rows[0]
        .message
        .starts_with("style props on <Wrap> will not paint: '@reference-ui/lib' "));
    let composed = compile_files(
        &[(
            "test.tsx",
            "import { Button } from '@reference-ui/lib/primitives';\
             const Wrap = ({ css }: { css?: object }) => <Button css={css} />;\
             export const el = <Wrap css={{ color: 'blue' }} />;",
        )],
        &["reference-ui"],
        BaseSystem::lib_fixture().clone(),
    );
    assert!(unbacked(&composed).is_empty(), "{:?}", composed.diagnostics);
}
