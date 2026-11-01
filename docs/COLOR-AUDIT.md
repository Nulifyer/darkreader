# Color and interface audit

Audited on 2026-11-01 against upstream commit
`f9e76b1676527461dd40ee58e61753105fa976d7` and this personal fork. The release is
Chromium MV3. This audit covers the personal fork's image-preservation work.

The current build uses generated colors, upstream known fixes, personal site
overrides, then explicit user CSS. Image preservation applies across automatic
layers. The broad release audit and current verification are described below.
Earlier narrow API measurements remain labeled separately.

The Docs Filter exception introduced during the initial audit was wrong for
the requested preservation policy. A whole-page filter inverts photos and text
together inside a canvas. Preservation now always uses Dynamic, keeps native
document colors on light paper, and darkens editor chrome.

## Design references and resulting choices

The extension already does more than invert RGB. Dynamic mode has separate
background, foreground, and border transforms; neutral background/text poles;
image analysis; and site fixes. Those distinctions should remain.

- [Material's dark-theme guidance](https://m2.material.io/design/color/dark-theme.html)
  supports dark gray surfaces, lighter elevated surfaces, and less saturated
  accents. Keep the existing neutral page layers and soften colored fills.
- [Material's color roles](https://m3.material.io/styles/color/the-color-system)
  distinguish surfaces and their content. Preserve separate text/background
  transforms rather than replacing them with one inversion matrix.
- [Carbon's color foundation](https://www.carbondesignsystem.com/building-blocks/foundations/color/overview)
  uses semantic roles and layered dark surfaces. Use neutral layers and spacing
  for the popup, reserving stronger color for selection, focus, and status.
- [Fluent's color system](https://fluent2.microsoft.design/color/) and
  [tokens](https://fluent2.microsoft.design/color-tokens) separate neutral,
  brand, and semantic colors. Avoid tinting the entire interface with one accent.
- [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
  supplies a measurable check: 4.5:1 for ordinary text and 3:1 for large text.
  [Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
  informs identifiable controls and focus states. Neither criterion requires a
  border around every group.

These references guide the design, not a claim that an automatic extension can
understand every site's semantic roles or certify its accessibility.

## Palette changes

**Balanced** is the default. **Original** retains upstream's color transform and
is available in Appearance > Palette, globally or within a site's appearance.
Old settings without this field acquire the Balanced default; stored brightness,
contrast, custom colors, image choices, and site rules remain.

Balanced retains upstream's neutral background/text poles (`#181a1b` and
`#e8e6e3`), neutral layer relationships, foreground generation, alpha, and Light
mode. For colored dark-mode backgrounds, it limits HSL saturation to 0.65 and
lightness to 0.24 after the upstream background transform. Existing neutral and
pale-blue neutral classifications are retained. This is a bounded heuristic,
not a contrast solver: HSL lightness is not perceptual luminance, and arbitrary
foreground/background combinations can still fail.

The concrete failure was Hacker News's orange navigation surface. Original
produced `#cc5200`, with its main links at about 3.53:1 against the light text.
Balanced produces a darker, less saturated orange without removing the site's
identity. Tests also cover primary text on red, yellow, green, cyan, blue, and
magenta, and preserve distinct neutral layers. These tests cover default
adjustments; extreme user adjustments can reduce contrast.

Color-profile changes invalidate the color and inline-string caches. Live
comparison exposed stale legacy `bgcolor` fallbacks after switching profiles;
the regression test now switches stylesheet, inline, and legacy colors together
in both directions.

CSS/SVG Filter engines operate on the whole composited page and have no
per-element color roles. Balanced applies a 0.85 multiplier to their effective
contrast, retaining the saved slider value. At the default settings, a controlled
white canvas with black text becomes approximately `#131313` with `#ececec`
text instead of pure black and white. Original removes this multiplier.

## Google Docs and upstream findings

Upstream defaults several canvas editors to Filter. That makes canvas text dark,
but also changes photos painted onto the same canvas. The earlier fork retained
that exception while claiming preservation, and the user correctly reported
renewed image inversion. Preservation now wins over every saved engine and
built-in editor preset. The saved engine resumes when automatic adjustment is
allowed. Google Docs keeps document paper and its authored colors light/native,
while toolbar, menus, and surrounding surfaces receive the dark theme.

Upstream already carries relevant editor compatibility work, including the
Google Docs Filter choice described in its
[changelog](https://github.com/darkreader/darkreader/blob/main/CHANGELOG.md).
The following reports and proposals informed the implementation:

| Upstream evidence | Decision for this fork |
| --- | --- |
| [#15017: Google Docs/Sheets Dynamic failures](https://github.com/darkreader/darkreader/issues/15017), open when reviewed; Filter recommended in discussion | Retain Filter only when automatic image adjustment is allowed. Preserve native canvas content when preservation is enabled. |
| [#8730: Docs image inversion](https://github.com/darkreader/darkreader/issues/8730) and [#14385: pasted images](https://github.com/darkreader/darkreader/issues/14385), open | Keep native document colors on light paper. Do not invert the shared canvas or adopt a brittle user-agent spoof. |
| [#7126: canvas text appearance](https://github.com/darkreader/darkreader/issues/7126), open | Separate pixel/text-rendering problems from palette generation. The softer filter is a preference, not a proven antialiasing fix. |
| [#7067: highlight contrast](https://github.com/darkreader/darkreader/issues/7067), open | Avoid blanket rules forcing text black; text may sit on unrelated backgrounds or inside SVG. Continue targeted fixes. |
| [#1317: pure-black backgrounds](https://github.com/darkreader/darkreader/issues/1317), closed | Retain comfortable gray page poles and distinct layers. |
| [PR #15559: Docs comment-counter glyphs](https://github.com/darkreader/darkreader/pull/15559), open | Defer: no signed-in DOM was available to validate these selectors or their selected states. |
| [PR #12697: disabled checkbox inversion](https://github.com/darkreader/darkreader/pull/12697), closed | Do not add a global control inversion rule. It can damage already styled controls. |
| [PR #16127: Codeberg checkboxes](https://github.com/darkreader/darkreader/pull/16127), merged | Already present upstream; no duplicate patch. |
| [PR #7628: Hacker News background tint](https://github.com/darkreader/darkreader/pull/7628), closed | Retain the existing neutral `#hnmain` site fix; correct the remaining colored header through the palette. |

[DocsAfterDark's documentation](https://github.com/chiyeon/DocsAfterDark) was
another reference for editor-specific behavior and image/canvas tradeoffs. No
code was copied from that GPL-licensed extension. Dark Reader's MIT attribution
and license remain.

Canvas text and embedded photos can share the same pixel surface. Independent
recoloring requires editor drawing semantics that a generic CSS filter does not
have. The fork therefore preserves the canvas, rather than recoloring its text
and compensating with another inversion. Docs page boundaries also exclude
inline SVG paint from automatic color modification. Authored document colors
can have low contrast themselves. Preservation intentionally retains those colors.

## Fix composition

`site-overrides.ts` owns personal site CSS, known UI glyphs, and inline content
boundaries. Generated styles provide the base. Sanitized upstream CSS follows,
then personal site CSS, then explicit `theme.stylesheet` CSS. Normal CSS
specificity and `!important` apply. These are ordered source layers, not CSS
`@layer` rules, whose reversed important ordering would complicate upstream fixes.
Personal fixes remain independent of downloaded upstream configurations.

Preservation removes automatic content inversion/replacement without discarding
upstream color and layout fixes. Upstream selectors describing icons, glyphs,
checkboxes, radio buttons, carets, and chevrons can retain foreground filters.
Selectors mentioning content media are excluded. Retained glyph filters also
exclude containers containing IMG, SVG image, canvas, or video descendants.
This is a conservative selector policy, not semantic recognition of every image.
Website-authored filters and explicit user CSS remain intentional.

PyPI and Wikipedia red string tokens were measured site failures. The personal Balanced
site override uses a muted red through the normal foreground palette, preserving
syntax roles and live theme adjustments. Original and Light mode retain their
usual transforms. This targets `.project-description` and `.mw-highlight` string tokens, rather
than changing every red foreground on the web. Rust documentation also receives
a bounded active-chapter blue override when its light theme is generated dark.
Its native dark theme remains untouched by the detector.

## Initial API palette audit

The signed-out pages below offered different structures: a multilingual portal,
a compact legacy table layout, a research archive, and a link directory. Their
tested pages lacked an active native dark appearance. This does not establish
that every page on these services lacks a dark-theme feature.

The comparison used the built Dark Reader API with the extension's matching
generic and site-specific Dynamic fixes, image preservation enabled, default
adjustments, and settled rendering. Each profile sampled up to 250 visible
direct-text elements per page. Alpha was composited through ancestor backgrounds;
elements with image backgrounds were skipped. Thresholds were 4.5:1 for ordinary
text and 3:1 for large text. Counts describe sampled elements, not entire pages.

| Page | Text samples per profile | Original below threshold | Balanced below threshold |
| --- | ---: | ---: | ---: |
| [Wikipedia portal](https://www.wikipedia.org/) | 129 | 0 | 0 |
| [Hacker News](https://news.ycombinator.com/) | 250 | 15 | 0 |
| [arXiv home](https://arxiv.org/) | 250 | 0 | 0 |
| [Craigslist site directory](https://www.craigslist.org/about/sites) | 250 | 0 | 0 |

Four Wikipedia image-background elements were excluded. The sampler does not
model canvas pixels, gradients, whole-page filters, every pseudo-element,
hover/focus/selection state, or every compositing effect. It is evidence for the
specific sampled change, not a WCAG certification. No site-specific hacks were
added merely to improve these counts.

Raw results, the sampling function, matched fixes, and before/after screenshots
are retained in ignored `build/audit/`: `site-audit.json`, `measure-text.js`,
`site-fixes.json`, and `hacker-news-{original,balanced}.png`.

## Popup and promotion cleanup

The popup now opens on This site. Defaults and Settings are separate views.
Changing a site appearance creates an exact-host override, including when the
starting appearance comes from a preset or a rule shared by several hosts.
Reset removes only that local override. It leaves shared rules, presets, global
appearance, and independent image rules intact. Defaults always edits the global
theme, regardless of the active site's custom theme.

The header separates global pause from the current site's toggle and describes
active, native-dark, off, and protected states. It remains possible to configure
defaults while paused or on a protected page. Theme and image choices are directly
available. Brightness/contrast values respond while dragging and can be clicked
to reset. Fine-tuning, fonts, scheduling, website rules, and rendering are disclosed
when needed. Developer tools remain under Settings. Tabs support arrow keys,
Home, and End. Native inputs, visible focus, and reduced-motion behavior remain.
Opaque charcoal surfaces and spacing replace unnecessary dividers.

The direction uses [Bitwarden's current-site focus](https://bitwarden.com/help/auto-fill-browser/)
and [progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/).
These are design references, not copied layouts. [Chrome's UI documentation](https://developer.chrome.com/docs/extensions/develop/ui)
provided the extension context. The implementation retains Malevic and Less.

Popup verification passed in the actual unpacked release: local/default scope
isolation, shared URL rules, presets, reset/inheritance, independent image rules,
paused editing, system/schedule controls, preferred renderer with preservation,
keyboard tabs, native-theme override, protected pages, long hostnames, and 440 pixel desktop / 320 pixel mobile-fallback widths. Ten layout captures had no horizontal overflow or footer overlap.
The popup opens in a real extension popup window for these checks. Its JS/CSS
and the content script hashes match the delivered files, and the archive matches
the unpacked directory. Evidence is in `build/audit/popup-redesign/`.

The check also exposed upstream mode-marker ownership: clearing a Filter/Static
stylesheet removed Dynamic's mode attribute before its color-only fast update.
The visual theme remained active, but its rendering marker disappeared. Filter
cleanup now leaves Dynamic's marker alone. A browser-injection regression covers
repeated updates and subsequent removal. Current checks passed 117 unit tests,
152 injection tests, 36 Chromium MV3 tests, TypeScript, lint, the release build,
and release popup/Docs/native-theme/restart regressions.

News, donation requests, the activation-code tab, mobile-product links, upgrade/anniversary prompts, and
install/uninstall landing pages are removed from the active product flows.
News fetching is disabled even for imported old settings, and any old news alarm
is cleared. About retains version, source links, and licensing. Upstream source
for unused alternate popup designs remains for maintainability, but the personal
popup no longer routes into those promotional designs.

## Release audit and verification

Current release evidence is recorded in `build/audit/sites-final/results.json`,
with off/on, scrolled, and mobile screenshots in the same directory. The
permanent runner is `tests/regression/site-matrix.mjs`. It freezes the unpacked
release into a disposable profile and records background/content/config hashes.
It uses actual extension settings and messages, rather than only the API build.

The manifest includes 28 public URLs across reference, legacy layouts, research,
community, native themes, search, images, news, commerce, maps, packages, charts,
and editors. Four mobile variants and four light-OS variants exercise additional
layouts and native theme choices. All browsing is signed out and read only.
Consent, bot, authentication, and navigation failures are reported separately. The BBC consent overlay is also a coverage restriction,
even when article content exists behind it.

For each loaded case, the runner compares extension off/on, samples visible DOM
text contrast, compares image resources and ancestor filters, and inspects a
second scrolled viewport. It skips transparent text and visually hidden labels.
Resource/layout changes are distinguished from filter changes because lazy
images, carousels, and duplicate sources can otherwise produce false alarms.
This does not certify every interaction, entire page, or accessibility criterion.
Canvas paint requires screenshot checks instead of DOM color sampling.

The final run completed all 36 cases: 34 loaded and two were access-gated.
Stack Overflow presented a security gate. Google Search presented consent.
BBC was inspected with its consent overlay present, so its article content and
interactions have reduced coverage. There were no navigation/test errors,
content-image filter changes, native-handoff failures, or paper-comparison failures.
The broad audit records the tested background, content-script, and fix-config
hashes. The later popup follow-up changes the UI and mode-marker cleanup. Its
separate release checks are recorded under `build/audit/popup-redesign/`. The
color transforms and site-fix layer are unchanged by that follow-up.

Generated-theme sampled text passed the configured thresholds in the tested
viewports after the targeted fixes. Rust's native theme retained seven sampled
contrast findings, and OpenStreetMap retained thirteen. Those themes were
unchanged by the extension. These remaining authored colors are not described
as fixed or fully accessible. Native recognition and source colors were also
checked with controlled fixtures instead of relying only on the sampler.

Final checks passed: 117 unit tests, 151 browser-injection tests, 36 Chromium MV3
extension tests, lint, TypeScript, release build, Docs pixel regression, seven
native-theme cases with browser restart, and old-uninstall-URL clearing. Logs use
`build/audit/matrix-*.log`, and the site runner log is `sites-final.log`.

Three public Docs linked in upstream issues load the actual editor:

- [Color test from #4986](https://docs.google.com/document/d/1BAONkD_T-SNmlbNTDK2jAxlc1vEP2f13d_oPkJ8fnhs/edit)
- [The July Index from #13244](https://docs.google.com/document/d/1_92TL0Sh8nEtpqivV5RaZU1SHunmP3fvJCh0gI5seqU/edit)
- [Image example from #816](https://docs.google.com/document/d/1mPFvwqeS6NK2hb_7JKNusttIO5C9MlGyBntMA4qawRs/edit)

The matrix compares visible paper regions, excluding surrounding chrome and
offscreen regions that Chrome does not paint. The photo example's 525,051
interior pixels and the July document's 540,033 pixels were exactly unchanged.
The color-test document changed 1,801 of 485,316 sampled pixels, confined to its
suggestion indicator and caret. No photo or paragraph recoloring was observed.
The runner flags paper changes above 0.5% for review. Controlled fixtures enforce
exact equality without that allowance. No document was edited, and no private
document or Google account was accessed. Account-specific toolbar/comment
states remain outside this public coverage.

Controlled release regressions supplement live browsing. The Docs runner checks
exact composited IMG, CSS background, SVG image/vector, canvas photo/text/paper
pixels, toolbar contrast and state, every saved engine/default preset, per-site
inheritance, user CSS precedence, off/on restoration, and host isolation. The
native-theme runner checks class/data/meta/CSS/OS handoff, light page generation,
and preservation settings after restarting Chrome with the same isolated profile.

Firefox/Safari, arbitrary websites, all interactions, and extreme custom color
combinations are outside this audit. Native themes retain authored contrast
limitations. Office's signed-in document canvases remain unverified.

The architecture remains TypeScript/Malevic/Less. The measured problems concern
rendering choices and color roles. There is no evidence that adding WASM would
solve them or justify its integration cost.

## Docs toolbar and canvas preservation

The user supplied off/on screenshots exposed sprite-backed toolbar icons that
stayed dark against the dark toolbar. Blanket preservation had suppressed
upstream UI glyph fixes along with document-image inversion. Known Docs UI
glyphs now retain their foreground adaptation. The hostname-scoped list excludes
document canvases, photos, avatars, and embedded content images, and remains
independent of downloaded configuration.

The production regression covers stylesheet, inline, and parent sprites. Enabled
and selected glyphs exceed 3:1 against their control backgrounds at the default
settings. Disabled controls remain dimmer. Pressed/disabled attributes and the
displayed formatting values remain unchanged. Switching off restores original
pixels. Document IMG, CSS background, SVG image/vector, transparent canvas text,
canvas photos, and paper retain exact original pixels across all saved engines
and the built-in Docs preset. Site overrides work against opposite global
choices, and explicit user CSS wins over the personal paper override.

`tests/regression/docs-toolbar.mjs` produces `build/audit/docs-toolbar/`.
The native-theme runner covers default dark handoff and persisted image choices
after a real browser restart. Live public Docs provide additional coverage,
including a photograph composited into a real editor canvas. Private account
features such as particular comment-counter states remain outside that coverage.

## Artificial Analysis chart follow-up

The user reported excessive saturation on
[the models page](https://artificialanalysis.ai/models). Inspection of the live
signed-out page found Recharts SVG bars retaining their original vivid fills
and cost labels retaining black fills against a dark plot.

The inline attribute handler used the chosen color role as the destination CSS
property. For example, an SVG `fill` using a background role was written as
`background-color`; its generated variable could then disappear during the next
observer pass. SVG `fill`, `stroke`, and `stop-color` now retain their actual
paint properties while their colors use the appropriate role. This fixes label
and grid adaptation as well as chart marks.

Balanced dark mode now gives recognized Recharts shapes a separate chart color
role. It retains source hues, caps HSL saturation at 0.55, and searches for a
luminance between the default plot visibility and light-label contrast bounds.
At the default poles and adjustments, tests cover opaque marks at 3:1 against
the neutral plot and light labels at 4.5:1 against the mark. Custom poles, alpha,
extreme adjustments, and arbitrary plot backgrounds can invalidate those bounds;
this is not an accessibility certification.

Neutral model bars become visible gray. Checkered pattern details receive a
darker shade of the chart color so normalization does not erase their texture.
Numeric values, bar geometry, opacity, and pattern references remain authored.
Chart variables have their own palette entries so live brightness/contrast
changes update them without confusing a chart mark with ordinary text or a page
background. Original and Light mode use their existing color transforms.

This adds no whole-page saturation filter. Image resources and embedded model
logos retain the existing preservation policy. The chart role currently
recognizes Recharts SVG markup, rather than guessing that every SVG is a chart.

The live comparison used the built API on the actual page with default Balanced
settings and image preservation. The first Intelligence, Speed, and Cost per
Task charts were inspected visually. Before/after screenshots and sampled paint
values are in `build/audit/artificial-analysis-{before,after}.png` and
`build/audit/artificial-analysis.json`. Additional tests cover the observed
source colors, SVG attribute persistence, live palette/brightness changes,
pattern references, and embedded-image URLs. The release was rebuilt and passed
the existing Docs control/image regression as well as the full applicable suites.
