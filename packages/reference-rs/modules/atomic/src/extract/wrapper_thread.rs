//! Same-file wrapper-prop threading for JSX `css` blocks.
//!
//! A same-file component that forwards its destructured `css` prop into a
//! host (`function Rows({ css }) { return <Div css={css} />; }`) is a style
//! boundary styletrace never sees — it records exported components — so a
//! call-site value (`<Rows css={shared} />`) would otherwise extract
//! nothing. The pre-pass records these wrappers once per file; the JSX walk
//! then lowers threaded call-site values exactly as if written on the host.
//! Only a bare `css={param}` forward threads; anything fancier is out of
//! evidence and stays unhandled.

use oxc_ast::ast::{
    ArrowFunctionExpression, BindingPattern, Declaration, Expression, FormalParameters,
    Function, FunctionBody, JSXAttributeItem, JSXAttributeValue, JSXOpeningElement, Program,
    PropertyKey, Statement, VariableDeclarator,
};
use oxc_ast_visit::{walk, Visit};
use oxc_syntax::scope::ScopeFlags;
use rustc_hash::FxHashSet;

use super::jsx::{format_jsx_attribute_name, format_jsx_element_name};
use super::jsx_hosts::JsxHosts;

/// Same-file wrapper tags whose `css` prop forwards into a host element.
#[derive(Default)]
pub struct WrapperThreads {
    threaded: FxHashSet<Box<str>>,
}

impl WrapperThreads {
    /// True when this tag threads its `css` prop into a host.
    pub fn threads_css(&self, tag: &str) -> bool {
        self.threaded.contains(tag)
    }
}

/// Collect same-file `css` forwarders: capitalized functions (declarations
/// and arrow declarators) whose first parameter destructures a `css` key
/// and whose body renders `<Host css={param}>` on a host. Nested functions
/// never count; default-exported functions never count (their call-site
/// tag is the importer's name, which this pass cannot resolve).
pub fn collect(program: &Program<'_>, hosts: JsxHosts<'_>) -> WrapperThreads {
    let mut scan = WrapperScan {
        hosts,
        threaded: FxHashSet::default(),
    };
    scan.visit_program(program);
    WrapperThreads {
        threaded: scan.threaded,
    }
}

/// True for component-like names: a leading uppercase letter.
fn is_component_name(name: &str) -> bool {
    name.chars().next().is_some_and(|head| head.is_uppercase())
}

/// Visitor recording every same-file component that threads `css`.
struct WrapperScan<'a> {
    hosts: JsxHosts<'a>,
    threaded: FxHashSet<Box<str>>,
}

impl<'a> Visit<'a> for WrapperScan<'a> {
    fn visit_statement(&mut self, stmt: &Statement<'a>) {
        if let Statement::FunctionDeclaration(func) = stmt {
            self.check_function(func.id.as_ref().map(|id| id.name.as_str()), func);
        }
        walk::walk_statement(self, stmt);
    }

    fn visit_export_named_declaration(&mut self, decl: &oxc_ast::ast::ExportNamedDeclaration<'a>) {
        if let Some(Declaration::FunctionDeclaration(func)) = decl.declaration.as_ref() {
            self.check_function(func.id.as_ref().map(|id| id.name.as_str()), func);
        }
        walk::walk_export_named_declaration(self, decl);
    }

    fn visit_variable_declarator(&mut self, decl: &VariableDeclarator<'a>) {
        self.check_declarator(decl);
        walk::walk_variable_declarator(self, decl);
    }
}

