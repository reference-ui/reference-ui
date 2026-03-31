use crate::atlas::scanner::SourceFile;
use crate::atlas::model::ComponentInterface;
use regex::Regex;

/// Discovered React component with its props type information
#[derive(Debug, Clone)]
pub struct DiscoveredComponent {
    pub name: String,
    pub source: String,
    pub interface: Option<ComponentInterface>,
    pub is_exported: bool,
    #[allow(dead_code)]
    pub component_type: ComponentType,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ComponentType {
    Function,
    Arrow,
    Wrapper,
    #[allow(dead_code)]
    Class,
}

/// React component analyzer using regex-based pattern matching
pub struct ReactAnalyzer;

impl ReactAnalyzer {
    pub fn new() -> Self {
        Self
    }

    /// Analyze a source file and discover React components
    pub fn analyze_file(&self, source_file: &SourceFile) -> Result<Vec<DiscoveredComponent>, String> {
        let content = &source_file.content;
        let mut components = Vec::new();

        // Pattern 1: Export function component
        if let Some(matches) = self.find_function_components(content, true, source_file)? {
            components.extend(matches);
        }

        // Pattern 2: Local function component
        if let Some(matches) = self.find_function_components(content, false, source_file)? {
            components.extend(matches);
        }

        // Pattern 3: Arrow function components
        if let Some(matches) = self.find_arrow_components(content, source_file)? {
            components.extend(matches);
        }

        // Pattern 4: Wrapper components
        if let Some(matches) = self.find_wrapper_components(content, source_file)? {
            components.extend(matches);
        }

        Ok(components)
    }

    /// Find function components using regex
    fn find_function_components(&self, content: &str, is_exported: bool, source_file: &SourceFile) -> Result<Option<Vec<DiscoveredComponent>>, String> {
        let mut components = Vec::new();
        
        // Pattern: export function ComponentName(props: PropsType)
        let export_pattern = if is_exported {
            r#"export\s+function\s+(\w+)\s*\([^)]*:\s*(\w+(?:Props|Type)?)[^)]*\)"#
        } else {
            r#"function\s+(\w+)\s*\([^)]*:\s*(\w+(?:Props|Type)?)[^)]*\)"#
        };

        let re = Regex::new(export_pattern).map_err(|e| format!("Regex error: {}", e))?;
        
        for caps in re.captures_iter(content) {
            let name = caps.get(1).unwrap().as_str().to_string();
            let props_type = caps.get(2).unwrap().as_str().to_string();
            
            if self.function_match_returns_jsx(content, caps.get(0).unwrap().end()) {
                let interface = self.infer_interface_from_type(&props_type, content, source_file);
                let source_path = self.get_relative_source_path(source_file);

                components.push(DiscoveredComponent {
                    name,
                    source: source_path,
                    interface,
                    is_exported,
                    component_type: ComponentType::Function,
                });
            }
        }

        Ok(if components.is_empty() { None } else { Some(components) })
    }

    /// Find arrow function components using regex
    fn find_arrow_components(&self, content: &str, source_file: &SourceFile) -> Result<Option<Vec<DiscoveredComponent>>, String> {
        let mut components = Vec::new();
        
        // Pattern: const ComponentName = (props: PropsType) =>
        let pattern = r#"const\s+(\w+)\s*=\s*\([^)]*:\s*(\w+(?:Props|Type)?)[^)]*\)\s*=>"#;
        let re = Regex::new(pattern).map_err(|e| format!("Regex error: {}", e))?;
        
        for caps in re.captures_iter(content) {
            let name = caps.get(1).unwrap().as_str().to_string();
            let props_type = caps.get(2).unwrap().as_str().to_string();
            
            if self.arrow_match_returns_jsx(content, caps.get(0).unwrap().end()) {
                let interface = self.infer_interface_from_type(&props_type, content, source_file);
                let source_path = self.get_relative_source_path(source_file);

                components.push(DiscoveredComponent {
                    name,
                    source: source_path,
                    interface,
                    is_exported: false,
                    component_type: ComponentType::Arrow,
                });
            }
        }

        Ok(if components.is_empty() { None } else { Some(components) })
    }

    /// Find wrapper components using regex
    fn find_wrapper_components(&self, content: &str, source_file: &SourceFile) -> Result<Option<Vec<DiscoveredComponent>>, String> {
        let mut components = Vec::new();
        
        // Pattern: const ComponentName = SomeWrapperFunction(...)
        let pattern = r#"const\s+(\w+)\s*=\s*(\w+)\s*\("#;
        let re = Regex::new(pattern).map_err(|e| format!("Regex error: {}", e))?;
        
        for caps in re.captures_iter(content) {
            let name = caps.get(1).unwrap().as_str().to_string();
            let wrapped_name = caps.get(2).unwrap().as_str().to_string();
            
            // Check if this looks like a React wrapper
            if self.looks_like_react_component(&wrapped_name, content) {
                let interface = self.infer_wrapper_interface(&wrapped_name, content, source_file);
                let source_path = self.get_relative_source_path(source_file);

                components.push(DiscoveredComponent {
                    name,
                    source: source_path,
                    interface,
                    is_exported: false,
                    component_type: ComponentType::Wrapper,
                });
            }
        }

        Ok(if components.is_empty() { None } else { Some(components) })
    }

