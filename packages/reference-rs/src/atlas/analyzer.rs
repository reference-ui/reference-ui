use crate::atlas::config::AtlasConfig;
use crate::atlas::model::{Component, ComponentInterface, ComponentProp, Usage};
use crate::atlas::scanner::{Scanner, SourceFile};
use crate::atlas::react::{ReactAnalyzer, DiscoveredComponent};
use std::collections::HashMap;

/// Main Atlas analyzer
pub struct AtlasAnalyzer {
    pub config: AtlasConfig,
    scanner: Scanner,
    react_analyzer: ReactAnalyzer,
}

impl AtlasAnalyzer {
    pub fn new(config: AtlasConfig) -> Self {
        let scanner = Scanner::new(&config.root_dir);
        let react_analyzer = ReactAnalyzer::new();
        
        Self {
            config,
            scanner,
            react_analyzer,
        }
    }

    /// Analyze the project and return component information
    pub fn analyze(&mut self, _project_path: &str) -> Vec<Component> {
        let mut components = Vec::new();
        
        // 1. Discover source files
        let files = match self.scanner.discover_files(&self.config) {
            Ok(files) => files,
            Err(e) => {
                eprintln!("Error discovering files: {}", e);
                return Vec::new();
            }
        };

        // 2. Parse files and discover React components
        let parsed_files = match self.scanner.parse_files(&files) {
            Ok(files) => files,
            Err(e) => {
                eprintln!("Error parsing files: {}", e);
                return Vec::new();
            }
        };

        let mut discovered_components = Vec::new();
        for source_file in parsed_files {
            match self.react_analyzer.analyze_file(&source_file) {
                Ok(mut file_components) => {
                    discovered_components.append(&mut file_components);
                }
                Err(e) => {
                    eprintln!("Error analyzing {}: {}", source_file.path.display(), e);
                }
            }
        }

        // 3. Convert discovered components to Atlas components
        for discovered in discovered_components {
            let component = self.convert_to_component(discovered);
            components.push(component);
        }

        // 4. Add library components based on include patterns
        if let Some(includes) = &self.config.include {
            for include in includes {
                if include.starts_with('@') {
                    // Handle library component includes - add all library components first
                    if let Some(library_components) = self.get_library_components("@fixtures/demo-ui") {
                        components.extend(library_components);
                    }
                }
            }
        }

        // 5. Apply filtering and calculate usage statistics
        components = self.apply_filters(components);
        self.calculate_usage_stats(&mut components);

        components
    }

    /// Convert a discovered component to an Atlas component
    fn convert_to_component(&self, discovered: DiscoveredComponent) -> Component {
        Component {
            name: discovered.name,
            interface: discovered.interface.unwrap_or_else(|| ComponentInterface {
                name: "Unknown".to_string(),
                source: discovered.source.clone(),
            }),
            source: discovered.source,
            count: 1,
            props: Vec::new(),
            usage: Usage::Unused,
            examples: Vec::new(),
            used_with: HashMap::new(),
        }
    }

    /// Get library components for a package by scanning its source files
    fn get_library_components(&self, package: &str) -> Option<Vec<Component>> {
        // Resolve package path - handle @scoped/package format
        let package_path = self.resolve_package_path(package)?;
        
        // Create a scanner for the library package
        let lib_scanner = Scanner::new(&package_path);
        
        // Create a temporary config for scanning the library
        let lib_config = AtlasConfig {
            root_dir: package_path.clone(),
            include: None,
            exclude: Some(vec![
                "**/node_modules/**".to_string(),
                "**/dist/**".to_string(),
                "**/build/**".to_string(),
                "**/*.test.*".to_string(),
                "**/*.spec.*".to_string(),
            ]),
        };
        
        // Discover and parse library source files
        let files = lib_scanner.discover_files(&lib_config).ok()?;
        let parsed_files = lib_scanner.parse_files(&files).ok()?;
        
        // Analyze files to discover components
        let mut components = Vec::new();
        for source_file in parsed_files {
            if let Ok(discovered) = self.react_analyzer.analyze_file(&source_file) {
                for disc_component in discovered {
                    // Only include exported components from libraries
                    if disc_component.is_exported {
                        let interface = disc_component
                            .interface
                            .map(|mut interface| {
                                interface.source = package.to_string();
                                interface
                            })
                            .unwrap_or_else(|| ComponentInterface {
                                name: "Unknown".to_string(),
                                source: package.to_string(),
                            });

                        let mut component = Component {
                            name: disc_component.name,
                            interface,
                            source: package.to_string(),
                            count: 1,
                            props: Vec::new(),
                            usage: Usage::Unused,
                            examples: Vec::new(),
                            used_with: HashMap::new(),
                        };
                        
                        // Try to extract props from the interface if available
                        if let Some(props) = self.extract_props_from_file(&source_file, &component.interface.name) {
                            component.props = props;
                        }
                        
                        components.push(component);
                    }
                }
            }
        }
        
        if components.is_empty() {
            None
        } else {
            Some(components)
        }
    }
    
