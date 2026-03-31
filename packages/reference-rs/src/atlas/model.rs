// Data model mirroring js/atlas/types.ts

#[derive(Debug, Clone)]
pub struct Component {
    pub name: String,
    pub interface: ComponentInterface,
    pub source: String,
    pub count: u32,
    pub props: Vec<ComponentProp>,
    pub usage: Usage,
    pub examples: Vec<String>,
    pub used_with: std::collections::HashMap<String, Usage>,
}

#[derive(Debug, Clone)]
pub struct ComponentInterface {
    pub name: String,
    pub source: String,
}

#[derive(Debug, Clone)]
pub struct ComponentProp {
    pub name: String,
    pub count: u32,
    pub usage: Usage,
    pub values: Option<std::collections::HashMap<String, Usage>>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum Usage {
    VeryCommon,
    Common,
    Occasional,
    Rare,
    Unused,
}

impl Usage {
    pub fn from_count(count: u32, total: u32) -> Self {
        if total == 0 {
            return Usage::Unused;
        }
        
        let ratio = count as f64 / total as f64;
        match ratio {
            r if r >= 0.5 => Usage::VeryCommon,
            r if r >= 0.2 => Usage::Common,
            r if r >= 0.1 => Usage::Occasional,
            r if r > 0.0 => Usage::Rare,
            _ => Usage::Unused,
        }
    }
}
