# Testing

## Evidence standard
Use upstream runners. Verify images through browser tests, not just CSS strings.
Cover inheritance, site isolation, old settings, malformed imports, live changes,
and persistence. Build the delivered release. Keep exact run evidence in build/.

## Fast checks
- `python3 -B -m unittest discover -s tests/updater -p '*_test.py' -v` covers
  first/repeat install, existing-path selection, stale-file removal, checksum and
  metadata failures, unrelated directories, ZIP paths/symlinks, and swap rollback.
- `npm run package:personal` creates a fresh versioned ZIP. Then
  `CHROME_BIN=/path/to/chrome npm run test:personal:release` verifies checksum,
  archive contents, original license, runtime installation, theme generation,
  and image-preservation defaults. `--check --tag=personal-vVERSION` on the
  package command also requires clean source at that tag.
- `npm run test:unit -- --runInBand`
- `npm run lint`
- `npx tsc --noEmit -p src/tsconfig.json`

## Full checks
- `npm run build -- --chrome-mv3`
- `CHROME_BIN=/path/to/chrome npm run test:inject -- --browsers ChromeHeadless`
- Chromium MV3 extension tests with an extension-capable browser executable.
- `CHROME_BIN=/path/to/chrome npm run test:personal:docs` after the release build.
- `CHROME_BIN=/path/to/chrome npm run test:personal:popup` for scoped popup
  interactions, native/protected/paused states, keyboard and narrow layouts.
- `CHROME_BIN=/path/to/chrome npm run test:personal:native` for native handoff
  and preservation settings after browser restart.
- `CHROME_BIN=/path/to/chrome npm run test:personal:sites` for live site audits.
  `SITE_FILTER` restricts case IDs. `AUDIT_OUTPUT` selects the artifact directory.
- `bun /home/nulifyer/.agents/skills/project-continuity/scripts/continuity.ts validate --project-root /home/nulifyer/Projects/DarkReaders`

## Environment
Linux, Node v26.12.0, npm 12.2.1, Bun 1.4.3. Use `npm ci` with the lockfile.
Chrome-for-Testing 156.0.8078.80 was downloaded for verification to
/tmp/darkreader-browser/chrome/linux-156.0.8078.80/chrome-linux64/chrome.
Brave Origin opens first-run UI on fresh profiles and was unsuitable for tests.
Use isolated profiles. Extension tests find google-chrome or chromium on PATH;
a temporary shim was used at /tmp/darkreader-test-bin/google-chrome.

Use isolated profiles and foreground fixture pages for pixel checks. The old
`build/audit/check-popup.mjs` assumed the superseded Docs Filter exception and
is historical evidence, not a current release gate.

Color audit method, public-site scope, raw artifact names, and upstream research
are documented in `docs/COLOR-AUDIT.md`. Preserve upstream exact-color fixtures
with the Original profile; test Balanced separately, including live profile
changes across stylesheet, inline, and legacy bgcolor paths.
The Docs regression checks composited glyph/control states, exact image/SVG/
canvas/text/paper pixels, all saved engines and default presets, site/global
inheritance, explicit user CSS precedence, on/off restoration, and site isolation.
Native regression checks class/data/meta/CSS/OS theme signals and browser restart.
The site matrix freezes the release in its own profile, records content/config
hashes, screenshots desktop/mobile and scrolled views, and distinguishes gates
from loaded pages. Google Docs pixel comparisons cover visible paper regions.
Inspect reported failures and screenshots; counts alone are not acceptance.
The popup runner uses a real Chrome popup window. An extension opened in a
normal browser tab can otherwise identify itself as the active website.
Popup evidence is under build/audit/popup-redesign/.

## Known gaps
Firefox and Safari are outside the initial target. Authored filters and explicit
user CSS can intentionally change images.
Public Docs linked from upstream issues are available. Private/account-specific
Docs UI remains unverified. Canvas text/images cannot be independently recolored
by a whole-page filter; preservation retains native document colors instead. Public-site contrast sampling is not a WCAG
certification and excludes image backgrounds and unmodeled compositing.
