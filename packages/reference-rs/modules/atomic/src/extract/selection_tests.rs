//! Compile-level tests for observed recipe call-site selections.
//! Proves the emission gate end to end: literal calls keep plain rules and
//! exactly the observed responsive triples, dynamic calls fail closed to the
//! full matrix, uncalled recipes shake out while their tables survive, and
//! imports trace across files to their defining export.

use crate::{compile, BaseSystem, CompileRequest, VirtualSource};

const RECIPE_IMPORT: &str = "import { recipe } from '@reference-ui/react'\n";

fn button_recipe() -> String {
    format!(
        "{RECIPE_IMPORT}\
        export const button = recipe({{\n\
          className: 'button',\n\
          base: {{ display: 'inline-flex' }},\n\
          variants: {{\n\
            variant: {{\n\
              solid: {{ color: 'white' }},\n\
              outline: {{ color: 'black' }},\n\
            }},\n\
          }},\n\
          defaultVariants: {{ variant: 'solid' }},\n\
        }})\n"
    )
}

fn compile_files(files: Vec<(&str, String)>) -> crate::CompileResult {
    let req = CompileRequest {
        files: Some(
            files
                .into_iter()
                .map(|(path, content)| VirtualSource {
                    path: path.to_string(),
                    content,
                })
                .collect(),
        ),
        base_system: BaseSystem::lib_fixture().clone(),
        // Top-level recipe tables are proof-gated (B3): stations read proof.
        logs: Some(vec!["proof".to_string()]),
        ..Default::default()
    };
    compile(&req).expect("compile succeeds")
}

fn compile_code(code: String) -> crate::CompileResult {
    compile_files(vec![("src/app.ts", code)])
}

/// Responsive rule probes: `sm\:`, `md\:`, … only print for emitted triples.
/// `2xl` leads with a digit, so the sheet escapes it as `\32 xl\:`.
fn has_breakpoint(sheet: &str, breakpoint: &str) -> bool {
    if breakpoint == "2xl" {
        return sheet.contains("32 xl\\:");
    }
    sheet.contains(&format!("{breakpoint}\\:"))
}

fn table_for<'a>(res: &'a crate::CompileResult, class_name: &str) -> &'a crate::RecipeTable {
    res.recipes
        .iter()
        .find(|table| table.class_name == class_name)
        .expect("recipe table builds")
}

#[test]
fn plain_call_keeps_plain_and_drops_responsive() {
    let code = format!(
        "{}\nvoid button\nbutton({{ variant: 'solid' }})\n",
        button_recipe()
    );
    let res = compile_code(code);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    assert!(res.stylesheet.contains("button__base"));
    assert!(res.stylesheet.contains("button_v_solid"));
    assert!(res.stylesheet.contains("button_v_outline"));
    for breakpoint in ["sm", "md", "lg", "xl", "2xl"] {
        assert!(
            !has_breakpoint(&res.stylesheet, breakpoint),
            "unobserved {breakpoint} must not print"
        );
    }
    table_for(&res, "button");
}

#[test]
fn responsive_call_emits_only_observed_triples() {
    let code = format!(
        "{}\nbutton({{ variant: {{ base: 'solid', md: 'outline' }} }})\n",
        button_recipe()
    );
    let res = compile_code(code);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    assert!(res.stylesheet.contains("button_v_solid"));
    assert!(has_breakpoint(&res.stylesheet, "md"));
    for breakpoint in ["sm", "lg", "xl", "2xl"] {
        assert!(
            !has_breakpoint(&res.stylesheet, breakpoint),
            "unobserved {breakpoint} must not print"
        );
    }
    let md_block = res.stylesheet.split("@container (min-width: 768px)").nth(1);
    let md_block = md_block.expect("md container block");
    assert!(md_block.contains("button_v_outline"));
    assert!(!md_block
        .split("@container")
        .next()
        .unwrap_or("")
        .contains("button_v_solid"));
}

#[test]
fn dynamic_calls_emit_full_matrix() {
    let code = format!(
        "{}\nbutton({{ ...props }})\n",
        button_recipe().replace("className: 'button'", "className: 'spread'")
    );
    let numeric = "const other = recipe({\n\
        className: 'numeric',\n\
        base: { display: 'block' },\n\
        variants: { size: { sm: { color: 'red' } } },\n\
      })\n\
      other({ size: 5 })\n";
    let res = compile_code(format!("{RECIPE_IMPORT}\n{code}\n{numeric}"));
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    for breakpoint in ["sm", "md", "lg", "xl", "2xl"] {
        assert!(
            has_breakpoint(&res.stylesheet, breakpoint),
            "dynamic recipes print every {breakpoint}"
        );
    }
    table_for(&res, "spread");
    table_for(&res, "numeric");
}

#[test]
fn uncalled_recipe_shakes_rules_but_keeps_table() {
    let res = compile_code(format!("{}\nvoid button\n", button_recipe()));
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    assert!(!res.stylesheet.contains("button__base"));
    assert!(!res.stylesheet.contains("button_v_solid"));
    assert!(!res.stylesheet.contains("@layer recipes {"));
    table_for(&res, "button");
}

