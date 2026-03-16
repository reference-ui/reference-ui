use super::{rewrite_css_imports, rewrite_cva_imports};

const VIRTUAL_PATH: &str = "src/virtualrs/example.tsx";

#[test]
fn rewrites_css_import_and_preserves_other_bindings() {
    let source = "import { css, Box } from '@reference-ui/react';\nconst x = css({});\n";

    let rewritten = rewrite_css_imports(source, VIRTUAL_PATH);

    assert_eq!(
        rewritten,
        "import { css } from 'src/system/css';\nimport { Box } from '@reference-ui/react';\n\nconst x = css({});\n"
    );
}

#[test]
fn rewrites_css_with_default_and_aliased_named_imports() {
    let source =
        "import React, { css, Box as Card } from '@reference-ui/react';\nexport { React, Card };\n";

    let rewritten = rewrite_css_imports(source, VIRTUAL_PATH);

    assert_eq!(
        rewritten,
        "import { css } from 'src/system/css';\nimport React, { Box as Card } from '@reference-ui/react';\n\nexport { React, Card };\n"
    );
}

#[test]
fn ignores_type_only_imports_for_css_rewrite() {
    let source = "import type { css } from '@reference-ui/react';\nconst x = 1;\n";

    assert_eq!(rewrite_css_imports(source, VIRTUAL_PATH), source);
}

#[test]
fn rewrites_recipe_alias_to_cva_and_normalizes_calls() {
    let source =
        "import { recipe as buttonRecipe, Box } from '@reference-ui/react';\nconst x = buttonRecipe({});\n";

    let rewritten = rewrite_cva_imports(source, VIRTUAL_PATH);

    assert_eq!(
        rewritten,
        "import { cva } from 'src/system/css';\nimport { Box } from '@reference-ui/react';\n\nconst x = cva({});\n"
    );
}

#[test]
fn rewrites_aliased_cva_import_to_canonical_cva_call() {
    let source =
        "import { cva as buttonCva, Box } from '@reference-ui/react';\nconst x = buttonCva({});\n";

    let rewritten = rewrite_cva_imports(source, VIRTUAL_PATH);

    assert_eq!(
        rewritten,
        "import { cva } from 'src/system/css';\nimport { Box } from '@reference-ui/react';\n\nconst x = cva({});\n"
    );
}

#[test]
fn leaves_unrelated_imports_unchanged_for_cva_rewrite() {
    let source = "import { Box } from '@reference-ui/react';\nconst x = Box;\n";

    assert_eq!(rewrite_cva_imports(source, VIRTUAL_PATH), source);
}

#[test]
fn rewrites_only_the_first_matching_runtime_import() {
    let source = concat!(
        "import { recipe as cardRecipe } from '@reference-ui/react';\n",
        "import { recipe as buttonRecipe } from '@reference-ui/react';\n",
        "const card = cardRecipe({});\n",
        "const button = buttonRecipe({});\n",
    );

    let rewritten = rewrite_cva_imports(source, VIRTUAL_PATH);

    assert_eq!(
        rewritten,
        concat!(
            "import { cva } from 'src/system/css';\n",
            "\n",
            "import { recipe as buttonRecipe } from '@reference-ui/react';\n",
            "const card = cva({});\n",
            "const button = buttonRecipe({});\n",
        )
    );
}
