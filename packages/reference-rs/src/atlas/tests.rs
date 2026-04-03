#[cfg(test)]
mod tests {
    use crate::atlas::config::AtlasConfig;
    use crate::atlas::internal::{component_key, create_usage_state, ComponentTemplate};
    use crate::atlas::model::{
        Component, ComponentInterface, ComponentProp, Usage, UsageThresholds,
    };
    use crate::atlas::parser::parse_modules;
    use crate::atlas::resolver::build_alias_map;
    use crate::atlas::scanner::Scanner;
    use crate::atlas::usage_policy::{score_usage, usage_thresholds};
    use crate::atlas::AtlasAnalyzer;
    use std::collections::BTreeMap;
    use std::path::{Path, PathBuf};

    const DEMO_SURFACE_CASE: &str = "demo_surface";
    const DYNAMIC_VALUES_CASE: &str = "dynamic_values";
    const SAME_NAME_COLLISIONS_CASE: &str = "same_name_collisions";
    const PACKAGE_BARRELS_CASE: &str = "package_barrels";
    const DEFAULT_REEXPORT_ALIASES_CASE: &str = "default_reexport_aliases";
    const LOCAL_NAMESPACE_BARRELS_CASE: &str = "local_namespace_barrels";
    const PACKAGE_DEFAULT_BARRELS_CASE: &str = "package_default_barrels";
    const CO_USAGE_PAIRS_CASE: &str = "co_usage_pairs";
    const WRAPPED_COMPONENTS_CASE: &str = "wrapped_components";

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

