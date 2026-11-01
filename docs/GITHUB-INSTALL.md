# Install Dark Reader Personal

This is Nulifyer's personal fork of Dark Reader. Images keep their original
colors by default. This package is for desktop Chromium browsers that support
loading unpacked extensions. No build tools are needed.

## Linux download helper

The helper requires Python 3.9 or newer. Install it once:

```sh
mkdir -p "$HOME/.local/bin"
curl -fL https://github.com/Nulifyer/darkreader/releases/latest/download/update-darkreader.py -o "$HOME/.local/bin/darkreader-update"
chmod +x "$HOME/.local/bin/darkreader-update"
"$HOME/.local/bin/darkreader-update"
```

Run `~/.local/bin/darkreader-update` whenever you want the latest release.
It downloads the ZIP and checksum, verifies the package, and replaces the old
files. Failed validation leaves the current installation intact. A failed
directory swap restores the previous files. The helper uses a lock to prevent
two simultaneous updates.

If `~/.local/chrome-extensions/nulifyer-darkreader` already exists, the helper
keeps that path. Otherwise it uses
`${XDG_DATA_HOME:-$HOME/.local/share}/chrome-extensions/nulifyer-darkreader`.
To use another existing installation:

```sh
~/.local/bin/darkreader-update --directory /path/to/installed-extension
```

Choose the folder containing `manifest.json`, rather than its `background`
subfolder. After updating, click **Reload** on the extensions page and refresh
your websites. The helper does not edit your browser profile or reload Chrome.
For a first installation, use **Load unpacked** with the printed path.

## First installation

1. Download `darkreader-personal-VERSION-chromium.zip` from
   [this fork's Releases](https://github.com/Nulifyer/darkreader/releases).
   Choose the extension ZIP, rather than GitHub's generated source-code archive.
2. Extract the ZIP into a permanent folder, such as `Extensions/darkreader-personal`.
   Select the folder containing `manifest.json` when installing.
3. Disable any other Dark Reader copy to avoid running two copies together.
4. Open `brave://extensions` or `chrome://extensions`.
5. Enable **Developer mode**, select **Load unpacked**, and choose that folder.
6. Pin the extension and refresh the websites you want to darken.

Keep the extracted folder in place. The browser uses its files directly.
Developer mode must remain enabled.

## Update

1. Export a settings backup through **Settings > All settings > Advanced**.
2. Download and extract the new release to a temporary folder.
3. Replace the contents of the installed folder with the new files. Remove old
   files first so files removed by the new version do not remain.
4. Keep the installed folder's exact path. Do not uninstall the extension.
5. Click **Reload** on its extensions-page card, then refresh open websites.

Keeping the same folder and installed entry preserves settings. Loading another
folder can create a separate extension with separate settings. To switch from
another copy or folder, export settings there and import them in the new copy.
Browser sync does not install this package on another machine automatically.

## Verify the download

Each release includes `SHA256SUMS`. On Linux, place it beside the ZIP and run:

```sh
sha256sum --check SHA256SUMS
```

The checksum detects a damaged or changed download. It is not a publisher
signature. `release.json` records the fork version, upstream version, source
commit, and whether the package includes uncommitted local changes.

## Update limitations

This ZIP does not update itself. Run the helper or check GitHub Releases for newer versions.
It requires no Chrome Web Store account or approval. Signed CRX packages and
Linux automatic updates are separate future work and are not included here.

The original MIT license is included as `LICENSE`. This fork is independent of
the official Dark Reader releases.
