//! Macro, rewrite, emit, and drop entries of the lowering table, plus the container-query step list.
//! These keys carry no shape, so `insert_macro_steps` adds them by plain insertion after the shape pass and cannot collide with it.
//! `container_steps` reads its literal prop names and bare-value guards from the container, flex, gradient, and size modules so the lowering stays aligned with the expansion pass.

use super::{Guard, LowerStep, MacroName, NamedGuard, RENDERED_VALUE};
use crate::resolve::shorthands::flex;
use crate::resolve::{container, gradient, size, RUNTIME_OWNED_PROPS};

/// Macro, rewrite, emit, and drop entries: none of these keys carries a
/// shape, so plain insertion cannot collide with the gate pass above.
pub(super) fn insert_macro_steps(lowerings: &mut std::collections::BTreeMap<String, Vec<LowerStep>>) {
    lowerings.insert(
        "flex".to_string(),
        vec![LowerStep::Rewrite {
            on: None,
            rewrite: flex::FLEX_KEYWORD_TRIPLES
                .iter()
                .map(|(from, to)| ((*from).to_string(), (*to).to_string()))
                .collect(),
        }],
    );
    lowerings.insert(
        "size".to_string(),
        vec![LowerStep::Emit {
            on: None,
            scalar: false,
            emit: size::EMIT_PROPS
                .iter()
                .map(|prop| ((*prop).to_string(), RENDERED_VALUE.to_string()))
                .collect(),
        }],
    );
    lowerings.insert("container".to_string(), container_steps());
    lowerings.insert(
        "textGradient".to_string(),
        vec![LowerStep::Emit {
            on: None,
            scalar: false,
            emit: vec![
                (gradient::IMAGE_PROP.to_string(), RENDERED_VALUE.to_string()),
                (
                    gradient::CLIP_PROP.to_string(),
                    gradient::CLIP_VALUE.to_string(),
                ),
                (
                    gradient::INK_PROP.to_string(),
                    gradient::INK_VALUE.to_string(),
                ),
            ],
        }],
    );
    lowerings.insert("font".to_string(), vec![macro_step(MacroName::Font)]);
    lowerings.insert("weight".to_string(), vec![macro_step(MacroName::Weight)]);
    for prop in RUNTIME_OWNED_PROPS {
        lowerings.insert((*prop).to_string(), vec![LowerStep::Drop { drop: true }]);
    }
}

/// One unguarded macro step.
pub(super) fn macro_step(name: MacroName) -> LowerStep {
    LowerStep::Macro { on: None, name }
}

/// `container` guard order: `true`, empty, rendered `"true"`, then default.
/// Bool `false`, null, and numbers fall to default with rendered `$`.
pub(super) fn container_steps() -> Vec<LowerStep> {
    let bare = vec![(
        container::TYPE_PROP.to_string(),
        container::INLINE_SIZE.to_string(),
    )];
    let mut named = bare.clone();
    named.push((container::NAME_PROP.to_string(), RENDERED_VALUE.to_string()));
    vec![
        LowerStep::Emit {
            on: Some(Guard::Named(NamedGuard::BoolTrue)),
            // Kind-open: `container::lower` reads every value kind.
            scalar: false,
            emit: bare.clone(),
        },
        LowerStep::Emit {
            on: Some(Guard::Named(NamedGuard::Empty)),
            // Kind-open: the empty test runs on every rendering.
            scalar: false,
            emit: bare.clone(),
        },
        LowerStep::Emit {
            on: Some(Guard::Eq {
                eq: container::BARE_VALUE.to_string(),
                // Untrimmed: `container::lower` compares the raw rendering.
                trimmed: false,
            }),
            // Kind-open: `false`, `null`, and tokens test `true` too.
            scalar: false,
            emit: bare,
        },
        LowerStep::Emit {
            on: None,
            scalar: false,
            emit: named,
        },
    ]
}
