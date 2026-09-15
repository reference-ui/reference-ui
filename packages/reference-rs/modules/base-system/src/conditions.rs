//! Named `_` condition wraps the lib fixture overlays from the Panda preset.
//! Keys match canon `NAMED_CONDITIONS`. Lib TypeScript authors no conditions;
//! these 78 wraps are host/Panda shapes (`&:is(:hover, [data-hover])` on the leaf
//! and on group/peer). Host color mode uses `[data-panda-theme=…]`, not `.dark` /
//! `.light`. `_osDark` / `_print` / `_motionReduce` stay `@media`. Empty BaseSystem
//! has no conditions.

use indexmap::IndexMap;

const HOVER: &str = "&:is(:hover, [data-hover])";
const ACTIVE: &str = "&:is(:active, [data-active])";
const FOCUS: &str = "&:is(:focus, [data-focus])";
const FOCUS_VISIBLE: &str = "&:is(:focus-visible, [data-focus-visible])";
const DISABLED: &str = "&:is(:disabled, [disabled], [data-disabled], [aria-disabled=true])";
const CHECKED: &str =
    "&:is(:checked, [data-checked], [aria-checked=true], [data-state=\"checked\"])";
const EXPANDED: &str = "&:is([aria-expanded=true], [data-expanded], [data-state=\"expanded\"])";
const INVALID: &str = "&:is(:invalid, [data-invalid], [aria-invalid=true])";

/// Panda-preset condition map the lib fixture overlays. Keys include the leading `_`.
pub fn lib_conditions() -> IndexMap<String, String> {
    LIB_CONDITIONS
        .iter()
        .map(|(key, wrap)| ((*key).to_string(), (*wrap).to_string()))
        .collect()
}

