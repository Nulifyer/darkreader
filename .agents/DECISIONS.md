# Decisions

## Binding decisions
- Fork the MIT-licensed public repository and retain attribution and upstream.
- Keep TypeScript; profile a real performance issue before considering WASM.
- Prefer generic color/image behavior. Add personal site exceptions only for
  observed failures with regression evidence. Reuse upstream compatibility work.
- Preserve images by default, including automatic dimming, hiding and replacement.
- Site choices: Use global, Preserve images, Allow automatic adjustment.
- Store site image rules independently of full custom theme snapshots.
- Preservation always uses Dynamic rendering, including stored editor presets.
  In Google Docs, preserve native document colors on light paper while
  darkening editor chrome. Retain the saved engine for automatic adjustment.
- Leave authored page filters and explicit user CSS alone. Continue recoloring
  inline vector icon fills/strokes; preserve embedded image resources.
- Known Docs sprite-backed UI glyphs may adapt for foreground readability even
  while content images are preserved. Keep the exception hostname-scoped;
  exclude document photos, avatars, and canvases. Maintain it independently of
  remotely synced upstream config.
- The user explicitly authorized committing and pushing all fork changes and
  running the GitHub workflow to provide a downloadable release ZIP. This
  supersedes the earlier local-only delivery boundary for this release.
- The user accepted GitHub release ZIPs with manual updates. Keep a separate fork
  version in personal-release.json and prepare drafts only through an explicit
  workflow dispatch. Publication remains manual. Signed CRX updates are deferred.
- The Linux helper uses Python's standard library, verifies release checksums and
  package metadata, and keeps an existing ~/.local/chrome-extensions/nulifyer-darkreader
  installation. New installations default under XDG_DATA_HOME/chrome-extensions.
  Chrome loads the manifest root, not background/. Browser Reload stays manual.
- The later user request authorizes a neutral popup with fewer borders and no
  promotions, replacing the initial instruction to retain the popup's style.
- The popup opens on This site, with explicit Defaults and Settings views.
  Local edits create an exact-host override without modifying shared rules or
  presets. Reset removes that override. Keep image rules independent.
- Balanced is the default palette; retain Original as an escape hatch. Keep
  neutral layers and separate color roles. Do not promise universal contrast.
- Recognized Recharts marks use a chart color role in Balanced dark mode.
  Keep their hues, patterned markers, data geometry, and embedded image URLs;
  do not apply a whole-page desaturation filter. SVG paint roles must write to
  fill/stroke/stop-color rather than HTML color/background/border properties.
- Compose generated styles, upstream known fixes, personal site overrides,
  then explicit user CSS. CSS specificity and !important still apply. Preserve
  image policy across automatic layers; explicit user CSS remains intentional.
- Retain upstream icon fixes conservatively. Exclude media selectors and icon
  containers holding images, canvas, or video. Keep content resources unchanged.
- Use upstream/source evidence, public Docs, controlled pixel fixtures, and
  actual release browsing. Do not claim private/signed-in app coverage.

## Open decisions
None blocking the initial personal Chromium MV3 build.

## Superseded decisions
The initial requirement to retain the original popup appearance was superseded
by the color/UI audit request. The later Filter exception for editors was
rejected by the user reporting renewed image inversion. Preservation takes
priority over making document paper dark.
