# GitHub releases

Distribute this fork through GitHub Releases as installation-ready Chromium
MV3 ZIPs. Users install through Developer mode and update the same folder.
See [installation and updates](GITHUB-INSTALL.md). No store submission is involved.

## Local preview

```sh
npm ci
npm run package:personal
CHROME_BIN=/path/to/chrome-for-testing npm run test:personal:release
```

The package command always builds fresh source. Output is under
`build/personal-release/`:

- `darkreader-personal-1.0.0-chromium.zip`, with `manifest.json` at its root.
- `SHA256SUMS`, the ZIP's SHA-256 checksum.
- `INSTALL.md`, recipient instructions, also inside the ZIP.
- `release.json`, source and version information, also inside the ZIP.
- `extension/`, the unpacked package for inspection.

The ZIP includes the original MIT license. Local builds with uncommitted work
are marked `dirty: true` and have no release tag in their metadata. They are
previews, not traceable tagged releases. Packaging never commits, tags, pushes,
or publishes anything. `build/release/chrome-mv3/` retains its normal upstream
manifest so the existing development installation is unaffected.

## Versioning

`personal-release.json` owns this fork's release name and version. The first
version is `1.0.0`, under the descriptive name **Dark Reader Personal**. Each
release must increase the version. Keep each of its three numeric components
between 0 and 65535. The tag must be exactly `personal-vVERSION`.

The package manifest uses the fork version and records the upstream version in
`version_name`. Source manifests and `package.json` keep upstream versioning to
reduce merge conflicts. The ZIP includes no store update URL, CRX signing key,
or automatic updater. Retain the upstream icons and MIT attribution for this
personal distribution. Any later public branding should be a separate decision.

## Prepare a GitHub draft

The workflow is `.github/workflows/personal-release.yml`, named **Prepare
personal GitHub release**. It runs only when explicitly dispatched. It must be
available on the repository's default branch before GitHub exposes its manual
trigger. It builds an existing tag and creates a draft, never a public release.
The inherited upstream release job is restricted to the upstream repository.

1. Review the fork changes and set the next version in `personal-release.json`.
2. Run the [project checks](PERSONAL-BUILD.md#checks), including the broad site
   audit. Inspect gated pages and contrast/image findings before approving a release.
3. Commit and push the reviewed source when ready to release. Create and push
   an annotated `personal-vVERSION` tag at that exact commit.
4. In this fork's GitHub Actions, select **Prepare personal GitHub release**,
   choose **Run workflow**, and enter the exact tag.
5. The workflow validates the tag against the configured version and clean
   source, runs lint, TypeScript, and unit checks, then builds the package.
   It installs the ZIP in an isolated browser and runs the release Docs, popup,
   and native-theme regressions. The package assets then enter a draft release.
6. Download the draft ZIP, install it, and check its source/version metadata.
   Edit the draft description to include actual changes and known limitations
   alongside the installation instructions. Publish the draft manually.

The workflow uses GitHub's built-in token. No personal access token is needed.
The build job has read-only repository access. Only the draft job has release
write access. It refuses mismatched tags or dirty source and fails rather than
overwriting an existing release for the same tag. A failing build does not reach
draft creation. Public-site auditing remains a deliberate pre-release check because live
sites can require authentication or block automation.

The release workflow has to run on GitHub before its hosted behavior is verified.
Local checks establish package contents and browser installation, not hosted CI.
Linux signed CRX distribution and automatic updates are deferred until a full
installation/update cycle is verified in the target browser.
