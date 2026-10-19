//! `ATM-W-EXTERNAL-UNBACKED` pins (component-ownership S3, styling plan S2).
//! A tag bound to a package that published a system renders through that
//! package's own runtime, so its style props only paint when this compile
//! composes one of the systems the package renders through. When none is
//! composed, even with other systems in `extends` (gap 2), the compile warns
//! once per styled tag, at the tag, naming the package, its system and the
//! `<package>/baseSystem` fix, on the default channel, and the wants back
//! under nothing; a same-file wrapper handing its `css` to such a tag warns at
//! its call site. Composing the package's system silences it. An unstyled tag,
//! a non-package tag and a package not built on Reference UI stay silent.

use crate::atom::Backing;
use crate::diagnostics::{Diagnostic, DiagnosticCode, DiagnosticSeverity};
use crate::tests::packages::PackageApp;
use crate::{compile, CompileResult};

/// The unbacked warnings on the default channel.
fn unbacked(res: &CompileResult) -> Vec<&Diagnostic> {
    res.diagnostics
        .iter()
        .filter(|line| line.code == DiagnosticCode::ExternalUnbacked)
        .collect()
}

/// Each style plan as `<system> <prop> <classes>`.
fn plan_rows(res: &CompileResult) -> Vec<String> {
    let mut rows: Vec<String> = res
        .style_plans
        .iter()
        .map(|plan| {
            let classes: Vec<&str> = plan
                .declarations
                .iter()
                .map(|decl| decl.class_name.as_str())
                .collect();
            format!("{} {} {}", plan.system, plan.prop, classes.join(","))
        })
        .collect();
    rows.sort();
    rows
}

/// Compile `src/test.tsx` in a fresh scratch app with `upstream` composed.
fn compile_app(name: &str, code: &str, upstream: &[&str]) -> CompileResult {
    PackageApp::new(name).compile(&[("src/test.tsx", code)], upstream)
}

const ICONS: &str = "import { CheckIcon, ContentCopyIcon } from '@reference-ui/icons';\n\
                     export const styled = <ContentCopyIcon color=\"red\" p=\"1r\" />;\n\
                     export const plain = <CheckIcon />;\n";