#[test]
fn imported_recipe_call_resolves_cross_file() {
    let res = compile_files(vec![
        ("src/recipes.ts", button_recipe()),
        (
            "src/app.ts",
            "import { button } from './recipes'\n\
            const tone = button({ variant: { base: 'solid', lg: 'outline' } })\n\
            void tone\n"
                .to_string(),
        ),
    ]);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    assert!(res.stylesheet.contains("button__base"));
    assert!(has_breakpoint(&res.stylesheet, "lg"));
    assert!(!has_breakpoint(&res.stylesheet, "md"));
    assert!(!has_breakpoint(&res.stylesheet, "sm"));
}

#[test]
fn zero_arg_call_marks_called() {
    let code = format!("{}\nbutton()\n", button_recipe());
    let res = compile_code(code);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    assert!(res.stylesheet.contains("button__base"));
    assert!(!res.stylesheet.contains("\\:"));
}

#[test]
fn raw_member_call_does_not_mark_called() {
    let code = format!(
        "{}\nvoid button.raw({{ variant: 'solid' }})\n",
        button_recipe()
    );
    let res = compile_code(code);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    assert!(!res.stylesheet.contains("button__base"));
    table_for(&res, "button");
}

#[test]
fn boolean_and_skipped_leaves_map_exactly() {
    let code = format!(
        "{}\nbutton({{ variant: {{ md: undefined, lg: null, xl: 'solid' }} }})\n",
        button_recipe()
    );
    let res = compile_code(code);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    assert!(has_breakpoint(&res.stylesheet, "xl"));
    assert!(!has_breakpoint(&res.stylesheet, "md"));
    assert!(!has_breakpoint(&res.stylesheet, "lg"));
}

#[test]
fn iife_selection_resolves_inline() {
    let code = format!(
        "{RECIPE_IMPORT}\n\
        const tone = recipe({{\n\
          className: 'inline',\n\
          base: {{ display: 'inline-flex' }},\n\
          variants: {{ variant: {{ solid: {{ color: 'white' }} }} }},\n\
        }})({{ variant: 'solid' }})\n\
        void tone\n"
    );
    let res = compile_code(code);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    assert!(res.stylesheet.contains("inline__base"));
    table_for(&res, "inline");
}

#[test]
fn namespace_member_call_traces() {
    let res = compile_files(vec![
        ("src/recipes.ts", button_recipe()),
        (
            "src/app.ts",
            "import * as R from './recipes'\n\
            const a = R.button({ variant: 'solid' })\n\
            const b = R['button']({ variant: 'outline' })\n\
            void a\nvoid b\n"
                .to_string(),
        ),
    ]);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    assert!(res.stylesheet.contains("button__base"));
    assert!(res.stylesheet.contains("button_v_outline"));
}

#[test]
fn default_export_call_traces() {
    let res = compile_files(vec![
        (
            "src/recipes.ts",
            format!(
                "{RECIPE_IMPORT}\n\
                export default recipe({{\n\
                  className: 'def',\n\
                  base: {{ display: 'inline-flex' }},\n\
                }})\n"
            ),
        ),
        (
            "src/app.ts",
            "import d from './recipes'\nconst tone = d({})\nvoid tone\n".to_string(),
        ),
    ]);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    assert!(res.stylesheet.contains("def__base"));
    table_for(&res, "def");
}

#[test]
fn aliased_import_call_shakes_unsupported_shape() {
    let res = compile_files(vec![
        ("src/recipes.ts", button_recipe()),
        (
            "src/app.ts",
            "import { button } from '@/recipes'\n\
            const tone = button({ variant: 'solid' })\n\
            void tone\n"
                .to_string(),
        ),
    ]);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    assert!(!res.stylesheet.contains("button__base"));
    table_for(&res, "button");
}

#[test]
fn unsupported_shapes_shake_silently() {
    let res = compile_files(vec![
        ("src/recipes.ts", button_recipe()),
        (
            "src/app.ts",
            "import * as R from './recipes'\n\
            import { button } from './recipes'\n\
            const alias = button\n\
            alias({ variant: 'solid' })\n\
            R[which]({ variant: 'solid' })\n"
                .to_string(),
        ),
    ]);
    assert!(res.diagnostics.is_empty(), "{:?}", res.diagnostics);
    assert!(!res.stylesheet.contains("button__base"));
    table_for(&res, "button");
}

#[test]
fn merged_calls_union_triples() {
    let code = format!(
        "{}\nbutton({{ variant: {{ sm: 'solid' }} }})\nbutton({{ variant: {{ md: 'outline' }} }})\n",
        button_recipe()
    );
    let res = compile_code(code);
    assert!(res.stylesheet.contains("button__base"));
    assert!(has_breakpoint(&res.stylesheet, "sm"));
    assert!(has_breakpoint(&res.stylesheet, "md"));
    assert!(!has_breakpoint(&res.stylesheet, "lg"));
    assert_eq!(res.stylesheet.matches("sm\\:").count(), 1);
    assert_eq!(res.stylesheet.matches("md\\:").count(), 1);
}