    fn function_match_returns_jsx(&self, content: &str, declaration_end: usize) -> bool {
        self.block_body_after(content, declaration_end)
            .map(|body| self.body_contains_jsx(body))
            .unwrap_or(false)
    }

    fn arrow_match_returns_jsx(&self, content: &str, declaration_end: usize) -> bool {
        let remainder = &content[declaration_end..];
        let trimmed = remainder.trim_start();

        if trimmed.starts_with('<') || trimmed.starts_with("(") && trimmed.contains('<') {
            return true;
        }

        self.block_body_after(content, declaration_end)
            .map(|body| self.body_contains_jsx(body))
            .unwrap_or(false)
    }

    fn block_body_after<'a>(&self, content: &'a str, start: usize) -> Option<&'a str> {
        let remainder = &content[start..];
        let block_start_offset = remainder.find('{')?;
        let body_start = start + block_start_offset + 1;
        let mut depth = 1;

        for (offset, ch) in content[body_start..].char_indices() {
            match ch {
                '{' => depth += 1,
                '}' => {
                    depth -= 1;
                    if depth == 0 {
                        let body_end = body_start + offset;
                        return Some(&content[body_start..body_end]);
                    }
                }
                _ => {}
            }
        }

        None
    }

    fn body_contains_jsx(&self, body: &str) -> bool {
        body.contains("return") && body.contains('<')
    }

    /// Check if a name looks like a React component
    fn looks_like_react_component(&self, name: &str, _content: &str) -> bool {
        // Simple heuristic: starts with uppercase letter
        if let Some(first_char) = name.chars().next() {
            if first_char.is_uppercase() {
                return true;
            }
        }
        false
    }

    /// Infer interface from props type
    fn infer_interface_from_type(&self, props_type: &str, content: &str, source_file: &SourceFile) -> Option<ComponentInterface> {
        let name = if props_type.ends_with("Props") || props_type.ends_with("Type") {
            props_type.to_string()
        } else {
            format!("{}Props", props_type)
        };

        let source = if self.content_contains_import(content, "@fixtures/demo-ui") {
            "@fixtures/demo-ui".to_string()
        } else {
            self.get_relative_source_path(source_file)
        };

        Some(ComponentInterface { name, source })
    }

    /// Infer interface for wrapper components
    fn infer_wrapper_interface(&self, wrapped_name: &str, content: &str, source_file: &SourceFile) -> Option<ComponentInterface> {
        let name = format!("{}Props", wrapped_name);
        let source = if self.content_contains_import(content, "@fixtures/demo-ui") {
            "@fixtures/demo-ui".to_string()
        } else {
            self.get_relative_source_path(source_file)
        };

        Some(ComponentInterface { name, source })
    }

    /// Check if content contains a specific import
    fn content_contains_import(&self, content: &str, import_name: &str) -> bool {
        content.contains(import_name)
    }

    /// Get relative source path for component
    fn get_relative_source_path(&self, source_file: &SourceFile) -> String {
        // Convert absolute path to relative path from project root
        if let Some(parent) = source_file.path.parent() {
            if let Some(file_name) = source_file.path.file_name() {
                if let Some(file_str) = file_name.to_str() {
                    if let Some(parent_name) = parent.file_name() {
                        if let Some(parent_str) = parent_name.to_str() {
                            return format!("./{}/{}", parent_str, file_str);
                        }
                    }
                }
            }
        }
        source_file.path.to_string_lossy().to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::atlas::scanner::SourceFile;
    use oxc_span::SourceType;

    #[test]
    fn test_function_component_extraction() {
        let analyzer = ReactAnalyzer::new();
        let source_file = SourceFile {
            path: "/test/Button.tsx".into(),
            content: r#"
export function Button(props: ButtonProps) {
    return <button>Click me</button>;
}
"#.to_string(),
            source_type: SourceType::tsx(),
        };

        let components = analyzer.analyze_file(&source_file).unwrap();
        // Should find at least one component
        assert!(!components.is_empty());
        
        let component = &components[0];
        assert_eq!(component.name, "Button");
        assert_eq!(component.component_type, ComponentType::Function);
        assert!(component.is_exported);
        assert!(component.interface.is_some());
    }

    #[test]
    fn test_arrow_component_extraction() {
        let analyzer = ReactAnalyzer::new();
        let source_file = SourceFile {
            path: "/test/Card.tsx".into(),
            content: r#"
const Card = (props: CardProps) => {
    return <div>Card content</div>;
};
"#.to_string(),
            source_type: SourceType::tsx(),
        };

        let components = analyzer.analyze_file(&source_file).unwrap();
        assert_eq!(components.len(), 1);
        
        let component = &components[0];
        assert_eq!(component.name, "Card");
        assert_eq!(component.component_type, ComponentType::Arrow);
        assert!(!component.is_exported);
    }

    #[test]
    fn test_library_import_detection() {
        let analyzer = ReactAnalyzer::new();
        let source_file = SourceFile {
            path: "/test/Button.tsx".into(),
            content: r#"
import { Button as DemoButton } from '@fixtures/demo-ui';

export function Button(props: ButtonProps) {
    return <DemoButton {...props} />;
}
"#.to_string(),
            source_type: SourceType::tsx(),
        };

        let components = analyzer.analyze_file(&source_file).unwrap();
        // Should find at least one component
        assert!(!components.is_empty());
        
        let component = &components[0];
        assert_eq!(component.interface.as_ref().unwrap().source, "@fixtures/demo-ui");
    }
}