impl WrapperScan<'_> {
    /// Record the function when it threads `css` into a host.
    fn check_function(&mut self, name: Option<&str>, func: &Function<'_>) {
        let Some(name) = name else {
            return;
        };
        if !is_component_name(name) {
            return;
        }
        let Some(body) = func.body.as_deref() else {
            return;
        };
        self.check_body(name, &func.params, body);
    }

    /// Record an arrow declarator when it threads `css` into a host.
    fn check_declarator(&mut self, decl: &VariableDeclarator<'_>) {
        let BindingPattern::BindingIdentifier(id) = &decl.id else {
            return;
        };
        let name = id.name.as_str();
        if !is_component_name(name) {
            return;
        }
        let Some(init) = decl.init.as_ref() else {
            return;
        };
        let Expression::ArrowFunctionExpression(arrow) = init.get_inner_expression() else {
            return;
        };
        self.check_body(name, &arrow.params, &arrow.body);
    }

    /// Record the component when its `css` bindings forward into a host.
    fn check_body(&mut self, name: &str, params: &FormalParameters<'_>, body: &FunctionBody<'_>) {
        let bound = css_bindings(params);
        if bound.is_empty() {
            return;
        }
        let mut forward = ForwardScan {
            hosts: self.hosts,
            bound,
            found: false,
        };
        forward.visit_function_body(body);
        if forward.found {
            self.threaded.insert(name.into());
        }
    }
}

/// Local names bound from the first parameter's `css` key: `{ css }`
/// binds `css`, `{ css: styles }` binds `styles`, `{ css = d }` binds
/// `css`. Any other shape binds nothing — the call-site `css` prop has
/// no local name to forward through.
fn css_bindings<'a>(params: &'a FormalParameters<'a>) -> FxHashSet<&'a str> {
    let mut bound = FxHashSet::default();
    let Some(first) = params.items.first() else {
        return bound;
    };
    let BindingPattern::ObjectPattern(pattern) = &first.pattern else {
        return bound;
    };
    for prop in &pattern.properties {
        if !is_css_key(&prop.key) || prop.computed {
            continue;
        }
        if let Some(name) = binding_name(&prop.value) {
            bound.insert(name);
        }
    }
    bound
}

/// True when the destructured key is the literal `css` prop.
fn is_css_key(key: &PropertyKey<'_>) -> bool {
    match key {
        PropertyKey::StaticIdentifier(key) => key.name.as_str() == "css",
        _ => false,
    }
}

/// The single identifier a binding pattern binds, through one default.
fn binding_name<'a>(pattern: &'a BindingPattern<'a>) -> Option<&'a str> {
    match pattern {
        BindingPattern::BindingIdentifier(id) => Some(id.name.as_str()),
        BindingPattern::AssignmentPattern(assign) => binding_name(&assign.left),
        _ => None,
    }
}

/// Body scanner proving one `<Host css={param}>` forward. Nested functions
/// never count: a forward inside them belongs to that scope, not this one.
struct ForwardScan<'a> {
    hosts: JsxHosts<'a>,
    bound: FxHashSet<&'a str>,
    found: bool,
}

impl<'a> Visit<'a> for ForwardScan<'a> {
    fn visit_function(&mut self, _func: &Function<'a>, _flags: ScopeFlags) {}

    fn visit_arrow_function_expression(&mut self, _arrow: &ArrowFunctionExpression<'a>) {}

    fn visit_jsx_opening_element(&mut self, elem: &JSXOpeningElement<'a>) {
        if !self.found && self.is_css_forward(elem) {
            self.found = true;
        }
        walk::walk_jsx_opening_element(self, elem);
    }
}

impl ForwardScan<'_> {
    /// True for `<Host css={param}>`: a host tag carrying a bare `css`
    /// identifier bound from this component's `css` prop.
    fn is_css_forward(&self, elem: &JSXOpeningElement<'_>) -> bool {
        let tag = format_jsx_element_name(&elem.name);
        if !self.hosts.contains(&tag) {
            return false;
        }
        elem.attributes.iter().any(|item| {
            let JSXAttributeItem::Attribute(attr) = item else {
                return false;
            };
            if format_jsx_attribute_name(&attr.name) != "css" {
                return false;
            }
            let Some(JSXAttributeValue::ExpressionContainer(container)) = &attr.value else {
                return false;
            };
            let Some(expr) = container.expression.as_expression() else {
                return false;
            };
            matches!(
                expr,
                Expression::Identifier(ident) if self.bound.contains(ident.name.as_str())
            )
        })
    }
}
