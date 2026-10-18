//! Upstream-published names are never own hosts by name.
//! A request's `upstreamHosts` names the components each extended upstream
//! publishes; those names leave the configured roster even when the caller
//! also lists them in `jsxHosts`, so an unbound tag that spells one takes the
//! external path and backs the upstream class. A wrapper this compile traces
//! under the same name stays own, and an empty map keeps the wire and the
//! roster unchanged. The analysis mirror reads the same roster, so it stays
//! silent where extraction goes external.

use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;

use super::own_roster;
use crate::{
    compile, BaseSystem, CompileRequest, CompileResult, DiagnosticSeverity, VirtualSource,
};

fn names(list: &[&str]) -> Vec<String> {
    list.iter().map(|name| (*name).to_string()).collect()
}

/// `AcmeCard` published by the `upstream` system, which is also composed.
fn publish_acme_card(request: &mut CompileRequest) {
    request.upstream_systems = names(&["upstream"]);
    request.upstream_hosts = BTreeMap::from([("upstream".to_string(), names(&["AcmeCard"]))]);
}

/// An unbound `<AcmeCard>` with `AcmeCard` on the caller's roster.
fn unbound_request() -> CompileRequest {
    CompileRequest {
        files: Some(vec![VirtualSource {
            path: "src/app.tsx".to_string(),
            content: "import { Div } from '@reference-ui/react'\n\
                export const el = <AcmeCard mt=\"4r\" />\n\
                void Div\n"
                .to_string(),
        }]),
        base_system: BaseSystem::lib_fixture().clone(),
        jsx_hosts: Some(names(&["AcmeCard"])),
        upstream_systems: names(&["upstream"]),
        logs: Some(vec!["compiler".to_string(), "proof".to_string()]),
        ..CompileRequest::default()
    }
}

/// True when neither channel warns: the analysis mirror, which reads the
/// same roster, predicted exactly the lookups extraction emitted.
fn silent(result: &CompileResult) -> bool {
    result
        .diagnostics
        .iter()
        .chain(result.compiler_diagnostics.iter().flatten())
        .all(|diagnostic| diagnostic.severity == DiagnosticSeverity::Info)
}

/// The style plan classes the `mt` prop compiled to.
fn mt_classes(result: &CompileResult) -> Vec<String> {
    result
        .style_plans
        .iter()
        .filter(|plan| plan.prop == "mt")
        .flat_map(|plan| plan.declarations.iter().map(|decl| decl.class_name.clone()))
        .collect()
}

#[test]
fn published_names_leave_the_configured_roster() {
    let mut request = unbound_request();
    request.jsx_hosts = Some(names(&["AcmeCard", "Div", "LocalPanel"]));
    assert_eq!(
        own_roster(&request),
        names(&["AcmeCard", "Div", "LocalPanel"])
    );

    // A primitive name an upstream also publishes leaves too: the own
    // import still admits the primitive, the bare name no longer does.
    request.upstream_hosts = BTreeMap::from([
        ("upstream".to_string(), names(&["AcmeCard"])),
        ("other".to_string(), names(&["Div"])),
    ]);
    assert_eq!(own_roster(&request), names(&["LocalPanel"]));
}

#[test]
fn unbound_tag_spelling_a_published_name_is_external() {
    let roster_only = compile(&unbound_request()).expect("compile succeeds");
    assert_eq!(
        mt_classes(&roster_only),
        names(&["@reference-ui/lib__mt_4r"])
    );

    let mut request = unbound_request();
    publish_acme_card(&mut request);
    let published = compile(&request).expect("compile succeeds");
    assert_eq!(mt_classes(&published), names(&["upstream__mt_4r"]));
    assert!(
        published.wants.iter().all(|want| want.external),
        "{:?}",
        published.wants
    );
    assert!(silent(&roster_only) && silent(&published), "{published:?}");
}

#[test]
fn empty_upstream_hosts_stay_off_the_wire() {
    let wire = serde_json::to_value(unbound_request()).expect("request serializes");
    assert!(wire.get("upstreamHosts").is_none(), "{wire}");

    let mut request = unbound_request();
    publish_acme_card(&mut request);
    let wire = serde_json::to_value(&request).expect("request serializes");
    assert_eq!(
        wire["upstreamHosts"],
        serde_json::json!({ "upstream": ["AcmeCard"] })
    );
    let back: CompileRequest = serde_json::from_value(wire).expect("request deserializes");
    assert_eq!(back.upstream_hosts, request.upstream_hosts);
}

/// Scratch project on disk, so the trace reads real files; removed on drop.
struct Tree {
    root: PathBuf,
}

impl Tree {
    fn new(name: &str) -> Self {
        let root = std::env::temp_dir().join(format!("atm-upstream-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("src")).expect("scratch src dir");
        let root = fs::canonicalize(&root).expect("canonical scratch root");
        Self { root }
    }

    fn write(&self, relative: &str, content: &str) {
        fs::write(self.root.join(relative), content).expect("write fixture file");
    }
}

impl Drop for Tree {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.root);
    }
}

/// The app's own `AcmeCard` forwards its style props to `Div`, so the trace
/// proves it own even though an upstream publishes the same name.
#[test]
fn traced_wrapper_spelling_a_published_name_stays_own() {
    let tree = Tree::new("traced");
    tree.write(
        "src/AcmeCard.tsx",
        "import { Div } from '@reference-ui/react'\n\
         export function AcmeCard(props: { mt?: string }) {\n  return <Div {...props} />\n}\n",
    );
    tree.write(
        "src/App.tsx",
        "import { AcmeCard } from './AcmeCard'\n\
         export const App = () => <AcmeCard mt=\"4r\" />\n",
    );
    let mut request = CompileRequest {
        root_dir: Some(tree.root.to_string_lossy().into_owned()),
        base_system: BaseSystem::lib_fixture().clone(),
        logs: Some(vec!["proof".to_string()]),
        ..CompileRequest::default()
    };
    publish_acme_card(&mut request);
    let result = compile(&request).expect("compile succeeds");
    assert!(result.traced_jsx_hosts.contains(&"AcmeCard".to_string()));
    assert_eq!(mt_classes(&result), names(&["@reference-ui/lib__mt_4r"]));
}