        assert_eq!(Usage::from_count_with_thresholds(3, 4, &custom), Usage::VeryCommon);
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
    fn test_wrapped_components_preserve_props_from_wrapper_generics() {
        let root_dir = case_app_root(WRAPPED_COMPONENTS_CASE);
        let config = AtlasConfig {
            root_dir,
            include: None,
            exclude: None,
        };

        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze("");

        let fancy_button = components
            .iter()
            .find(|component| component.name == "FancyButton")
            .expect("expected FancyButton component");
        let search_input = components
            .iter()
            .find(|component| component.name == "SearchInput")
            .expect("expected SearchInput component");

        assert_eq!(fancy_button.count, 2);
        assert_eq!(
            fancy_button.interface.as_ref().map(|interface| interface.name.as_str()),
            Some("FancyButtonProps")
        );

        assert_eq!(search_input.count, 2);
        assert_eq!(
            search_input.interface.as_ref().map(|interface| interface.name.as_str()),
            Some("SearchInputProps")
        );
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
    fn test_dynamic_values_do_not_claim_literal_value_usage_for_expressions() {
        let root_dir = case_app_root(DYNAMIC_VALUES_CASE);
        let config = AtlasConfig {
            root_dir,
            include: None,
            exclude: None,
        };

        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze("");

        let button = components
            .iter()
            .find(|component| component.name == "Button")
            .expect("expected Button component in dynamic_values case");

        assert_eq!(button.count, 3);

        let variant = button
            .props
            .iter()
            .find(|prop| prop.name == "variant")
            .expect("expected variant prop");
        assert_eq!(variant.count, 3);

        let values = variant
            .values
            .as_ref()
            .expect("expected variant values map for union prop");
        assert_ne!(values.get("solid"), Some(&Usage::Unused));
        assert_eq!(values.get("ghost"), Some(&Usage::Unused));
        assert_eq!(values.get("outline"), Some(&Usage::Unused));

        let disabled = button
            .props
            .iter()
            .find(|prop| prop.name == "disabled")
            .expect("expected disabled prop");
        assert_eq!(disabled.count, 1);
    }

    #[test]
    fn test_same_name_collisions_keep_components_distinct_by_source() {
        let root_dir = case_app_root(SAME_NAME_COLLISIONS_CASE);
        let config = AtlasConfig {
            root_dir,
            include: None,
            exclude: None,
        };

        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze("");

        let buttons = components
            .iter()
            .filter(|component| component.name == "Button")
            .collect::<Vec<_>>();

        assert_eq!(buttons.len(), 2);
        assert!(buttons.iter().any(|component| component.source.ends_with("components/forms/Button.tsx") && component.count == 2));
        assert!(buttons.iter().any(|component| component.source.ends_with("components/marketing/Button.tsx") && component.count == 1));
    }

    #[test]
    fn test_package_barrels_resolve_local_wrapper_interface_through_package_index() {
        let root_dir = case_app_root(PACKAGE_BARRELS_CASE);
        let config = AtlasConfig {
            root_dir,
            include: Some(vec!["@fixtures/barrel-ui".to_string()]),
            exclude: None,
        };

        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze("");

        let app_button = components
            .iter()
            .find(|component| component.name == "AppButton")
            .expect("expected AppButton component");
        assert_eq!(
            app_button.interface.as_ref().map(|interface| interface.name.as_str()),
            Some("ButtonProps")
        );
        assert_eq!(
            app_button.interface.as_ref().map(|interface| interface.source.as_str()),
            Some("@fixtures/barrel-ui")
        );

        let package_button = components
            .iter()
            .find(|component| component.name == "Button" && component.source == "@fixtures/barrel-ui")
            .expect("expected included package Button component");
        assert_eq!(
            package_button.interface.as_ref().map(|interface| interface.name.as_str()),
            Some("ButtonProps")
        );
    }

    #[test]
    fn test_default_reexport_alias_chain_resolves_canonical_component() {
        let root_dir = case_app_root(DEFAULT_REEXPORT_ALIASES_CASE);
        let config = AtlasConfig {
            root_dir,
            include: None,
            exclude: None,
        };

        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze("");

        let button = components
            .iter()
            .find(|component| component.name == "Button")
            .expect("expected Button component");

        assert_eq!(button.count, 2);
        assert_eq!(
            button.interface.as_ref().map(|interface| interface.name.as_str()),
            Some("ButtonProps")
        );
        assert!(button.examples.iter().any(|example| example.contains("<CTAButton")));
    }

    #[test]
    fn test_local_namespace_barrel_imports_preserve_inventory_and_interface_mapping() {
        let root_dir = case_app_root(LOCAL_NAMESPACE_BARRELS_CASE);
        let config = AtlasConfig {
            root_dir,
            include: None,
            exclude: None,
        };

        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze("");

        let button = components
            .iter()
            .find(|component| component.name == "Button")
            .expect("expected Button component");
        let badge = components
            .iter()
            .find(|component| component.name == "UserBadge")
            .expect("expected UserBadge component");

        assert_eq!(button.count, 2);
        assert_eq!(
            button.interface.as_ref().map(|interface| interface.name.as_str()),
            Some("ButtonProps")
        );
        assert_eq!(badge.count, 1);
    }

    #[test]
    fn test_package_default_barrels_resolve_default_export_inventory_and_mapping() {
        let root_dir = case_app_root(PACKAGE_DEFAULT_BARRELS_CASE);
        let config = AtlasConfig {
            root_dir,
            include: Some(vec!["@fixtures/default-barrel-ui".to_string()]),
            exclude: None,
        };

        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze("");

        let package_button = components
            .iter()
            .find(|component| component.name == "Button" && component.source == "@fixtures/default-barrel-ui")
            .expect("expected package Button component");
        let app_button = components
            .iter()
            .find(|component| component.name == "AppButton")
            .expect("expected AppButton component");

        assert_eq!(package_button.count, 3);
        assert_eq!(
            package_button.interface.as_ref().map(|interface| interface.name.as_str()),
            Some("ButtonProps")
        );
        assert_eq!(
            app_button.interface.as_ref().map(|interface| interface.source.as_str()),
            Some("@fixtures/default-barrel-ui")
        );
    }

    #[test]
    fn test_package_default_import_builds_alias_to_canonical_component() {
        let app_root = PathBuf::from(case_app_root(PACKAGE_DEFAULT_BARRELS_CASE));
        let app_scanner = Scanner::new(app_root.to_str().expect("valid app root"));
        let local_files = app_scanner
            .discover_files(&AtlasConfig::default())
            .expect("discover local files");
        let local_sources = app_scanner
            .parse_files(&local_files)
            .expect("parse local files");

        let mut modules = parse_modules(&local_sources, Some(&app_root), None);

        let package_src = atlas_tests_dir()
            .join("cases")
            .join(PACKAGE_DEFAULT_BARRELS_CASE)
            .join("input")
            .join("default-barrel-ui")
            .join("src");
        let package_scanner = Scanner::new(package_src.to_str().expect("valid package src"));
        let package_files = package_scanner
            .discover_files(&AtlasConfig::default())
            .expect("discover package files");
        let package_sources = package_scanner
            .parse_files(&package_files)
            .expect("parse package files");

        modules.extend(parse_modules(
            &package_sources,
            None,
            Some("@fixtures/default-barrel-ui"),
        ));

        let page_path = app_root.join("src/pages/PackageDefaultBarrelsPage.tsx");
        let page_module = modules.get(&page_path).expect("page module present");

        let mut states = BTreeMap::new();
        states.insert(
            component_key("Button", "@fixtures/default-barrel-ui"),
            create_usage_state(ComponentTemplate {
                name: "Button".to_string(),
                source: "@fixtures/default-barrel-ui".to_string(),
                interface_name: Some("ButtonProps".to_string()),
                interface_source: Some("@fixtures/default-barrel-ui".to_string()),
                file_path: PathBuf::from("Button.tsx"),
                app_relative_path: None,
                props: Vec::new(),
            }),
        );

        let aliases = build_alias_map(page_module, &modules, &states);

        assert_eq!(
            aliases.get("PackageButton"),
            Some(&component_key("Button", "@fixtures/default-barrel-ui"))
        );
    }

    #[test]
    fn test_co_usage_pairs_are_ranked_deterministically() {
        let root_dir = case_app_root(CO_USAGE_PAIRS_CASE);
        let config = AtlasConfig {
            root_dir,
            include: None,
            exclude: None,
        };

        let mut analyzer = AtlasAnalyzer::new(config);
        let components = analyzer.analyze("");

        let button = components
            .iter()
            .find(|component| component.name == "Button")
            .expect("expected Button component");

        assert_eq!(button.used_with.get("Card"), Some(&Usage::VeryCommon));
        assert_ne!(button.used_with.get("Badge"), Some(&Usage::Unused));
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
        assert_eq!(
            button.interface.as_ref().map(|interface| interface.name.as_str()),
            Some("ButtonProps")
        );
        assert_eq!(
            button.interface.as_ref().map(|interface| interface.source.as_str()),
            Some("@fixtures/demo-ui")
        );
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
            component.interface.as_ref().map(|interface| interface.name.as_str()),
            Some("ButtonProps")
        );
    }
}
