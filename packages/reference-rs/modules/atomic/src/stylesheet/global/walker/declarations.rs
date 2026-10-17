//! Declaration lowering for the global walker: single declarations and each item of a list-valued declaration.
//! The value session lowers every value, and the resulting pairs land under the current selector and wrap stack.

use base_system::GlobalDeclarationValue;

use super::GlobalWalker;
use crate::stylesheet::global::value::{lower_declaration, ValueSession};

pub(super) struct ListItemContext<'a> {
    selector: &'a str,
    key: &'a str,
}

impl<'a> GlobalWalker<'a> {
    pub(super) fn handle_list(&mut self, selector: &str, key: &str, items: &[GlobalDeclarationValue]) {
        let ctx = ListItemContext { selector, key };
        for (idx, item) in items.iter().enumerate() {
            self.handle_list_item(&ctx, idx, item);
        }
    }

    pub(super) fn handle_list_item(
        &mut self,
        ctx: &ListItemContext<'_>,
        idx: usize,
        item: &GlobalDeclarationValue,
    ) {
        if matches!(item, GlobalDeclarationValue::Null) {
            return;
        }
        if idx == 0 {
            self.handle_declaration(ctx.selector, ctx.key, item);
            return;
        }
        let scale = self.system.breakpoints();
        let Some(bp_name) = scale.breakpoint_for_index(idx) else {
            return;
        };
        let Some(width) = scale.width_px(bp_name) else {
            return;
        };
        let media_query = format!("@media (min-width: {width}px)");
        self.wraps.push(media_query);
        self.handle_declaration(ctx.selector, ctx.key, item);
        self.wraps.pop();
    }

    pub(super) fn handle_declaration(&mut self, selector: &str, key: &str, val: &GlobalDeclarationValue) {
        let location = self.location();
        let mut session = ValueSession {
            system: self.system,
            diagnostics: self.diagnostics,
            location,
        };
        let decls = lower_declaration(key, val, &mut session);
        if decls.is_empty() {
            return;
        }
        let entry = self
            .rules
            .entry((self.wraps.clone(), selector.to_string()))
            .or_default();
        entry.extend(decls);
    }
}
