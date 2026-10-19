//! Disk probes for bare specifiers that land in package directories.
//!
//! Each test lays out a small pnpm-shaped tree (workspace packages linked
//! into `node_modules`) and asks the origin walk where one import ends: a
//! workspace package whose source this compile includes continues the walk
//! (`Local`, gap 1), unless that package published a system of its own; an
//! installed package without one is foreign; one whose entry is not built
//! yet still keeps the system it published; a linked package borrowing
//! this compile's own runtime is `Local`. The compile probe replays the
//! plan's gap-1 tree end to end: the traced wrapper backs under own.

#![cfg(unix)]

use std::fs;
use std::os::unix::fs::symlink;

use shared::testing::ScratchWorkspace;

use crate::diagnostics::DiagnosticCode;
use crate::extract::identity::{IdentityGraph, Origin};
use crate::extract::{PackageTag, PackageVerdict};
use crate::{compile, BaseSystem, CompileRequest};

/// A scratch monorepo at a canonical root, with the gap-1 workspace package.
struct Repo {
    scratch: ScratchWorkspace,
    root: String,
}

impl Repo {
    fn new(name: &str) -> Self {
        let scratch = ScratchWorkspace::new(name);
        let root = fs::canonicalize(scratch.root()).expect("scratch root exists");
        let repo = Self {
            scratch,
            root: root.to_string_lossy().into_owned(),
        };
        repo.write(
            "packages/ui/package.json",
            r#"{"name":"@acme/ui","main":"./src/index.ts"}"#,
        );
        repo.write("packages/ui/src/index.ts", "export { Card } from './Card'\n");
        repo.write(
            "packages/ui/src/Card.tsx",
            "import { Div } from '@reference-ui/react'\n\
             export function Card(props: { bg?: string }) {\n  return <Div {...props} />\n}\n",
        );
        repo.write(
            "apps/web/src/App.tsx",
            "import { Card } from '@acme/ui'\nexport const App = () => <Card bg=\"red\" />\n",
        );
        repo.link("node_modules/@acme/ui", "packages/ui");
        repo
    }

    fn write(&self, relative: &str, content: &str) {
        self.scratch.write(relative, content);
    }

    fn path(&self, relative: &str) -> String {
        format!("{}/{relative}", self.root)
    }

    /// Link `link` to `target`, both relative to the root, as pnpm does.
    fn link(&self, link: &str, target: &str) {
        let link = self.path(link);
        if let Some(parent) = std::path::Path::new(&link).parent() {
            fs::create_dir_all(parent).expect("link parent");
        }
        symlink(self.path(target), link).expect("symlink");
    }

    /// Give `packages/ui` a system of its own: two syncs over one tree.
    fn publish_ui(&self) {
        self.write(
            "packages/ui/.reference-ui/system/baseSystem.mjs",
            "export const baseSystem = { \"name\": \"acme\" }\n",
        );
    }

    /// The include set as compile sources, read from disk.
    fn sources(&self) -> &'static [(String, String)] {
        let files = ["apps/web/src/App.tsx", "packages/ui/src/index.ts", "packages/ui/src/Card.tsx"];
        let owned: Vec<(String, String)> = files
            .iter()
            .map(|file| {
                let path = self.path(file);
                let content = fs::read_to_string(&path).expect("source on disk");
                (path, content)
            })
            .collect();
        Box::leak(Box::new(owned))
    }

    /// Where `imported` from `specifier` ends, as `App.tsx` imports it.
    fn origin(&self, specifier: &str, imported: &str, root: Option<&str>) -> Origin {
        let graph = IdentityGraph::new(self.sources()).with_root(root);
        graph.trace_origin(&self.path("apps/web/src/App.tsx"), specifier, imported)
    }
}

fn published_name(origin: &Origin) -> Option<String> {
    let Origin::Package(PackageTag {
        verdict: PackageVerdict::Published(system),
        ..
    }) = origin
    else {
        return None;
    };
    system.names().ok().map(|names| names.name.clone())
}

#[test]
fn a_workspace_source_package_continues_the_walk() {
    let repo = Repo::new("origin-workspace");
    assert_eq!(repo.origin("@acme/ui", "Card", None), Origin::Local);
}

#[test]
fn a_workspace_package_with_its_own_system_ends_the_walk() {
    let repo = Repo::new("origin-published");
    repo.publish_ui();
    let origin = repo.origin("@acme/ui", "Card", None);
    assert_eq!(published_name(&origin).as_deref(), Some("acme"), "{origin:?}");
    let Origin::Package(tag) = origin else {
        unreachable!("published is a package");
    };
    assert_eq!(&*tag.specifier, "@acme/ui");
    assert_eq!(tag.dir.as_deref(), Some(repo.path("packages/ui").as_str()));
}

