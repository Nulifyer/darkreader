# Status

## Project state
Personal Chromium MV3 release 1.0.1 is published at
https://github.com/Nulifyer/darkreader/releases/tag/personal-v1.0.1.
Origin is https://github.com/Nulifyer/darkreader, upstream tracks Dark Reader.
Source is pushed to main and image-preservation. The release tag targets
507ce51b919b62ad39f8e2bbb2bb98c3b61fddbf.

## Current batch
Owner: primary agent. Fix the reported duplicated slider percentage and deliver
the correction through the established GitHub release process.

## In progress
Reproduced 5%5% after saving sepia in the actual 1.0.1 popup. Direct textContent
replacement detached Malevic's tracked text node. Adjustment now renders local
preview state through Malevic. Real popup checks passed all four sliders in both
scopes, repeated commits, resets, mouse/keyboard input, and a parent redraw during
an unsaved preview. Prepare 1.0.2. No engine or palette changes are included.

## Next action
Commit and push the slider fix, tag personal-v1.0.2, run the release workflow,
verify downloaded assets, and publish the corrected ZIP.

## Blockers
None for this personal Chromium delivery. Private Docs and signed-in Office
canvases remain outside verified coverage. Native themes retain their authored
contrast limitations documented in the earlier site audit.

## Verification
Hosted release workflow passed:
https://github.com/Nulifyer/darkreader/actions/runs/41354938126.
It verified 117 unit tests, lint, source TypeScript, ZIP installation, Docs,
popup, and native/restart behavior. Downloaded assets match all 91 local tagged
build files, source commit, and checksum. Unauthenticated public ZIP download
also passed. Evidence is in build/audit/github-download/ and
build/audit/github-release-v1.0.1-*.log. Earlier broad-site evidence remains in
build/audit/sites-final/. Local profiles were removed. Packaging did not change
the engine behavior or 440 px popup.
