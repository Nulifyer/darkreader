# Status

## Project state
Personal Chromium MV3 release 1.0.3 is published at
https://github.com/Nulifyer/darkreader/releases/tag/personal-v1.0.3.
Origin is https://github.com/Nulifyer/darkreader, upstream tracks Dark Reader.
Source is pushed to main and image-preservation. The release tag targets
6f30852f2ec3c6ebe4e48de5468250f2544f9c4d.

## Current batch
Owner: primary agent. Completed and published the Linux helper, installed it on
PATH, and updated the existing extension files using its public download.

## In progress
No updater work remains. The published helper is installed at
~/.local/bin/darkreader-update. It updated the existing
~/.local/chrome-extensions/nulifyer-darkreader root from 1.0.1 to 1.0.2 and then
1.0.3 using real GitHub downloads. The folder path is unchanged, and browser
profiles were not edited. The standalone helper asset matches committed source.

## Next action
Click Reload in the browser's extensions page, then refresh open websites.
For future updates run darkreader-update and repeat the manual Reload step.

## Blockers
None for this personal Chromium delivery. Private Docs and signed-in Office
canvases remain outside verified coverage. Native themes retain their authored
contrast limitations documented in the earlier site audit.

## Verification
Hosted release workflow passed:
https://github.com/Nulifyer/darkreader/actions/runs/41358380815.
It verified 117 unit tests, 10 updater tests, lint, source TypeScript, ZIP
installation, Docs, popup, and native/restart behavior. Downloaded assets match
all 91 local tagged build files, source metadata, and checksum. Public helper
download and live updates passed. Evidence is in build/audit/updater/.
Earlier slider and site evidence remains in build/audit/slider/ and
build/audit/sites-final/. Packaging did not change extension runtime behavior.
