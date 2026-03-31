// Data model mirroring js/atlas/types.ts — not yet populated by any analyzer.

pub struct Component {
    pub name: String,
    pub interface: String,
    pub source: String,
    pub count: u32,
    pub props: Vec<ComponentProp>,
    pub usage: Usage,
    pub examples: Vec<String>,
    pub used_with: std::collections::HashMap<String, Usage>,
}

pub struct ComponentProp {
    pub name: String,
    pub description: Option<String>,
    pub required: bool,
    pub default: Option<String>,
    pub count: u32,
    pub usage: Usage,
    pub values: Option<std::collections::HashMap<String, Usage>>,
}

pub enum Usage {
    VeryCommon,
    Common,
    Occasional,
    Rare,
    Unused,
}
