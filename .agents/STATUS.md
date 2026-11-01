# Status

## Project state
Personal Chromium MV3 release 1.0.2 is published at
https://github.com/Nulifyer/darkreader/releases/tag/personal-v1.0.2.
Origin is https://github.com/Nulifyer/darkreader, upstream tracks Dark Reader.
Source is pushed to main and image-preservation. The release tag targets
ae30136a6180506ba38b0371a3746e7bd8d08703.

## Current batch
Owner: primary agent. Completed the slider percentage fix and published the
verified correction through the established GitHub release process.

## In progress
Reproduced 5%5% after saving sepia in the actual 1.0.1 popup. Direct textContent
replacement detached Malevic's tracked text node. Adjustment now renders local
preview state through Malevic. Real popup checks passed all four sliders in both
scopes, repeated commits, resets, mouse/keyboard input, and a parent redraw during
an unsaved preview. Hosted release checks passed and 1.0.2 is published. No engine
or palette changes are included. Evidence is under build/audit/slider/.

## Next action
Download 1.0.2, replace the contents of the installed folder without moving it,
and reload the extension. Refresh open websites. No slider work remains.

## Blockers
None for this personal Chromium delivery. Private Docs and signed-in Office
canvases remain outside verified coverage. Native themes retain their authored
contrast limitations documented in the earlier site audit.

## Verification
Hosted release workflow passed:
https://github.com/Nulifyer/darkreader/actions/runs/41356979088.
It verified 117 unit tests, lint, source TypeScript, ZIP installation, Docs,
popup, and native/restart behavior. Downloaded assets match all 91 local tagged
build files, source commit, and checksum. Unauthenticated public ZIP download
also passed. Evidence is in build/audit/slider/download/ and
build/audit/slider/hosted.log. Earlier broad-site evidence remains in
build/audit/sites-final/. Local profiles were removed. Packaging did not change
the engine behavior or 440 px popup.
