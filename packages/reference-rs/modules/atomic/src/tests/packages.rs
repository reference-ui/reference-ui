//! A scratch app with packages installed on disk, for compiles whose package tags must resolve.
//!
//! What backs a package tag is read from the package directory its import lands in, so tests of
//! the backing need real directories: `acme-ui` publishes system `acme`; `@reference-ui/lib`
//! publishes lib's shape, rendering through `reference-icons` and `reference-ui`, and maps
//! `/primitives` through `exports`; `@reference-ui/icons` publishes `reference-icons`; `lucide`
//! publishes nothing, so it is foreign. Sources are written under `src/` and compiled from the
//! root with the primitive roster on `jsxHosts`, as Core sends it.

use std::fs;

use shared::testing::ScratchWorkspace;

use crate::{compile, BaseSystem, CompileRequest, CompileResult};

/// Lib's published shape: its streams name icons first, then itself.
const LIB_SYSTEM: &str = "export const baseSystem = { \"name\": \"reference-ui\", \"streams\": \
    [{ \"name\": \"reference-icons\" }, { \"name\": \"reference-ui\" }] }\n";

/// Component names every package's entry exports.
const EXPORTS: &str = "export const Button = () => null\n\
    export const Badge = () => null\n\
    export const AcmeCard = () => null\n\
    export const Card = () => null\n\
    export const Overlay = { Content: () => null }\n\
    export const CheckIcon = () => null\n\
    export const ContentCopyIcon = () => null\n\
    export const BoltIcon = () => null\n\
    export const CodeIcon = () => null\n\
    export const Icon = () => null\n";

/// A scratch app root (canonical) with its installed packages.
pub(crate) struct PackageApp {
    scratch: ScratchWorkspace,
    root: String,
}

impl PackageApp {
    pub(crate) fn new(name: &str) -> Self {
        let scratch = ScratchWorkspace::new(name);
        let root = fs::canonicalize(scratch.root()).expect("scratch root exists");
        let app = Self {
            scratch,
            root: root.to_string_lossy().into_owned(),
        };
        app.install_acme();
        app.install_lib();
        app.install(
            "@reference-ui/icons",
            r#"{"name":"@reference-ui/icons","main":"./index.js"}"#,
        );
        app.write(
            "node_modules/@reference-ui/icons/.reference-ui/system/baseSystem.mjs",
            "export const baseSystem = { \"name\": \"reference-icons\" }\n",
        );
        app.install("lucide", r#"{"name":"lucide","main":"./index.js"}"#);
        app
    }

    /// `acme-ui`, publishing system `acme` at Core's conventional path.
    fn install_acme(&self) {
        self.install("acme-ui", r#"{"name":"acme-ui","main":"./index.js"}"#);
        self.write("node_modules/acme-ui/cards.js", EXPORTS);
        self.write(
            "node_modules/acme-ui/.reference-ui/system/baseSystem.mjs",
            "export const baseSystem = { \"name\": \"acme\" }\n",
        );
    }

    /// `@reference-ui/lib`, publishing lib's shape through `exports`.
    fn install_lib(&self) {
        self.install(
            "@reference-ui/lib",
            r#"{"name":"@reference-ui/lib","exports":{".":"./index.js","./primitives":"./primitives.js","./baseSystem":"./system/baseSystem.mjs"}}"#,
        );
        self.write("node_modules/@reference-ui/lib/primitives.js", EXPORTS);
        self.write(
            "node_modules/@reference-ui/lib/system/baseSystem.mjs",
            LIB_SYSTEM,
        );
    }

    /// One package directory: its manifest and an entry exporting every name.
    fn install(&self, package: &str, manifest: &str) {
        self.write(&format!("node_modules/{package}/package.json"), manifest);
        self.write(&format!("node_modules/{package}/index.js"), EXPORTS);
    }

    pub(crate) fn write(&self, relative: &str, content: &str) {
        self.scratch.write(relative, content);
    }

    /// The absolute path of `relative` under the app root.
    pub(crate) fn path(&self, relative: &str) -> String {
        format!("{}/{relative}", self.root)
    }

    /// Write `files` under the root and build the request Core would send:
    /// the `src/` include, the primitive roster, the compiler and proof channels,
    /// and `upstream` composed.
    pub(crate) fn request(&self, files: &[(&str, &str)], upstream: &[&str]) -> CompileRequest {
        for (path, content) in files {
            self.write(path, content);
        }
        CompileRequest {
            root_dir: Some(self.root.clone()),
            include: Some(vec!["src/**".into()]),
            base_system: BaseSystem::lib_fixture().clone(),
            jsx_hosts: Some(vec!["Div".into(), "Button".into()]),
            upstream_systems: upstream.iter().map(ToString::to_string).collect(),
            logs: Some(vec!["compiler".to_string(), "proof".to_string()]),
            ..CompileRequest::default()
        }
    }

    /// Compile `files` with `upstream` composed.
    pub(crate) fn compile(&self, files: &[(&str, &str)], upstream: &[&str]) -> CompileResult {
        compile(&self.request(files, upstream)).expect("compile succeeds")
    }
}
