# Personal Dark Reader fork

## Goal
Build Dark Reader locally for personal browser use and preserve images by default.
The user approved the proposed fork, TypeScript implementation, global/site
controls, and verification plan on 2026-11-01.

## Success conditions
- Upstream-linked GitHub fork and local checkout exist.
- Unmodified Chromium MV3 release builds before implementation.
- Images are preserved by default with independent per-site overrides.
- Use global follows future changes even on sites with custom themes.
- Settings persist and export/import; changes update open pages.
- Behavior tests and a Chromium MV3 release build pass.
- Installation and rendering limitations are documented.
- Research-based palette improvements and a simpler popup without promotions
  are delivered, with an Original palette option and a documented site audit.
- Preservation wins over every stored renderer, including editor presets.
- Generated colors, upstream fixes, personal overrides, and explicit user CSS
  compose in that order, with image policy enforced across automatic layers.
- Test the actual release across representative live sites and native themes.
- Keep the popup scope explicit, with local/global editing, reset, keyboard
  navigation, and verified narrow/native/protected/paused states.
- Prepare installation-ready GitHub ZIPs with manual updates and a draft-release
  workflow. Keep publication separate from local implementation.
- Provide a one-command Linux updater that downloads and verifies the latest ZIP,
  replaces the installed files, and keeps the browser's extension path stable.

## Scope
Images, CSS image URLs, embedded SVG images, automatic image analysis, and
inversion fixes. Retain storage conventions and useful upstream controls;
simplify the popup as authorized by the later color/UI audit request.

## Product boundaries
Personal Chromium MV3 first, as proposed and approved without another browser
selection. GitHub ZIP distribution is approved by the later publishing discussion.
Store publishing, Safari packaging, WASM, and signed automatic updates are excluded.
Inline vector icon colors continue adapting for readability.

## Architecture boundaries
Retain TypeScript/Malevic/Less. Resolve image policy before sending effective
themes to content scripts. Retain the selected renderer but use Dynamic on
all sites while preserving images. Keep Google Docs document colors on light
paper because photos and text share canvas pixels. Darken editor chrome.
Retain upstream compatibility engines when automatic adjustment is allowed.

## Phases
1. Fork, set up and verify the upstream build.
2. Implement settings, rendering and popup controls.
3. Test, build and document personal installation.
4. Research color systems and upstream reports, audit representative sites,
   improve palette/editor compatibility, simplify UI, and rebuild for reload.

5. Redesign the popup with explicit site/default scopes and progressive
   disclosure, retaining the generic engine and narrow site exceptions.

## Open planning questions
None blocking. The user may choose a different browser later.

## Color and UI audit expansion
The user requested deep research, review of upstream issues/PRs, correction of
Google Docs contrast, representative site audits, and a simpler popup without
marketing. Retain image controls and rebuild the same reloadable extension.
Audit WCAG contrast alongside surface hierarchy, subdued accents, focus states,
and image fidelity. Test signed-out public Docs linked in upstream reports as well as controlled
canvas fixtures. Private/account-specific documents remain outside test access.
The later user request requires proactive broad site testing and layered fixes.
