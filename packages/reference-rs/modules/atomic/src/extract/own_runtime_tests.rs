//! Unit pins for telling a linked package that borrows this compile's runtime
//! from one that is not Reference code at all.
//!
//! A package borrows the runtime when it uses `@reference-ui/react` (a root
//! entry imports it, or its manifest depends on it) and that specifier lands
//! here, or when the include set reaches into it. Where the specifier lands is
//! read before the runtime is generated: the own root is where the sync links
//! it, and a nearer link that points nowhere yet is read by its target. A
//! package that never uses the runtime is not own however it would resolve.

#![cfg(unix)]

use std::fs;
use std::os::unix::fs::symlink;

use module_graph::DiskFs;
use shared::testing::ScratchWorkspace;

use super::{borrows_own_runtime, imports_runtime, OwnCompile, OwnRoot};

const BORROWING_DIST: &str =
    "import { Div } from '@reference-ui/react'\nexport const Panel = (props) => Div(props)\n";

/// A scratch monorepo at a canonical root; nothing generated, nothing linked.
struct Tree {
    scratch: ScratchWorkspace,
    root: String,
}

impl Tree {
    fn new(name: &str) -> Self {
        let scratch = ScratchWorkspace::new(name);
        let root = fs::canonicalize(scratch.root()).expect("scratch root exists");
        Self {
            scratch,
            root: root.to_string_lossy().into_owned(),
        }
    }

    fn write(&self, relative: &str, content: &str) {
        self.scratch.write(relative, content);
    }

    /// A built package at `packages/<name>` whose root entry is `dist`.
    fn package(&self, name: &str, dist: &str) {
        let manifest = format!(r#"{{"name":"@acme/{name}","main":"./dist/index.mjs"}}"#);
        self.write(&format!("packages/{name}/package.json"), &manifest);
        self.write(&format!("packages/{name}/dist/index.mjs"), dist);
    }

    /// Link `link` to `target` (relative to the link's directory, as pnpm
    /// writes it), whether or not the target exists.
    fn link(&self, link: &str, target: &str) {
        let link = format!("{}/{link}", self.root);
        if let Some(parent) = std::path::Path::new(&link).parent() {
            fs::create_dir_all(parent).expect("link parent");
        }
        symlink(target, link).expect("symlink");
    }

    /// Generate the own runtime, as a sync does.
    fn generate(&self) {
        self.write(
            ".reference-ui/react/package.json",
            r#"{"main":"./react.mjs"}"#,
        );
        self.write(
            ".reference-ui/react/react.mjs",
            "export const Div = () => null\n",
        );
    }

    /// Whether `packages/<name>` borrows the runtime of a compile rooted at
    /// `root` (relative; empty for the tree root) whose include set does or
    /// does not reach into it.
    fn borrows(&self, root: &str, name: &str, included: bool) -> bool {
        let root = if root.is_empty() {
            self.root.clone()
        } else {
            format!("{}/{root}", self.root)
        };
        let own = OwnRoot::at(&DiskFs, &root).expect("own root exists");
        let includes = |_: &str| included;
        let compile = OwnCompile {
            root: &own,
            includes: &includes,
        };
        borrows_own_runtime(&DiskFs, &format!("{}/packages/{name}", self.root), &compile)
    }
}

#[test]
fn the_runtime_import_is_a_quoted_module_string() {
    assert!(imports_runtime(BORROWING_DIST));
    assert!(imports_runtime(
        "export * from \"@reference-ui/react/primitives\""
    ));
    assert!(imports_runtime(
        "import type { DivProps } from `@reference-ui/react`"
    ));
    assert!(!imports_runtime(
        "import { Icon } from '@reference-ui/react-icons'"
    ));
    assert!(!imports_runtime(
        "// renders through @reference-ui/react\nexport {}"
    ));
    assert!(!imports_runtime("import { Icon } from 'lucide-react'"));
}

/// The first sync: no runtime generated and no link made yet, or a link that
/// points at the runtime this sync is about to generate.
#[test]
fn a_package_importing_the_runtime_borrows_it_before_the_first_sync() {
    let tree = Tree::new("own-runtime-first-sync");
    tree.package("panel", BORROWING_DIST);
    assert!(tree.borrows("", "panel", false), "no link yet");
    tree.link(
        "node_modules/@reference-ui/react",
        "../../.reference-ui/react",
    );
    assert!(tree.borrows("", "panel", false), "dangling link");
    tree.generate();
    assert!(tree.borrows("", "panel", false), "generated runtime");
}

/// A package that never names the runtime is not Reference code, even
/// where this runtime resolves from it, unless the include set reaches it.
#[test]
fn a_package_that_never_uses_the_runtime_is_not_own() {
    let tree = Tree::new("own-runtime-plain");
    tree.package("icons", "export const StarIcon = ({ color }) => color\n");
    tree.generate();
    tree.link(
        "node_modules/@reference-ui/react",
        "../../.reference-ui/react",
    );
    assert!(!tree.borrows("", "icons", false));
    assert!(
        tree.borrows("", "icons", true),
        "the include set reaches into it"
    );
}

/// A declared dependency is evidence on its own, and a nearer link decides
/// by its target: a `link:` dependency on this runtime that is not generated
/// yet is own, a link to another project's runtime is not.
#[test]
fn a_declared_dependency_and_its_nearer_link_decide() {
    let tree = Tree::new("own-runtime-declared");
    tree.write(
        "packages/kit/package.json",
        r#"{"name":"@acme/kit","main":"./dist/index.mjs","dependencies":{"@reference-ui/react":"link:../../.reference-ui/react"}}"#,
    );
    tree.write(
        "packages/kit/dist/index.mjs",
        "export { Tile } from './chunk-a.mjs'\n",
    );
    tree.link(
        "packages/kit/node_modules/@reference-ui/react",
        "../../../../.reference-ui/react",
    );
    assert!(
        tree.borrows("", "kit", false),
        "dangling link to this runtime"
    );

    tree.package("other", BORROWING_DIST);
    tree.write("elsewhere/.reference-ui/react/package.json", "{}");
    tree.link(
        "packages/other/node_modules/@reference-ui/react",
        "../../../../elsewhere/.reference-ui/react",
    );
    assert!(
        !tree.borrows("", "other", false),
        "another project's runtime"
    );
}

/// A package outside the own root that meets no link on its way up lands
/// nowhere: the sync links its runtime under its own root only.
#[test]
fn a_package_outside_the_own_root_with_no_link_lands_nowhere() {
    let tree = Tree::new("own-runtime-outside");
    tree.write("apps/web/package.json", r#"{"name":"web"}"#);
    tree.package("panel", BORROWING_DIST);
    assert!(!tree.borrows("apps/web", "panel", false));
    tree.link(
        "node_modules/@reference-ui/react",
        "../../apps/web/.reference-ui/react",
    );
    assert!(
        tree.borrows("apps/web", "panel", false),
        "hoisted link to the app's runtime"
    );
}
