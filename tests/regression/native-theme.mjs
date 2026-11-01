import assert from 'node:assert/strict';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {launch} from 'puppeteer-core';

// Actual release, intercepted public-shaped pages, isolated browser profile.
assert.ok(process.env.CHROME_BIN, 'Set CHROME_BIN and build the release first.');
const profile = await mkdtemp('/tmp/darkreader-native-theme-');
const output = path.resolve('build/audit/native-theme');
await mkdir(output, {recursive: true});
const options = {executablePath: process.env.CHROME_BIN, headless: false, pipe: true, enableExtensions: true, userDataDir: profile};
const photo = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="#cc3344"/></svg>').toString('base64');
let browser;
const results = [];
try {
    browser = await launch(options);
    const id = await browser.installExtension(path.resolve('build/release/chrome-mv3'));
    let popup = await browser.newPage();
    const openPopup = async () => {await popup.goto(`chrome-extension://${id}/ui/popup/index.html`); await popup.waitForSelector('.filter-settings');};
    await openPopup();
    const change = (data) => popup.evaluate((data) => {chrome.runtime.sendMessage({type: 'ui-bg-change-settings', data});}, data);
    const {settings} = await popup.evaluate(async () => (await chrome.runtime.sendMessage({type: 'ui-bg-get-data'})).data);
    await change({syncSettings: false, syncSitesFixes: false, detectDarkTheme: true, enabled: false});
    const page = await browser.newPage();
    await page.setViewport({width: 1000, height: 700});
    await page.setRequestInterception(true);
    let fixture;
    page.on('request', (request) => request.isNavigationRequest() ? request.respond({status: 200, contentType: 'text/html', body: fixture}) : request.abort());
    const snapshot = () => page.evaluate(() => ({background: getComputedStyle(document.body).backgroundColor, color: getComputedStyle(document.body).color, mode: document.documentElement.dataset.darkreaderMode || null, img: getComputedStyle(document.querySelector('img')).filter}));
    for (const [name, root, meta, css, scheme, expected] of [
        ['root-class', 'class="dark"', '', 'body{background:#16191c;color:#e5e7eb}', 'dark', null],
        ['root-data', 'data-theme="dark"', '', 'body{background:#16191c;color:#e5e7eb}', 'dark', null],
        ['meta-dark', '', '<meta name="color-scheme" content="dark">', 'body{background:#16191c;color:#e5e7eb}', 'dark', null],
        ['css-dark', '', '', 'html{color-scheme:dark}body{background:#16191c;color:#e5e7eb}', 'dark', null],
        ['auto-dark', '', '', 'body{background:white;color:black}@media(prefers-color-scheme:dark){body{background:#16191c;color:#e5e7eb}}', 'dark', null],
        ['auto-light', '', '', 'body{background:white;color:black}@media(prefers-color-scheme:dark){body{background:#16191c;color:#e5e7eb}}', 'light', 'dynamic'],
        ['light-meta', '', '<meta name="color-scheme" content="light">', 'body{background:white;color:black}', 'dark', 'dynamic'],
    ]) {
        await change({enabled: false});
        fixture = `<html ${root}><head>${meta}<style>body{margin:0;min-height:100vh;padding:30px;font:18px sans-serif}${css}</style></head><body><h1>Native theme fixture</h1><p>Readable text with original image colors.</p><img src="${photo}"></body></html>`;
        await page.emulateMediaFeatures([{name: 'prefers-color-scheme', value: scheme}]);
        await page.goto(`https://native-theme.example/${name}`, {waitUntil: 'load'});
        const off = await snapshot();
        await change({enabled: true}); await page.bringToFront();
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const on = await snapshot();
        assert.equal(on.mode, expected, name);
        assert.equal(on.img, 'none', name);
        if (expected === null) assert.deepEqual(on, off, `${name} native colors stay untouched`);
        else assert.notEqual(on.background, off.background, `${name} light page receives generated dark colors`);
        results.push({name, off, on});
    }
    // Pin a site's image choice, restart Chrome, and verify production storage
    // and rendering retain the override despite the opposite global setting.
    await change({theme: {...settings.theme, preserveImages: false, engine: 'cssFilter'}, imagePreservationOverrides: [{host: 'native-theme.example', preserveImages: true}]});
    await popup.waitForFunction(async () => (await chrome.storage.local.get('imagePreservationOverrides')).imagePreservationOverrides?.[0]?.preserveImages === true, {polling: 100, timeout: 10000});
    await browser.close();
    browser = await launch(options);
    // Await reinstallation explicitly before opening extension pages. The
    // launcher's array option can return while installation is still pending.
    const restoredId = await browser.installExtension(path.resolve('build/release/chrome-mv3'));
    assert.equal(restoredId, id, 'Restart keeps the same extension identity');
    popup = await browser.newPage(); await openPopup();
    const restored = await popup.evaluate(async () => (await chrome.runtime.sendMessage({type: 'ui-bg-get-data'})).data.settings);
    assert.equal(restored.theme.preserveImages, false);
    assert.deepEqual(restored.imagePreservationOverrides, [{host: 'native-theme.example', preserveImages: true}]);
    const reloaded = await browser.newPage();
    await reloaded.setRequestInterception(true);
    reloaded.on('request', (request) => request.isNavigationRequest() ? request.respond({status: 200, contentType: 'text/html', body: fixture}) : request.abort());
    await reloaded.goto('https://native-theme.example/light-meta');
    await reloaded.waitForFunction(() => document.documentElement.dataset.darkreaderMode === 'dynamic');
    assert.equal(await reloaded.$eval('img', (node) => getComputedStyle(node).filter), 'none');
    await writeFile(path.join(output, 'results.json'), JSON.stringify({results, restart: 'PASS: site preservation, opposite global setting, saved Filter engine retained'}, null, 2));
    console.log('PASS: native class/data/meta/CSS/OS dark handoff, light page generation, original images, and per-site preservation after browser restart.');
} finally {
    await browser?.close();
    await rm(profile, {recursive: true, force: true});
}