#[test]
fn installed_and_unresolved_packages_are_foreign() {
    let repo = Repo::new("origin-foreign");
    repo.write("node_modules/lucide/package.json", r#"{"main":"./index.js"}"#);
    repo.write("node_modules/lucide/index.js", "export const Icon = () => null\n");
    assert_eq!(
        repo.origin("lucide", "Icon", None),
        Origin::Package(PackageTag {
            specifier: "lucide".into(),
            dir: Some(repo.path("node_modules/lucide").into()),
            verdict: PackageVerdict::Foreign,
        })
    );
    assert_eq!(
        repo.origin("acme-ui", "Badge", None),
        Origin::Package(PackageTag::unresolved("acme-ui"))
    );
}

/// A workspace package whose `exports` point at a `dist` not built yet
/// resolves to no file, but its directory is installed and published a
/// system: the verdict still reads it, so its tags keep their system.
#[test]
fn an_installed_package_with_no_built_entry_keeps_its_system() {
    let repo = Repo::new("origin-unbuilt");
    repo.write(
        "packages/kit/package.json",
        r#"{"name":"@acme/kit","exports":{".":"./dist/index.mjs"}}"#,
    );
    repo.write(
        "packages/kit/.reference-ui/system/baseSystem.mjs",
        "export const baseSystem = { \"name\": \"kit\" }\n",
    );
    repo.link("node_modules/@acme/kit", "packages/kit");
    let origin = repo.origin("@acme/kit/sub", "Tile", None);
    assert_eq!(published_name(&origin).as_deref(), Some("kit"), "{origin:?}");
    let Origin::Package(tag) = origin else {
        unreachable!("published is a package");
    };
    assert_eq!(tag.dir.as_deref(), Some(repo.path("packages/kit").as_str()));
}

#[test]
fn a_linked_package_borrowing_the_own_runtime_is_local() {
    let repo = Repo::new("origin-borrowed");
    repo.write("packages/kit/package.json", r#"{"name":"@acme/kit","main":"./dist/index.mjs"}"#);
    repo.write("packages/kit/dist/index.mjs", "export const Tile = () => null\n");
    repo.write(".reference-ui/react/package.json", r#"{"main":"./react.mjs"}"#);
    repo.write(".reference-ui/react/react.mjs", "export {}\n");
    repo.link("node_modules/@acme/kit", "packages/kit");
    repo.link("node_modules/@reference-ui/react", ".reference-ui/react");
    let root = repo.root.clone();
    assert_eq!(repo.origin("@acme/kit", "Tile", Some(&root)), Origin::Local);
    let unrooted = repo.origin("@acme/kit", "Tile", None);
    assert!(matches!(
        unrooted,
        Origin::Package(PackageTag {
            verdict: PackageVerdict::Foreign,
            ..
        })
    ));
}

/// The plan's gap-1 compile: one sync at the root spans the app and the
/// workspace package, so the traced `Card` backs under own, silently. With
/// the package's own system present it is that package's tag instead.
#[test]
fn gap_one_workspace_wrapper_backs_under_own() {
    let repo = Repo::new("gap-one");
    let request = CompileRequest {
        root_dir: Some(repo.root.clone()),
        include: Some(vec!["apps/**".into(), "packages/**".into()]),
        base_system: BaseSystem::lib_fixture().clone(),
        logs: Some(vec!["proof".to_string()]),
        ..CompileRequest::default()
    };
    let result = compile(&request).expect("compile succeeds");
    assert!(result.traced_jsx_hosts.contains(&"Card".to_string()));
    let bg: Vec<_> = result
        .wants
        .iter()
        .filter(|want| &*want.prop == "bg")
        .collect();
    assert!(
        !bg.is_empty() && bg.iter().all(|want| want.backing.is_own()),
        "{bg:?}"
    );
    let classes: Vec<_> = result
        .style_plans
        .iter()
        .filter(|plan| plan.prop == "bg")
        .flat_map(|plan| plan.declarations.iter().map(|decl| decl.class_name.as_str()))
        .collect();
    assert_eq!(classes, vec!["@reference-ui/lib__bg_red"]);
    assert!(
        result.diagnostics.iter().all(|line| line.code != DiagnosticCode::ExternalUnbacked),
        "{:?}",
        result.diagnostics
    );

    repo.publish_ui();
    let twin = compile(&request).expect("compile succeeds");
    let bg: Vec<_> = twin
        .wants
        .iter()
        .filter(|want| &*want.prop == "bg")
        .collect();
    assert!(
        !bg.is_empty() && bg.iter().all(|want| !want.backing.is_own()),
        "{bg:?}"
    );
}
