# Status

## Project state
Personal Chromium MV3 release 1.0.2 is published at
https://github.com/Nulifyer/darkreader/releases/tag/personal-v1.0.2.
Origin is https://github.com/Nulifyer/darkreader, upstream tracks Dark Reader.
Source is pushed to main and image-preservation. The release tag targets
ae30136a6180506ba38b0371a3746e7bd8d08703.

## Current batch
Owner: primary agent. Provide and publish a Linux helper for verified downloads
and updates in the user's existing extension directory.

## In progress
The helper is installed at ~/.local/bin/darkreader-update. It updated the existing
~/.local/chrome-extensions/nulifyer-darkreader root from 1.0.1 to 1.0.2 using the
real GitHub download. Ten updater tests, package copying, JavaScript lint, and
workflow validation passed. Prepare release 1.0.3 with a standalone helper asset.
The extension runtime is unchanged.

## Next action
Publish 1.0.3 with the helper, verify its public asset, run the installed command
again, and document the command and the remaining manual browser Reload step.

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
