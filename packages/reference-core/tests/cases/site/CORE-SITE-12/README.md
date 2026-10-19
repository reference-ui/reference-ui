# CORE-SITE-12 — unlisted `<Random>` and lowercase `<div color>` are not hosts

The world renders an unlisted `<Random fontSize>` and a lowercase `<div
color>` beside a `<Div mt>` control. The spec checks neither probe carries a
class, neither paints, and the lowercase `color` mints no rule. `Random` is
no host either, but it is a component nobody traces, so its `fontSize` lowers
under own (styling plan S3): the sheet carries that rule, which nothing
mints, beside the control utility.

Evidence: ATM-SITE-08; anti-goal in Panda v1 output tests.

> Search terms: unknown element, intrinsic, unregistered, negative case, site/jsx-hosts, CORE-SITE-11
