# Personal Dark Reader build

This checkout is a personal fork of [Dark Reader](https://github.com/darkreader/darkreader).
The original MIT license and attribution remain in LICENSE. Origin points to
[Nulifyer/darkreader](https://github.com/Nulifyer/darkreader); upstream points to
the original repository.

For packages that need no build tools, see [GitHub installation](GITHUB-INSTALL.md).
For maintainers, see [the GitHub release process](GITHUB-RELEASES.md).

## Build

The build was verified with Node 26.12.0 and npm 12.2.1. `.node-version` records
the tested Node version. From the repository root:

```sh
npm ci
npm run build:personal
```

The unpacked extension is `build/release/chrome-mv3/`. The portable archive is
`build/release/darkreader-chrome-mv3.zip`. Use the unpacked directory to install
in Chrome, Brave, Edge, or another Chromium browser that supports developer mode.

## Install

1. Disable the store-installed Dark Reader to avoid running two copies together.
2. Open `chrome://extensions`, `brave://extensions`, or `edge://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select the full `build/release/chrome-mv3` directory.
5. Pin the extension, then reload the website you want to darken.

The unpacked copy has separate settings from the store extension. To transfer
settings, export them from the original extension and import them through
All settings > Advanced in the personal copy. Older settings
without the image option default to preservation.

After rebuilding, click **Reload** on the extension's card and refresh open
websites. Keep the unpacked folder in place. This copy does not receive store
updates automatically.

For development, `npm run dev:personal` watches the source and creates
`build/debug/chrome-mv3/`. Load that directory instead of the release directory.

## Image controls

The **Defaults** view contains **Keep image colors**. The
**This site** view contains the image-handling selector. The personal popup uses one layout regardless of old preview flags.

- **Keep original colors** is enabled on a new installation.
- **Default: keep original / adjust automatically** follows the global choice, including future changes.
- **Keep original** overrides the global choice for the current site.
- **Adjust automatically** restores upstream's image analysis and adjustment
  for that site. It does not force every image to invert.

Site rules apply to the exact host, including its port, across HTTP and HTTPS.
Subdomains have separate choices. Local files use their full pathname. The site
rule does not create or remove a custom brightness/contrast theme. Frames follow
the image policy of their containing browser tab. Both controls use the existing
settings storage, sync, and export/import paths.

Preservation keeps image URLs unchanged and disables automatic image inversion,
dimming, hiding, and replacement. This includes CSS background images, image
variables, inline backgrounds, embedded SVG images, shadow roots, and built-in
image inversion fixes. Ordinary page colors and inline vector fills/strokes
still adapt for readability. Bright image backgrounds remain bright, and dark
logos can be less readable against a dark page.

Known Google Docs control glyphs are an exception. Toolbar sprite icons and
header control icons adapt to the dark foreground so they remain readable.
This does not enable automatic adjustment for document photos, avatars, or
canvas content. Icon containers holding images, canvas, or video are excluded
from automatic glyph inversion.

## Rendering behavior and limits

All sites use **Dynamic** rendering while preserving images. Whole-page
CSS/SVG filters also affect arbitrary background images, so they cannot offer
the same preservation. The selected renderer stays saved and resumes when
automatic adjustment is allowed. The popup explains when Dynamic overrides it.

Google Docs keeps native document colors on light paper and darkens the
surrounding interface. Text and photos can share a canvas, so inverting the
canvas would invert both. Preservation takes priority, even when an old custom
preset selects Filter. This also preserves authored document text/highlight colors.
Office, SharePoint, and OneDrive likewise use Dynamic during preservation.
Their account-specific editor canvases have not been verified. Upstream Filter
presets resume only when automatic image adjustment is allowed.

Image-related `filter`, `background-image`, and image-resetting `background`
declarations in site-fix CSS are omitted during preservation. Known icon filters
remain, guarded against containers holding content media. Color-only
background fixes become `background-color` declarations. Other layout/color
fixes remain. Authored website filters and explicit user theme stylesheets
remain effective. Preservation does not freeze all inline SVG artwork, canvas
drawings, PDF documents, or arbitrary site-specific hiding/layout rules.

Chromium MV3 is the initial delivery target. Firefox and Safari installation
have not been verified for this fork.

## Palette and interface

**This site / Defaults > Color palette > Balanced** is the default. It retains upstream's neutral
page colors and layers while making colored surfaces darker and less saturated.
**Original** restores upstream's color transform. Use **This site** for a local appearance or **Defaults** for global changes.
Site edits create a local override automatically. **Reset** restores the inherited
appearance without changing shared rules, presets, or image choices. Image rules remain independent of these appearance snapshots.

Balanced also softens recognized Recharts SVG chart colors, including those on
Artificial Analysis. Chart marks retain their hues with restrained saturation,
readable value labels, visible neutral bars, and distinct patterned markers.
This adapts SVG paint rather than applying a saturation filter to page images.

Balanced also softens whole-page Filter/Filter+ contrast to 85% of the saved
contrast adjustment. The slider retains its saved value; Original uses the
unmodified value. Old settings without a palette acquire Balanced on reload.
No reset or reinstallation is needed.

Brightness and contrast are directly available. Click their values to reset.
Sepia, grayscale, fonts, and text stroke are under **Fine-tune appearance**.
**Settings** contains native-theme detection, system appearance, scheduling,
website rules, and rendering. The rendering scope follows the last appearance
view and is stated above its controls. **All settings** and **Developer tools**
are also in Settings. News, donation/upgrade prompts, mobile promotions, and promotional
install/uninstall pages are disabled. Attribution remains in About.
Every build clears any previously registered uninstall page when it starts.
Reload an older installed copy once before removing it to clear its stored URL.

See [the color audit](COLOR-AUDIT.md) for design references, upstream issue/PR
decisions, public-site measurements, verification, and limits. Public Google Docs
linked from upstream reports are tested alongside controlled pixel fixtures.
Private/account-specific editor UI remains unverified.

## Fix layers

Generated styles provide the base. Upstream known fixes follow. Personal site
overrides follow those fixes in `src/inject/dynamic-theme/site-overrides.ts`.
Explicit `theme.stylesheet` CSS is last. Normal CSS specificity and `!important`
still apply. Use `!important` for deliberate overrides of important site rules.
The fork sanitizes automatic image fixes before composition, while retaining
useful color/layout and guarded UI glyph fixes. Upstream configuration syncing
cannot remove the personal override layer. Native-dark detection runs first
and leaves detected native themes untouched unless the site is explicitly enabled.

## Checks

```sh
npm run test:unit -- --runInBand
npx tsc --noEmit -p src/tsconfig.json
npm run lint
CHROME_BIN=/path/to/chrome npm run test:inject -- --browsers ChromeHeadless
npm run test:chrome-mv3
npm run build:personal
CHROME_BIN=/path/to/chrome npm run test:personal:docs
CHROME_BIN=/path/to/chrome npm run test:personal:popup
CHROME_BIN=/path/to/chrome npm run test:personal:native
CHROME_BIN=/path/to/chrome npm run test:personal:sites
```

The extension test runner finds `google-chrome`, `google-chrome-stable`, or
`chromium` on PATH. Use an isolated Chrome-for-Testing installation if your
browser has first-run screens or blocks automated extension loading.

The personal Docs regression uses an isolated profile and an intercepted fixture
under a Docs URL. It checks composited icon pixels, selected/disabled states,
unchanged IMG/CSS/SVG/canvas/photo/text/paper pixels, on/off restoration, user
CSS precedence, and site isolation across every saved engine and the default
Docs preset. The native regression verifies theme handoff and stored image
overrides after browser restart. Both use controlled fixtures without accounts.

The live site matrix browses signed-out public pages with a frozen copy of the
actual unpacked release. It saves release hashes, off/on screenshots, mobile and
scrolled views, sampled DOM contrast, image/filter differences, and public Docs
paper pixels under `build/audit/site-matrix`. `SITE_FILTER` selects case IDs and
`AUDIT_OUTPUT` selects another directory. Authentication/consent/bot gates are
reported separately. The sampler is a diagnostic aid, not WCAG certification.

The popup regression opens the actual release in an isolated extension popup
window, rather than treating an extension tab as the active website. It checks
scope isolation, shared rules/presets, reset, image inheritance, paused editing,
automation, preferred rendering, keyboard tabs, native/protected states, long
hostnames, and 440 px desktop / 320 px mobile-fallback layouts. Evidence is in `build/audit/popup-redesign/`.

The desktop popup is 440 CSS pixels wide. Its document declares the intrinsic
width so browser popup sizing does not depend on the initial viewport. The
explicit mobile layout retains a narrower fallback.
