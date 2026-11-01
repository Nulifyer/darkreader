# Status

## Project state
Personal Chromium MV3 release 1.0.1 is published at
https://github.com/Nulifyer/darkreader/releases/tag/personal-v1.0.1.
Origin is https://github.com/Nulifyer/darkreader, upstream tracks Dark Reader.
Source is pushed to main and image-preservation. The release tag targets
507ce51b919b62ad39f8e2bbb2bb98c3b61fddbf.

## Current batch
Owner: primary agent. Completed source push, hosted release checks, publication,
and unauthenticated ZIP download verification as explicitly requested.

## In progress
No release work remains. The GitHub workflow creates drafts; publication is
manual. The published 1.0.1 ZIP records clean source and its matching tag.
An unpublished personal-v1.0.0 tag remains from initial CI checks. Hosted browser
tests use a CI-only sandbox override and explicitly await extension installation
after restart. No tag history was rewritten.

## Next action
Download the ZIP from the published release, extract to a permanent folder, and
load it unpacked. Future updates use a new personal version and tag, the manual
workflow, and the release review procedure in docs/GITHUB-RELEASES.md.

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
