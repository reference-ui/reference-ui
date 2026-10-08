//! Rust source file for Reference UI module.
//! Responsible for domain logic, AST parsing, or utility functions.
//! See module README for architecture details.

#[cfg(test)]
mod tests {
    use crate::config::AtlasConfig;
    use crate::model::{Component, ComponentInterface, ComponentProp, Usage, UsageThresholds};
    use crate::usage_policy::{score_usage, usage_thresholds};
    use crate::AtlasAnalyzer;
    use std::collections::BTreeMap;

    #[test]
    fn test_usage_from_count() {
        assert_eq!(Usage::from_count(0, 100), Usage::Unused);
        assert_eq!(Usage::from_count(1, 100), Usage::Rare);
        assert_eq!(Usage::from_count(5, 100), Usage::Rare);
        assert_eq!(Usage::from_count(10, 100), Usage::Occasional);
        assert_eq!(Usage::from_count(20, 100), Usage::Common);
        assert_eq!(Usage::from_count(50, 100), Usage::VeryCommon);
        assert_eq!(Usage::from_count(75, 100), Usage::VeryCommon);
    }

    #[test]
    fn test_usage_from_count_zero_total() {
        assert_eq!(Usage::from_count(0, 0), Usage::Unused);
        assert_eq!(Usage::from_count(10, 0), Usage::Unused);
    }

    #[test]
    fn test_usage_policy_is_documented_and_tweakable() {
        let thresholds = usage_thresholds();
        assert_eq!(thresholds.very_common_min_ratio, 0.5);
        assert_eq!(thresholds.common_min_ratio, 0.2);
        assert_eq!(thresholds.occasional_min_ratio, 0.1);

        let custom = UsageThresholds {
            very_common_min_ratio: 0.75,
            common_min_ratio: 0.4,
            occasional_min_ratio: 0.2,
        };

        assert_eq!(
            Usage::from_count_with_thresholds(3, 4, &custom),
            Usage::VeryCommon
        );
        assert_eq!(score_usage(1, 10), Usage::Occasional);
    }

    #[test]
    fn test_analyzer_new() {
        let config = AtlasConfig {
            root_dir: "/test".to_string(),
            include: Some(vec!["src/**".to_string()]),
            exclude: Some(vec!["node_modules/**".to_string()]),
        };

        let analyzer = AtlasAnalyzer::new(config);
        assert_eq!(analyzer.config.root_dir, "/test");
    }

    #[test]
    fn test_analyzer_analyze_empty() {
        let config = AtlasConfig {
            root_dir: "/nonexistent".to_string(),
            include: None,
            exclude: None,
        };

        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze("/nonexistent");

        assert_eq!(components.len(), 0);
    }

    #[test]
    fn test_usage_equality() {
        assert_eq!(Usage::VeryCommon, Usage::VeryCommon);
        assert_ne!(Usage::VeryCommon, Usage::Common);
        assert_ne!(Usage::Common, Usage::Rare);
    }

    #[test]
    fn test_complete_component_shape() {
        let interface = ComponentInterface {
            name: "ButtonProps".to_string(),
            source: "@fixtures/demo-ui".to_string(),
        };

        let mut used_with = BTreeMap::new();
        used_with.insert("Card".to_string(), Usage::Common);

        let component = Component {
            name: "Button".to_string(),
            interface: Some(interface),
            source: "@fixtures/demo-ui".to_string(),
            count: 10,
            props: vec![
                ComponentProp {
                    name: "variant".to_string(),
                    count: 8,
                    usage: Usage::VeryCommon,
                    values: None,
                },
                ComponentProp {
                    name: "size".to_string(),
                    count: 6,
                    usage: Usage::Common,
                    values: None,
                },
            ],
            usage: Usage::Common,
            examples: vec![
                "<Button variant=\"primary\" />".to_string(),
                "<Button size=\"large\" />".to_string(),
            ],
            used_with,
        };

        assert_eq!(component.name, "Button");
        assert_eq!(component.count, 10);
        assert_eq!(component.props.len(), 2);
        assert_eq!(component.examples.len(), 2);
        assert_eq!(component.used_with.len(), 1);
        assert_eq!(
            component
                .interface
                .as_ref()
                .map(|interface| interface.name.as_str()),
            Some("ButtonProps")
        );
    }

    #[test]
    fn test_star_reexports_resolution() {
        let temp_dir = std::env::temp_dir();
        let root = temp_dir.join(format!("atlas_test_star_{}", std::process::id()));
        if root.exists() {
            let _ = std::fs::remove_dir_all(&root);
        }
        std::fs::create_dir_all(root.join("src/components")).unwrap();

        std::fs::write(
            root.join("src/components/Accordion.tsx"),
            "export interface AccordionProps {\n  expansion?: 'single' | 'multiple';\n}\nexport function Accordion(props: AccordionProps) {\n  return <div />;\n}\n",
        ).unwrap();

        std::fs::write(
            root.join("src/components/index.ts"),
            "export * from './Accordion';\n",
        )
        .unwrap();

        std::fs::write(
            root.join("src/App.tsx"),
            "import { Accordion } from './components';\nexport function App() {\n  return <Accordion expansion=\"single\" />;\n}\n",
        ).unwrap();

        let config = AtlasConfig {
            root_dir: root.to_string_lossy().to_string(),
            include: None,
            exclude: None,
        };

        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze(&root.to_string_lossy());

        assert_eq!(components.len(), 1);
        let accordion = &components[0];
        assert_eq!(accordion.name, "Accordion");
        assert_eq!(accordion.count, 1);
        assert_eq!(accordion.props.len(), 1);
        assert_eq!(accordion.props[0].name, "expansion");
        assert_eq!(accordion.props[0].count, 1);

        let _ = std::fs::remove_dir_all(&root);
    }
}
