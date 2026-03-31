use crate::atlas::config::AtlasConfig;
use crate::atlas::model::{Component, ComponentInterface, ComponentProp, Usage};
use std::collections::HashMap;

pub struct AtlasAnalyzer {
    pub config: AtlasConfig,
    pub components: HashMap<String, Component>,
}

impl AtlasAnalyzer {
    pub fn new(config: AtlasConfig) -> Self {
        Self {
            config,
            components: HashMap::new(),
        }
    }

    pub fn analyze(&mut self, _project_path: &str) -> Vec<Component> {
        self.components.values().cloned().collect()
    }

    pub fn add_component_usage(&mut self, name: &str, source: &str, interface: ComponentInterface) {
        let component = self.components.entry(name.to_string()).or_insert(Component {
            name: name.to_string(),
            interface,
            source: source.to_string(),
            count: 0,
            props: Vec::new(),
            usage: Usage::Unused,
            examples: Vec::new(),
            used_with: HashMap::new(),
        });
        
        component.count += 1;
    }

    pub fn add_prop_usage(&mut self, component_name: &str, prop_name: &str) {
        if let Some(component) = self.components.get_mut(component_name) {
            if let Some(prop) = component.props.iter_mut().find(|p| p.name == prop_name) {
                prop.count += 1;
            } else {
                component.props.push(ComponentProp {
                    name: prop_name.to_string(),
                    count: 1,
                    usage: Usage::Rare,
                    values: None,
                });
            }
        }
    }

    pub fn calculate_usage_stats(&mut self) {
        let total_usage: u32 = self.components.values().map(|c| c.count).sum();
        
        for component in self.components.values_mut() {
            component.usage = Usage::from_count(component.count, total_usage);
            
            let prop_total: u32 = component.props.iter().map(|p| p.count).sum();
            for prop in component.props.iter_mut() {
                prop.usage = Usage::from_count(prop.count, prop_total);
            }
        }
    }

    pub fn add_example(&mut self, component_name: &str, example: String) {
        if let Some(component) = self.components.get_mut(component_name) {
            if component.examples.len() < 5 {
                component.examples.push(example);
            }
        }
    }

    pub fn track_co_usage(&mut self, component_name: &str, used_with: &str) {
        if let Some(component) = self.components.get_mut(component_name) {
            *component.used_with.entry(used_with.to_string()).or_insert(Usage::Rare) = Usage::Common;
        }
    }
}
