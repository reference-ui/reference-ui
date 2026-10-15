//! Unit tests for the observation pass, driven end to end through `AtlasAnalyzer`.
//! Each test writes a throwaway project, observes names from `@reference-ui/react` and asserts on
//! the `observed` payload. The case folders pin the binding rules; these pin AST-derived props,
//! scoring across files, example capping, source identity and the absent-when-empty wire shape.

use crate::config::{AtlasConfig, ObserveSpec};
use crate::model::{ObservedElement, Usage};
use crate::output::AtlasAnalysisResult;
use crate::AtlasAnalyzer;

const REACT: &str = "@reference-ui/react";

fn spec(source: &str, names: &[&str]) -> ObserveSpec {
    ObserveSpec {
        source: source.to_string(),
        names: names.iter().map(|name| name.to_string()).collect(),
    }
}

fn analyze(test: &str, files: &[(&str, &str)], observe: Vec<ObserveSpec>) -> AtlasAnalysisResult {
    let root = std::env::temp_dir().join(format!("atlas_observe_{test}_{}", std::process::id()));
    let _ = std::fs::remove_dir_all(&root);
    for (path, content) in files {
        let file = root.join(path);
        std::fs::create_dir_all(file.parent().unwrap()).unwrap();
        std::fs::write(file, content).unwrap();
    }

    let config = AtlasConfig {
        root_dir: root.to_string_lossy().to_string(),
        observe,
        ..Default::default()
    };
    let result = AtlasAnalyzer::new(config)
        .analyze_detailed(&root.to_string_lossy())
        .unwrap();
    let _ = std::fs::remove_dir_all(&root);
    result
}

fn element<'a>(observed: &'a [ObservedElement], name: &str) -> &'a ObservedElement {
    observed.iter().find(|item| item.name == name).unwrap()
}

fn prop_counts(element: &ObservedElement) -> Vec<(String, u32)> {
    element
        .props
        .iter()
        .map(|prop| (prop.name.clone(), prop.count))
        .collect()
}

#[test]
fn props_come_from_the_syntax_tree_not_the_tag_text() {
    let source = r#"
import { Button } from '@reference-ui/react'
export const A = ({ go, id, rest }: any) => (
  <Button style={{ a: { b: 1, c: 2 } }} onClick={() => go()} disabled title="a > b" data-id={`k-${id}`} {...rest}>
    x
  </Button>
)
"#;
    let result = analyze(
        "props",
        &[("src/A.tsx", source)],
        vec![spec(REACT, &["Button"])],
    );
    let button = element(&result.observed, "Button");

    let names: Vec<_> = prop_counts(button)
        .into_iter()
        .map(|(name, _)| name)
        .collect();
    assert_eq!(
        names,
        ["children", "data-id", "disabled", "onClick", "style", "title"]
    );
    let title = button
        .props
        .iter()
        .find(|prop| prop.name == "title")
        .unwrap();
    assert_eq!(title.values.as_ref().unwrap().len(), 1);
    assert!(title.values.as_ref().unwrap().contains_key("a > b"));
}

#[test]
fn explicit_children_and_repeated_attributes_count_once() {
    let source = r#"
import { Div } from '@reference-ui/react'
export const A = () => <Div children="x" id="a" id="b">y</Div>
"#;
    let result = analyze(
        "once",
        &[("src/A.tsx", source)],
        vec![spec(REACT, &["Div"])],
    );

    assert_eq!(
        prop_counts(element(&result.observed, "Div")),
        [("children".to_string(), 1), ("id".to_string(), 1)]
    );
}

#[test]
fn scoring_spans_files_and_pairs_only_observed_names() {
    let one = "import { Div, Button, Section } from '@reference-ui/react'\nexport const One = () => <Div><Div /><Button /><Section /></Div>\n";
    let two = "import { Div, Button } from '@reference-ui/react'\nexport const Two = () => <Div><Button /></Div>\n";
    let three = "import { Div } from '@reference-ui/react'\nexport const Three = () => <Div />\n";
    let files = [
        ("src/One.tsx", one),
        ("src/Two.tsx", two),
        ("src/Three.tsx", three),
    ];
    let result = analyze("scoring", &files, vec![spec(REACT, &["Div", "Button"])]);

    let div = element(&result.observed, "Div");
    assert_eq!((div.count, div.file_presence), (4, 3));
    assert_eq!(div.usage, Usage::VeryCommon);
    assert_eq!(div.used_with.get("Button"), Some(&Usage::VeryCommon));
    assert!(!div.used_with.contains_key("Section"));
    let children = div
        .props
        .iter()
        .find(|prop| prop.name == "children")
        .unwrap();
    assert_eq!(
        (children.count, children.usage.clone()),
        (2, Usage::VeryCommon)
    );

    let button = element(&result.observed, "Button");
    assert_eq!((button.count, button.file_presence), (2, 2));
    assert_eq!(button.usage, Usage::Common);
    assert_eq!(button.used_with.get("Div"), Some(&Usage::VeryCommon));
    assert!(result.observed.iter().all(|item| item.name != "Section"));
}

#[test]
fn examples_are_distinct_and_capped_at_five() {
    let tags: Vec<String> = (1..=7)
        .map(|index| format!("<Div id=\"{index}\" />"))
        .collect();
    let body = format!("{}\n{}", tags.join("\n"), tags[0]);
    let source = format!(
        "import {{ Div }} from '@reference-ui/react'\nexport const A = () => <>\n{body}\n</>\n"
    );
    let result = analyze(
        "examples",
        &[("src/A.tsx", &source)],
        vec![spec(REACT, &["Div"])],
    );
    let div = element(&result.observed, "Div");

    assert_eq!(div.count, 8);
    assert_eq!(div.examples, tags[..5]);
}

#[test]
fn one_name_from_two_sources_stays_two_elements() {
    let files = [
        (
            "src/A.tsx",
            "import { Div } from '@reference-ui/react'\nexport const A = () => <Div />\n",
        ),
        (
            "src/B.tsx",
            "import { Div } from '@other/ui'\nexport const B = () => <Div />\n",
        ),
        (
            "src/C.tsx",
            "import { Div } from '@other/ui'\nexport const C = () => <Div />\n",
        ),
    ];
    let specs = vec![spec(REACT, &["Div"]), spec("@other/ui", &["Div"])];
    let result = analyze("sources", &files, specs);

    let counts: Vec<_> = result
        .observed
        .iter()
        .map(|item| (item.source.as_str(), item.count))
        .collect();
    assert_eq!(counts, [("@other/ui", 2), (REACT, 1)]);
}

#[test]
fn observed_is_absent_from_the_wire_when_nothing_is_configured() {
    let source = "import { Div } from '@reference-ui/react'\nexport const A = () => <Div />\n";
    let result = analyze("absent", &[("src/A.tsx", source)], Vec::new());

    assert!(result.observed.is_empty());
    let wire = serde_json::to_value(&result).unwrap();
    assert!(wire.get("observed").is_none());
}
