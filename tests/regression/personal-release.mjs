import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, readdir, rm, mkdir, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {launch} from 'puppeteer-core';

assert.ok(process.env.CHROME_BIN, 'Set CHROME_BIN to an extension-capable Chrome-for-Testing executable.');
const output = 'build/personal-release';
const config = JSON.parse(await readFile('personal-release.json', 'utf8'));
const filename = `darkreader-personal-${config.version}-chromium.zip`;
const zip = path.resolve(output, filename);
const checksum = createHash('sha256').update(await readFile(zip)).digest('hex');
assert.equal(await readFile(`${output}/SHA256SUMS`, 'utf8'), `${checksum}  ${filename}\n`);
const temporary = await mkdtemp(path.join(os.tmpdir(), 'darkreader-release-'));
const extension = path.join(temporary, 'extension');
const evidence = 'build/audit/github-release';
await mkdir(evidence, {recursive: true});
let browser;
try {
    // Exercise what a recipient downloads, rather than the original build directory.
    execFileSync('unzip', ['-q', zip, '-d', extension]);
    const manifest = JSON.parse(await readFile(path.join(extension, 'manifest.json'), 'utf8'));
    const metadata = JSON.parse(await readFile(path.join(extension, 'release.json'), 'utf8'));
    assert.equal(manifest.manifest_version, 3);
    assert.equal(manifest.name, config.name);
    assert.equal(manifest.version, config.version);
    assert.equal(manifest.update_url, undefined);
    assert.equal(metadata.automaticUpdates, false);
    assert.equal(await readFile(path.join(extension, 'LICENSE'), 'utf8'), await readFile('LICENSE', 'utf8'));
    assert.equal(await readFile(path.join(extension, 'INSTALL.md'), 'utf8'), await readFile('docs/GITHUB-INSTALL.md', 'utf8'));
    assert.deepEqual(metadata, JSON.parse(await readFile(`${output}/release.json`, 'utf8')));
    let fileCount = 0;
    async function compareFiles(relative = '') {
        for (const entry of await readdir(path.join(extension, relative), {withFileTypes: true})) {
            const file = path.join(relative, entry.name);
            if (entry.isDirectory()) {
                await compareFiles(file);
            } else {
                fileCount++;
                assert.deepEqual(await readFile(path.join(extension, file)), await readFile(path.join(output, 'extension', file)), file);
                if (!['manifest.json', 'LICENSE', 'INSTALL.md', 'release.json'].includes(file)) {
                    assert.deepEqual(await readFile(path.join(extension, file)), await readFile(path.join('build/release/chrome-mv3', file)), `Unchanged build asset: ${file}`);
                }
            }
        }
    }
    await compareFiles();
    for (const file of [manifest.background.service_worker, manifest.action.default_popup, ...Object.values(manifest.icons), ...manifest.content_scripts.flatMap((script) => script.js)]) {
        assert.ok((await readFile(path.join(extension, file))).length > 0, file);
    }
    browser = await launch({executablePath: process.env.CHROME_BIN, headless: false, pipe: true, enableExtensions: true, userDataDir: path.join(temporary, 'profile'), args: ['--no-sandbox']});
    const id = await browser.installExtension(extension);
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => request.isNavigationRequest() ? request.respond({status: 200, contentType: 'text/html', body: '<!doctype html><html><head><style>body {background: white; color: black;} img {width: 30px; height: 30px;}</style></head><body><p>Release installation fixture</p><img src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2230%22 height=%2230%22%3E%3Cpath fill=%22%23e58231%22 d=%22M0 0h30v30H0z%22/%3E%3C/svg%3E"></body></html>'}) : request.abort());
    await page.goto('https://personal-release.example/');
    await page.waitForFunction(() => document.documentElement.dataset.darkreaderMode === 'dynamic' && getComputedStyle(document.body).backgroundColor !== 'rgb(255, 255, 255)');
    assert.equal(await page.$eval('img', (image) => getComputedStyle(image).filter), 'none');
    const popup = await browser.newPage();
    await popup.goto(`chrome-extension://${id}/ui/popup/index.html`);
    await popup.waitForSelector('.filter-settings');
    const data = await popup.evaluate(async () => ({manifest: chrome.runtime.getManifest(), data: await chrome.runtime.sendMessage({type: 'ui-bg-get-data'})}));
    assert.equal(data.manifest.version, config.version);
    assert.equal(data.data.data.settings.theme.preserveImages, true);
    assert.equal(data.data.data.settings.theme.colorProfile, 'balanced');
    await writeFile(`${evidence}/results.json`, `${JSON.stringify({version: manifest.version, checksum, fileCount, metadata, installedExtensionId: id, dynamicTheme: true, imagesPreservedByDefault: true}, null, 2)}\n`);
    console.log(`Release ZIP verified: ${fileCount} files, version ${manifest.version}, fresh browser installation and image defaults passed.`);
} finally {
    await browser?.close();
    await rm(temporary, {recursive: true, force: true});
}
