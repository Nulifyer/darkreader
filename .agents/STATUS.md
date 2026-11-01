# Status

## Project state
Personal Chromium MV3 release is rebuilt and ready to reload. Origin is
https://github.com/Nulifyer/darkreader, upstream tracks Dark Reader. Branch is
image-preservation. The user now explicitly authorizes pushing all fork changes
and running GitHub release packaging so the ZIP can be downloaded.

## Current batch
Owner: primary agent. Commit and push the complete verified fork, run hosted
release checks, and publish the installation ZIP for download.

## In progress
Versioned packaging, an explicit draft-release workflow, installation/update
instructions, and an extracted-ZIP installation regression are complete locally.
The preview ZIP is build/personal-release/darkreader-personal-1.0.0-chromium.zip.
It records dirty source and no tag. GitHub Actions and remote publication have
not run. The original 440 px popup and existing development manifest are retained.

## Next action
Commit the reviewed fork, fast-forward origin/main and preserve the feature
branch, push the personal-v1.0.0 tag, dispatch the release workflow, resolve
hosted failures, and verify the downloadable release before handoff.

## Blockers
None for this personal Chromium delivery. Private Docs and signed-in Office
canvases remain outside verified coverage. Native themes retain their authored
contrast limitations documented in the earlier site audit.

## Verification
GitHub packaging evidence is under build/audit/github-release/ and
build/audit/github-release-*.log. All 117 unit tests, lint, source TypeScript,
actionlint, tag rejection checks, extracted-ZIP installation and 91-file archive
comparison, Docs, popup, and native/restart regressions passed. Disposable test
profiles were removed. Hosted CI remains unverified. Earlier broad-site evidence
is in build/audit/sites-final/. Engine behavior is unchanged by release packaging.