const LIB_CONDITIONS: &[(&str, &str)] = &[
    ("_active", ACTIVE),
    ("_after", "&::after"),
    ("_autofill", "&:is(:autofill, [data-autofill])"),
    ("_backdrop", "&::backdrop"),
    ("_before", "&::before"),
    ("_checked", CHECKED),
    ("_closed", "&:is([data-state=\"closed\"], [data-closed])"),
    ("_current", "&[aria-current=true]"),
    ("_currentPage", "&[aria-current=page]"),
    ("_currentStep", "&[aria-current=step]"),
    ("_dark", "[data-panda-theme=dark] &"),
    ("_default", "&:default"),
    ("_disabled", DISABLED),
    ("_dragging", "&:is([data-dragging], [data-state=\"dragging\"])"),
    ("_empty", "&:empty"),
    ("_enabled", "&:enabled"),
    ("_even", "&:nth-of-type(even)"),
    ("_expanded", EXPANDED),
    ("_first", "&:first-child"),
    ("_firstOfType", "&:first-of-type"),
    ("_focus", FOCUS),
    ("_focusVisible", FOCUS_VISIBLE),
    ("_focusWithin", "&:is(:focus-within, [data-focus-within])"),
    ("_fullscreen", "&:fullscreen"),
    ("_grabbed", "&:is([aria-grabbed=true], [data-grabbed])"),
    (
        "_groupActive",
        "&:is(:where(.group, [data-group]):is(:active, [data-active]) *)",
    ),
    (
        "_groupChecked",
        "&:is(:where(.group, [data-group]):is(:checked, [data-checked], [aria-checked=true], [data-state=\"checked\"]) *)",
    ),
    (
        "_groupDisabled",
        "&:is(:where(.group, [data-group]):is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) *)",
    ),
    (
        "_groupExpanded",
        "&:is(:where(.group, [data-group]):is([aria-expanded=true], [data-expanded], [data-state=\"expanded\"]) *)",
    ),
    (
        "_groupFocus",
        "&:is(:where(.group, [data-group]):is(:focus, [data-focus]) *)",
    ),
    (
        "_groupFocusVisible",
        "&:is(:where(.group, [data-group]):is(:focus-visible, [data-focus-visible]) *)",
    ),
    (
        "_groupHover",
        "&:is(:where(.group, [data-group]):is(:hover, [data-hover]) *)",
    ),
    (
        "_groupInvalid",
        "&:is(:where(.group, [data-group]):is(:invalid, [data-invalid], [aria-invalid=true]) *)",
    ),
    ("_highContrast", "@media (forced-colors: active)"),
    ("_hover", HOVER),
    (
        "_indeterminate",
        "&:is(:indeterminate, [data-indeterminate], [aria-checked=mixed])",
    ),
    ("_invalid", INVALID),
    ("_landscape", "@media (orientation: landscape)"),
    ("_last", "&:last-child"),
    ("_lastOfType", "&:last-of-type"),
    ("_lessContrast", "@media (prefers-contrast: less)"),
    ("_light", "[data-panda-theme=light] &"),
    ("_loading", "&:is([data-loading], [aria-busy=true])"),
    ("_ltr", "[dir=ltr] &"),
    ("_marker", "&::marker"),
    ("_moreContrast", "@media (prefers-contrast: more)"),
    ("_motionReduce", "@media (prefers-reduced-motion: reduce)"),
    (
        "_motionSafe",
        "@media (prefers-reduced-motion: no-preference)",
    ),
    ("_odd", "&:nth-of-type(odd)"),
    ("_only", "&:only-child"),
    ("_onlyOfType", "&:only-of-type"),
    ("_open", "&:is([data-state=\"open\"], [data-open], [open])"),
    ("_optional", "&:optional"),
    ("_osDark", "@media (prefers-color-scheme: dark)"),
    ("_osLight", "@media (prefers-color-scheme: light)"),
    (
        "_peerActive",
        "&:is(:where(.peer, [data-peer]):is(:active, [data-active]) ~ *)",
    ),
    (
        "_peerChecked",
        "&:is(:where(.peer, [data-peer]):is(:checked, [data-checked], [aria-checked=true], [data-state=\"checked\"]) ~ *)",
    ),
    (
        "_peerDisabled",
        "&:is(:where(.peer, [data-peer]):is(:disabled, [disabled], [data-disabled], [aria-disabled=true]) ~ *)",
    ),
    (
        "_peerExpanded",
        "&:is(:where(.peer, [data-peer]):is([aria-expanded=true], [data-expanded], [data-state=\"expanded\"]) ~ *)",
    ),
    (
        "_peerFocus",
        "&:is(:where(.peer, [data-peer]):is(:focus, [data-focus]) ~ *)",
    ),
    (
        "_peerFocusVisible",
        "&:is(:where(.peer, [data-peer]):is(:focus-visible, [data-focus-visible]) ~ *)",
    ),
    (
        "_peerHover",
        "&:is(:where(.peer, [data-peer]):is(:hover, [data-hover]) ~ *)",
    ),
    (
        "_peerInvalid",
        "&:is(:where(.peer, [data-peer]):is(:invalid, [data-invalid], [aria-invalid=true]) ~ *)",
    ),
    ("_placeholder", "&::placeholder"),
    (
        "_placeholderShown",
        "&:is(:placeholder-shown, [data-placeholder-shown])",
    ),
    ("_portrait", "@media (orientation: portrait)"),
    ("_print", "@media print"),
    ("_readOnly", "&:is(:read-only, [data-read-only])"),
    ("_readWrite", "&:read-write"),
    ("_required", "&:required"),
    ("_rtl", "[dir=rtl] &"),
    (
        "_selected",
        "&:is([aria-selected=true], [data-selected], [data-state=\"selected\"])",
    ),
    ("_selection", "&::selection"),
    ("_target", "&:target"),
    ("_userInvalid", "&:is(:user-invalid, [data-user-invalid])"),
    ("_userValid", "&:is(:user-valid, [data-user-valid])"),
    ("_valid", "&:is(:valid, [data-valid])"),
    ("_visited", "&:visited"),
];
