#[cfg(test)]
mod tests {
    use crate::atlas::config::AtlasConfig;
    use crate::atlas::model::{Component, ComponentInterface, ComponentProp, Usage};
    use crate::atlas::AtlasAnalyzer;
    use std::collections::BTreeMap;
    use std::path::{Path, PathBuf};

    const DEMO_SURFACE_CASE: &str = "demo_surface";

    fn atlas_tests_dir() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("tests").join("atlas")
    }

    fn case_app_root(case_name: &str) -> String {
        atlas_tests_dir()
            .join("cases")
            .join(case_name)
            .join("input")
            .join("app")
            .to_string_lossy()
            .to_string()
    }

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
    fn test_demo_surface_case_exists() {
        let root = case_app_root(DEMO_SURFACE_CASE);
        assert!(
            Path::new(&root).exists(),
            "expected atlas case root to exist: {}",
            root
        );
    }

    #[test]
    fn test_local_components_from_demo_surface_case() {
        let root_dir = case_app_root(DEMO_SURFACE_CASE);
        let config = AtlasConfig {
            root_dir,
            include: None,
            exclude: None,
        };

        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze("");

        assert!(components.iter().any(|c| c.name == "Button" && !c.source.starts_with('@')));
        assert!(components.iter().any(|c| c.name == "AppCard" && !c.source.starts_with('@')));
        assert!(components.iter().any(|c| c.name == "UserBadge" && !c.source.starts_with('@')));
    }

    #[test]
    fn test_library_components() {
        let root_dir = case_app_root(DEMO_SURFACE_CASE);
        let config = AtlasConfig {
            root_dir,
            include: Some(vec!["@fixtures/demo-ui".to_string()]),
            exclude: None,
        };
        
        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze("/test");
        
        assert!(!components.is_empty());
        
        let button = components.iter().find(|c| c.name == "Button");
        assert!(button.is_some());
        
        let button = button.unwrap();
        assert_eq!(button.interface.name, "ButtonProps");
        assert_eq!(button.interface.source, "@fixtures/demo-ui");
        assert!(!button.props.is_empty());
        
        let variant_prop = button.props.iter().find(|p| p.name == "variant");
        assert!(variant_prop.is_some());
        assert_eq!(variant_prop.unwrap().name, "variant");
    }

    #[test]
    fn test_scoped_selector_include() {
        let root_dir = case_app_root(DEMO_SURFACE_CASE);
        let config = AtlasConfig {
            root_dir,
            include: Some(vec!["@fixtures/demo-ui:Button".to_string()]),
            exclude: None,
        };
        
        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze("/test");

        assert!(components.iter().any(|component| component.name == "Button" && component.source == "@fixtures/demo-ui"));
        assert!(components.iter().any(|component| component.name == "AppCard" && component.source.starts_with("./")));
    }

    #[test]
    fn test_exclude_patterns() {
        let root_dir = case_app_root(DEMO_SURFACE_CASE);
        let config = AtlasConfig {
            root_dir,
            include: Some(vec!["@fixtures/demo-ui".to_string()]),
            exclude: Some(vec!["@fixtures/demo-ui:Badge".to_string()]),
        };
        
        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze("/test");
        
        assert!(!components.is_empty());
        assert!(components.iter().any(|c| c.name == "Button"));
        assert!(components.iter().any(|c| c.name == "Card"));
        assert!(!components.iter().any(|c| c.name == "Badge"));
    }

    #[test]
    fn test_component_interface_shape() {
        let interface = ComponentInterface {
            name: "TestProps".to_string(),
            source: "@test/package".to_string(),
        };
        
        assert!(!interface.name.is_empty());
        assert!(!interface.source.is_empty());
    }

    #[test]
    fn test_component_prop_shape() {
        let prop = ComponentProp {
            name: "variant".to_string(),
            count: 5,
            usage: Usage::Common,
            values: None,
        };
        
        assert_eq!(prop.name, "variant");
        assert_eq!(prop.count, 5);
        assert_eq!(prop.usage, Usage::Common);
        assert!(prop.values.is_none());
    }

    #[test]
    fn test_component_prop_with_values() {
        let mut values = BTreeMap::new();
        values.insert("primary".to_string(), Usage::VeryCommon);
        values.insert("secondary".to_string(), Usage::Rare);
        
        let prop = ComponentProp {
            name: "variant".to_string(),
            count: 5,
            usage: Usage::Common,
            values: Some(values),
        };
        
        assert!(prop.values.is_some());
        let values_map = prop.values.as_ref().unwrap();
        assert_eq!(values_map.len(), 2);
        assert_eq!(values_map.get("primary"), Some(&Usage::VeryCommon));
        assert_eq!(values_map.get("secondary"), Some(&Usage::Rare));
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
            interface,
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
        assert_eq!(component.interface.name, "ButtonProps");
    }
}
