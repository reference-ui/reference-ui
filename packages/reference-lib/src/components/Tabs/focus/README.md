# Tabs focus

Focus discovery and activation guards. The deep active-element lookup
starts from a scope's own root and descends through open shadow roots
so shadow-hosted tabs resolve their true holder. The editable guards
keep presses and clicks starting in nested inputs, selects, textareas,
or contenteditables from selecting the tab. Both pure over DOM nodes;
unit-tested.
