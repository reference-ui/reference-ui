//! Tests for which modules the analyzer counts as the app's own code.
//! Each test builds a throwaway project whose `@acme/ui` library renders the observed `Div` and the
//! tracked `Card` internally, then checks that only the app's call sites are counted. The library
//! sits under `node_modules` (as a directory and as a symlink), beside the app, or under
//! `node_modules` with an include glob naming it, since each route keeps its sources under or next
//! to the app root.

use crate::config::{AtlasConfig, ObserveSpec};
use crate::output::AtlasAnalysisResult;
use crate::AtlasAnalyzer;
use std::path::PathBuf;

const APP: &str = "import { Div } from '@reference-ui/react'\nimport { Panel } from '@acme/ui'\nexport function App() {\n  return <Panel tone=\"quiet\"><Div /></Panel>\n}\n";

const LIBRARY: [(&str, &str); 3] = [
    ("src/index.ts", "export { Card } from './Card'\nexport { Panel } from './Panel'\n"),
    (
        "src/Card.tsx",
        "export type CardProps = { title?: string }\nexport function Card({ title }: CardProps) {\n  return <section title={title} />\n}\n",
    ),
    (
        "src/Panel.tsx",
        "import { Div } from '@reference-ui/react'\nimport { Card } from './Card'\nexport type PanelProps = { tone?: string }\nexport function Panel({ tone }: PanelProps) {\n  return <Card title={tone}><Div /><Div /></Card>\n}\n",
    ),
];

/// A temp directory holding `app/` and whatever library layout a test writes beside or under it.
struct Project {
    root: PathBuf,
}

impl Project {
    fn new(test: &str) -> Self {
        let root =
            std::env::temp_dir().join(format!("atlas_app_modules_{test}_{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&root);
        let project = Self { root };
        project.write("app/src/App.tsx", APP);
        project
    }

    fn write(&self, path: &str, content: &str) {
        let file = self.root.join(path);
        std::fs::create_dir_all(file.parent().unwrap()).unwrap();
        std::fs::write(file, content).unwrap();
    }

    fn write_library(&self, dir: &str) {
        for (path, content) in LIBRARY {
            self.write(&format!("{dir}/{path}"), content);
        }
    }

    fn analyze(&self, include: &[&str]) -> AtlasAnalysisResult {
        let app = self.root.join("app");
        let config = AtlasConfig {
            root_dir: app.to_string_lossy().to_string(),
            include: (!include.is_empty()).then(|| include.iter().map(|p| p.to_string()).collect()),
            observe: vec![ObserveSpec {
                source: "@reference-ui/react".to_string(),
                names: vec!["Div".to_string()],
            }],
            ..Default::default()
        };
        AtlasAnalyzer::new(config)
            .analyze_detailed(&app.to_string_lossy())
            .unwrap()
    }
}

impl Drop for Project {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.root);
    }
}

fn component_count(result: &AtlasAnalysisResult, name: &str) -> u32 {
    let found = result
        .components
        .iter()
        .find(|component| component.name == name && component.source == "@acme/ui");
    found
        .unwrap_or_else(|| panic!("{name} is not tracked"))
        .count
}

/// The observed `Div`'s call-site count and the number of files holding it.
fn observed_div(result: &AtlasAnalysisResult) -> (u32, u32) {
    let div = result.observed.iter().find(|item| item.name == "Div");
    let div = div.expect("the app's own Div is observed");
    (div.count, div.file_presence)
}

fn assert_only_app_calls_count(result: &AtlasAnalysisResult) {
    assert_eq!(observed_div(result), (1, 1), "library Divs counted");
    assert_eq!(component_count(result, "Panel"), 1);
    assert_eq!(component_count(result, "Card"), 0, "library <Card> counted");
}

#[test]
fn a_package_under_node_modules_is_not_app_code() {
    let project = Project::new("node_modules");
    project.write_library("app/node_modules/@acme/ui");

    assert_only_app_calls_count(&project.analyze(&["@acme/ui"]));
}

#[cfg(unix)]
#[test]
fn a_symlinked_package_under_node_modules_is_not_app_code() {
    let project = Project::new("symlink");
    project.write_library("ui-source");
    std::fs::create_dir_all(project.root.join("app/node_modules/@acme")).unwrap();
    std::os::unix::fs::symlink(
        project.root.join("ui-source"),
        project.root.join("app/node_modules/@acme/ui"),
    )
    .unwrap();

    assert_only_app_calls_count(&project.analyze(&["@acme/ui"]));
}

#[test]
fn a_package_beside_the_app_is_not_app_code() {
    let project = Project::new("sibling");
    project.write_library("ui");

    assert_only_app_calls_count(&project.analyze(&["@acme/ui"]));
}

#[test]
fn dependency_files_an_include_glob_names_are_read_but_not_app_code() {
    let project = Project::new("glob");
    project.write_library("app/node_modules/@acme/ui");

    let result = project.analyze(&["node_modules/@acme/ui/src/**/*.tsx"]);
    assert_eq!(observed_div(&result), (1, 1), "library Divs counted");
}