/// Probe 4: a styled package tag with nothing composed warns once at the
/// tag (two style props, one line), naming the package, its system and the
/// fix; the unstyled icon stays silent and the compiler channel carries no copy.
#[test]
fn styled_package_tag_warns_once_at_the_tag() {
    let res = compile_app("unbacked-icons", ICONS, &[]);
    let rows = unbacked(&res);
    assert_eq!(rows.len(), 1, "{:?}", res.diagnostics);
    let row = rows[0];
    assert_eq!(row.severity, DiagnosticSeverity::Warning);
    assert!(row
        .file
        .as_deref()
        .is_some_and(|file| file.ends_with("src/test.tsx")));
    assert_eq!((row.line, row.column), (Some(2), Some(23)));
    assert_eq!(
        row.message,
        "style props on <ContentCopyIcon> will not paint: '@reference-ui/icons' renders \
         through its own system 'reference-icons', and no system in `extends` or `layers` backs it"
    );
    let help = row.help.clone().unwrap_or_default();
    assert_eq!(
        help,
        vec!["add '@reference-ui/icons/baseSystem' to `extends` or `layers` in ui.config"]
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

/// Composing the package's own system backs its wants, so the warning is
/// gone and they plan under that system.
#[test]
fn composing_the_package_system_silences_it() {
    let res = compile_app("unbacked-composed", ICONS, &["reference-icons"]);
    assert!(unbacked(&res).is_empty(), "{:?}", res.diagnostics);
    let color = res
        .wants
        .iter()
        .find(|want| &*want.prop == "color")
        .expect("the want still extracts");
    assert_eq!(color.backing, Backing::systems(["reference-icons"]));
}

const GAP_TWO: &str = "import { Div } from '@reference-ui/react';\n\
                       import { Badge } from 'acme-ui';\n\
                       export const own = <Div p=\"1r\" />;\n\
                       export const acme = <Badge color=\"blue\" />;\n";

/// Gap 2 (plan §1): an app that extends lib but not acme. Before S2 the
/// spray backed `reference-ui__c_blue`, a class acme's runtime never mints,
/// and nothing warned. Now acme's want backs under no system, nothing prints
/// for it under any composed system, and the tag warns naming `acme-ui`, its
/// system `acme` and the `acme-ui/baseSystem` fix.
#[test]
fn gap_two_partly_composed_warns_and_backs_nothing() {
    let res = compile_app("unbacked-gap-two", GAP_TWO, &["reference-ui"]);
    let rows = unbacked(&res);
    assert_eq!(rows.len(), 1, "{:?}", res.diagnostics);
    assert_eq!(rows[0].line, Some(4));
    assert_eq!(
        rows[0].message,
        "style props on <Badge> will not paint: 'acme-ui' renders through its own system \
         'acme', and no system in `extends` or `layers` backs it"
    );
    assert_eq!(
        rows[0].help.clone().unwrap_or_default(),
        vec!["add 'acme-ui/baseSystem' to `extends` or `layers` in ui.config"]
    );
    let color = res
        .wants
        .iter()
        .find(|want| &*want.prop == "color")
        .expect("want");
    assert_eq!(color.backing, Backing::none());
    assert_eq!(
        plan_rows(&res),
        vec!["@reference-ui/lib p @reference-ui/lib__p_1r"]
    );
    assert!(!res.stylesheet.contains("__c_blue"), "{}", res.stylesheet);
}

/// Gap 2 resolved: composing acme beside lib backs acme's want under `acme`
/// only, with no spray onto `reference-ui`, and the warning is gone.
#[test]
fn gap_two_composed_backs_under_acme_only() {
    let res = compile_app(
        "unbacked-gap-two-composed",
        GAP_TWO,
        &["reference-ui", "acme"],
    );
    assert!(unbacked(&res).is_empty(), "{:?}", res.diagnostics);
    let color = res
        .wants
        .iter()
        .find(|want| &*want.prop == "color")
        .expect("want");
    assert_eq!(color.backing, Backing::systems(["acme"]));
    assert_eq!(
        plan_rows(&res),
        vec![
            "@reference-ui/lib p @reference-ui/lib__p_1r",
            "acme color acme__c_blue",
        ]
    );
    assert!(
        !res.stylesheet.contains("reference-ui__c_blue"),
        "{}",
        res.stylesheet
    );
    assert!(res.stylesheet.contains("/* foreign acme */"));
}

/// The warning names the package, not the subpath, including at the end of
/// a project barrel (probe 2) and through a namespace member tag.
#[test]
fn barrel_subpath_and_namespace_tags_name_their_package() {
    let res = PackageApp::new("unbacked-barrel").compile(
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
    );
    let messages: Vec<&str> = unbacked(&res)
        .iter()
        .map(|row| row.message.as_str())
        .collect();
    assert_eq!(messages.len(), 2, "{messages:?}");
    assert!(messages[0].starts_with(
        "style props on <Button> will not paint: '@reference-ui/lib' renders through its own \
         system 'reference-ui'"
    ));
    assert!(messages[1].starts_with(
        "style props on <Acme.Card> will not paint: 'acme-ui' renders through its own system 'acme'"
    ));
}

/// A same-file `const` alias of a package import resolves to that package.
#[test]
fn alias_of_a_package_import_warns() {
    let res = compile_app(
        "unbacked-alias",
        "import { Button } from 'acme-ui';\
         const Primary = Button;\
         export const el = <Primary color=\"blue\" />;",
        &[],
    );
    let rows = unbacked(&res);
    assert_eq!(rows.len(), 1, "{:?}", res.diagnostics);
    assert!(rows[0].message.contains("<Primary>") && rows[0].message.contains("'acme-ui'"));
}

/// Own hosts, project components, unbound names and packages not built on
/// Reference UI never warn: only a published system proves another runtime
/// styles the tag.
#[test]
fn own_local_unbound_and_foreign_tags_stay_silent() {
    let res = compile_app(
        "unbacked-silent",
        "import { Div } from '@reference-ui/react';\
         import { Icon } from 'lucide';\
         import { Badge } from 'not-installed';\
         function Card(props: { color?: string }) { return <Div>{props.color}</Div>; }\
         export const own = <Div color=\"red\" />;\
         export const local = <Card color=\"red\" />;\
         export const unbound = <BoltIcon color=\"red\" />;\
         export const foreign = <Icon color=\"red\" />;\
         export const missing = <Badge color=\"red\" />;",
        &[],
    );
    assert!(unbacked(&res).is_empty(), "{:?}", res.diagnostics);
}

/// Props the package's own declaration owns mint no want, so a tag carrying
/// only those is unstyled and stays silent.
#[test]
fn owned_props_alone_stay_silent() {
    let app = PackageApp::new("unbacked-owned");
    let mut request = app.request(
        &[(
            "src/test.tsx",
            "import { CodeIcon } from 'acme-ui';\
             export const el = <CodeIcon size=\"lg\" />;",
        )],
        &[],
    );
    request
        .base_system
        .jsx_owned
        .insert("CodeIcon".into(), vec!["size".into()]);
    let res = compile(&request).expect("compile succeeds");
    assert!(unbacked(&res).is_empty(), "{:?}", res.diagnostics);
}

/// Probe 3: a same-file wrapper handing its `css` prop to a package tag
/// warns at the call site that sets `css`, naming that package; the inner
/// forward lowers nothing, and a call site without `css` stays silent.
#[test]
fn css_wrapper_around_a_package_tag_warns_at_its_call_site() {
    let res = compile_app(
        "unbacked-wrapper",
        "import { Button } from '@reference-ui/lib/primitives';\
         const Wrap = ({ css }: { css?: object; color?: string }) => <Button css={css} />;\
         export const styled = <Wrap css={{ color: 'blue' }} />;\
         export const own = <Wrap color=\"blue\" />;",
        &[],
    );
    let rows = unbacked(&res);
    assert_eq!(rows.len(), 1, "{:?}", res.diagnostics);
    assert!(rows[0]
        .message
        .starts_with("style props on <Wrap> will not paint: '@reference-ui/lib' "));
    let composed = compile_app(
        "unbacked-wrapper-composed",
        "import { Button } from '@reference-ui/lib/primitives';\
         const Wrap = ({ css }: { css?: object }) => <Button css={css} />;\
         export const el = <Wrap css={{ color: 'blue' }} />;",
        &["reference-ui"],
    );
    assert!(unbacked(&composed).is_empty(), "{:?}", composed.diagnostics);
}

/// A published system that cannot be read is treated as nothing backing the
/// tag, and the warning names the file.
#[test]
fn an_unreadable_published_system_warns_naming_the_file() {
    let app = PackageApp::new("unbacked-unreadable");
    app.write(
        "node_modules/acme-ui/.reference-ui/system/baseSystem.mjs",
        "export default {}\n",
    );
    let res = app.compile(
        &[(
            "src/test.tsx",
            "import { Badge } from 'acme-ui';\
             export const el = <Badge color=\"blue\" />;",
        )],
        &["acme"],
    );
    let rows = unbacked(&res);
    assert_eq!(rows.len(), 1, "{:?}", res.diagnostics);
    let path = app.path("node_modules/acme-ui/.reference-ui/system/baseSystem.mjs");
    assert!(rows[0].message.contains(&path), "{}", rows[0].message);
    assert!(res.style_plans.iter().all(|plan| plan.prop != "color"));
}
