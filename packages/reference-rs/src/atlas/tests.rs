#[cfg(test)]
mod tests {
    use crate::atlas::config::AtlasConfig;
    use crate::atlas::model::{Component, ComponentInterface, ComponentProp, Usage};
    use crate::atlas::AtlasAnalyzer;
    use std::collections::HashMap;

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
            include: vec!["src/**".to_string()],
            exclude: vec!["node_modules/**".to_string()],
        };
        
        let analyzer = AtlasAnalyzer::new(config);
        assert_eq!(analyzer.components.len(), 0);
    }

    #[test]
    fn test_add_component_usage() {
        let config = AtlasConfig {
            root_dir: "/test".to_string(),
            include: vec![],
            exclude: vec![],
        };
        
        let mut analyzer = AtlasAnalyzer::new(config);
        let interface = ComponentInterface {
            name: "ButtonProps".to_string(),
            source: "@fixtures/demo-ui".to_string(),
        };
        
        analyzer.add_component_usage("Button", "@fixtures/demo-ui", interface.clone());
        analyzer.add_component_usage("Button", "@fixtures/demo-ui", interface);
        
        let components = analyzer.analyze("/test");
        assert_eq!(components.len(), 1);
        
        let button = &components[0];
        assert_eq!(button.name, "Button");
        assert_eq!(button.count, 2);
        assert_eq!(button.interface.name, "ButtonProps");
        assert_eq!(button.interface.source, "@fixtures/demo-ui");
    }

    #[test]
    fn test_add_prop_usage() {
        let config = AtlasConfig {
            root_dir: "/test".to_string(),
            include: vec![],
            exclude: vec![],
        };
        
        let mut analyzer = AtlasAnalyzer::new(config);
        let interface = ComponentInterface {
            name: "ButtonProps".to_string(),
            source: "@fixtures/demo-ui".to_string(),
        };
        
        analyzer.add_component_usage("Button", "@fixtures/demo-ui", interface);
        analyzer.add_prop_usage("Button", "variant");
        analyzer.add_prop_usage("Button", "size");
        analyzer.add_prop_usage("Button", "variant");
        
        let components = analyzer.analyze("/test");
        let button = &components[0];
        assert_eq!(button.props.len(), 2);
        
        let variant_prop = button.props.iter().find(|p| p.name == "variant").unwrap();
        assert_eq!(variant_prop.count, 2);
        
        let size_prop = button.props.iter().find(|p| p.name == "size").unwrap();
        assert_eq!(size_prop.count, 1);
    }

    #[test]
    fn test_calculate_usage_stats() {
        let config = AtlasConfig {
            root_dir: "/test".to_string(),
            include: vec![],
            exclude: vec![],
        };
        
        let mut analyzer = AtlasAnalyzer::new(config);
        let interface = ComponentInterface {
            name: "ButtonProps".to_string(),
            source: "@fixtures/demo-ui".to_string(),
        };
        
        analyzer.add_component_usage("Button", "@fixtures/demo-ui", interface.clone());
        analyzer.add_component_usage("Card", "@fixtures/demo-ui", interface.clone());
        analyzer.add_component_usage("Button", "@fixtures/demo-ui", interface);
        
        analyzer.calculate_usage_stats();
        
        let components = analyzer.analyze("/test");
        let button = components.iter().find(|c| c.name == "Button").unwrap();
        let card = components.iter().find(|c| c.name == "Card").unwrap();
        
        assert_eq!(button.usage, Usage::VeryCommon);
        assert_eq!(card.usage, Usage::Common);
    }

    #[test]
    fn test_add_example() {
        let config = AtlasConfig {
            root_dir: "/test".to_string(),
            include: vec![],
            exclude: vec![],
        };
        
        let mut analyzer = AtlasAnalyzer::new(config);
        let interface = ComponentInterface {
            name: "ButtonProps".to_string(),
            source: "@fixtures/demo-ui".to_string(),
        };
        
        analyzer.add_component_usage("Button", "@fixtures/demo-ui", interface);
        
        for i in 0..6 {
            analyzer.add_example("Button", format!("<Button variant=\"primary\" />{}", i));
        }
        
        let components = analyzer.analyze("/test");
        let button = &components[0];
        assert_eq!(button.examples.len(), 5);
    }

    #[test]
    fn test_track_co_usage() {
        let config = AtlasConfig {
            root_dir: "/test".to_string(),
            include: vec![],
            exclude: vec![],
        };
        
        let mut analyzer = AtlasAnalyzer::new(config);
        let interface = ComponentInterface {
            name: "ButtonProps".to_string(),
            source: "@fixtures/demo-ui".to_string(),
        };
        
        analyzer.add_component_usage("Button", "@fixtures/demo-ui", interface);
        analyzer.track_co_usage("Button", "Card");
        analyzer.track_co_usage("Button", "Header");
        
        let components = analyzer.analyze("/test");
        let button = &components[0];
        assert_eq!(button.used_with.len(), 2);
        assert!(button.used_with.contains_key("Card"));
        assert!(button.used_with.contains_key("Header"));
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
        let mut values = HashMap::new();
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
        
        let mut used_with = HashMap::new();
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