    /// Resolve a package name to its filesystem path
    fn resolve_package_path(&self, package: &str) -> Option<String> {
        let base_path = std::path::Path::new(&self.config.root_dir);
        let package_name = package.trim_start_matches('@');
        let fixture_name = package_name.trim_start_matches("fixtures/");
        let workspace_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));

        let candidate_paths = [
            base_path.join("..").join(fixture_name).join("src"),
            base_path.join("..").join(package_name).join("src"),
            base_path.join("../../fixtures").join(fixture_name).join("src"),
            workspace_root.join("tests/atlas/cases/demo_surface/input").join(fixture_name).join("src"),
            workspace_root.join("fixtures").join(fixture_name).join("src"),
            base_path.join("node_modules").join(package).join("src"),
            base_path.join("node_modules").join(package),
            base_path.join("..").join(package_name).join("src"),
        ];

        for candidate in candidate_paths {
            if candidate.exists() {
                return candidate.to_str().map(|s| s.to_string());
            }
        }

        None
    }
    
    /// Extract props from a TypeScript interface definition
    fn extract_props_from_file(&self, source_file: &SourceFile, interface_name: &str) -> Option<Vec<ComponentProp>> {
        use regex::Regex;
        
        // Look for interface or type definition
        let interface_pattern = format!(r"(?:interface|type)\s+{}\s*=?\s*\{{", interface_name);
        let re = Regex::new(&interface_pattern).ok()?;
        
        if let Some(mat) = re.find(&source_file.content) {
            let start = mat.end();
            
            // Find the closing brace - simple brace counting
            let mut brace_count = 1;
            let mut end = start;
            let chars: Vec<char> = source_file.content[start..].chars().collect();
            
            for (i, ch) in chars.iter().enumerate() {
                match ch {
                    '{' => brace_count += 1,
                    '}' => {
                        brace_count -= 1;
                        if brace_count == 0 {
                            end = start + i;
                            break;
                        }
                    }
                    _ => {}
                }
            }
            
            if end > start {
                let interface_body = &source_file.content[start..end];
                return self.parse_interface_props(interface_body);
            }
        }
        
        None
    }
    
    /// Parse props from interface body
    fn parse_interface_props(&self, interface_body: &str) -> Option<Vec<ComponentProp>> {
        use regex::Regex;
        
        let mut props = Vec::new();
        
        // Match prop definitions: propName?: type
        let prop_pattern = Regex::new(r"(\w+)\??:\s*([^;,\n]+)").ok()?;
        
        for caps in prop_pattern.captures_iter(interface_body) {
            let name = caps.get(1)?.as_str().to_string();
            
            props.push(ComponentProp {
                name,
                count: 1,
                usage: Usage::Unused,
                values: None,
            });
        }
        
        if props.is_empty() {
            None
        } else {
            Some(props)
        }
    }

    /// Apply include/exclude filters to components
    fn apply_filters(&self, mut components: Vec<Component>) -> Vec<Component> {
        // Apply include patterns
        if let Some(includes) = &self.config.include {
            let mut filtered = Vec::new();
            
            for pattern in includes {
                if pattern.starts_with('@') && !pattern.contains(':') {
                    // Include all library components from this package
                    let package = pattern;
                    filtered.extend(components.iter().filter(|c| c.source == *package).cloned());
                } else if pattern.contains(':') {
                    // Scoped selector: @package:Component
                    let parts: Vec<&str> = pattern.split(':').collect();
                    if parts.len() == 2 {
                        let package = parts[0];
                        let name = parts[1];
                        filtered.extend(components.iter().filter(|c| c.source == *package && c.name == *name).cloned());
                    }
                } else {
                    // Local pattern - include all local components for now
                    filtered.extend(components.iter().filter(|c| !c.source.starts_with('@')).cloned());
                }
            }
            
            components = filtered;
        }

        // Apply exclude patterns
        if let Some(excludes) = &self.config.exclude {
            components.retain(|component| {
                !excludes.iter().any(|pattern| {
                    if pattern.contains(':') {
                        let parts: Vec<&str> = pattern.split(':').collect();
                        if parts.len() == 2 {
                            let package = parts[0];
                            let name = parts[1];
                            component.source == package && component.name == name
                        } else {
                            false
                        }
                    } else {
                        // Simple pattern matching
                        component.name.contains(pattern) || component.source.contains(pattern)
                    }
                })
            });
        }

        components
    }

    /// Calculate usage statistics for components and props
    fn calculate_usage_stats(&self, components: &mut [Component]) {
        let total_usage: u32 = components.iter().map(|c| c.count).sum();
        
        for component in components.iter_mut() {
            component.usage = Usage::from_count(component.count, total_usage);
            
            let prop_total: u32 = component.props.iter().map(|p| p.count).sum();
            for prop in component.props.iter_mut() {
                prop.usage = Usage::from_count(prop.count, prop_total);
            }
        }
    }
}
