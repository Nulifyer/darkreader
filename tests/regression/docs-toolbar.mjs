import assert from 'node:assert/strict';
import {mkdir, mkdtemp, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';

import {launch} from 'puppeteer-core';

// Controlled Google Docs DOM patterns, not a copy of a user's document. This
// checks actual composited pixels with the built extension and no Google login.
const executablePath = process.env.CHROME_BIN;
assert.ok(executablePath, 'Set CHROME_BIN to an extension-capable Chrome executable. Build with npm run build:personal first.');
const outputDir = path.resolve('build/audit/docs-toolbar');
await mkdir(outputDir, {recursive: true});
const profile = await mkdtemp(path.join(tmpdir(), 'darkreader-docs-toolbar-'));
const sprite = (color) => `data:image/svg+xml;base64,${Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path fill="${color}" d="M4 4h12v12H4z"/></svg>`).toString('base64')}`;
const gray = sprite('#444746');
const blue = sprite('#185abc');
const photo = sprite('#cc3344');
const fixture = `<!doctype html><html><head><style>
body {margin:0; padding:24px; background:#f8fafd; color:#1f1f1f; font:16px sans-serif;}
.toolbar {display:flex; align-items:center; gap:12px; padding:12px; background:#edf2fa;}
button {padding:8px; border:0; background:transparent; color:#444746;}
.selected {background:#d3e3fd; color:#185abc;}
.disabled {opacity:.38;}
.docs-icon, .docs-icon-img {display:block; width:20px; height:20px;}
.docs-icon-img {background-image:url("${gray}");}
.selected .docs-icon-img {background-image:url("${blue}");}
.content {margin-top:24px;}
.photo-background {width:20px; height:20px; background-image:url("${photo}");}
.kix-page {background:white; color:black; width:500px; height:160px;}
canvas {display:block; background:transparent;}
</style></head><body>
<div class="toolbar" role="toolbar" aria-label="Document formatting">
<button id="enabled" aria-label="Print"><span class="docs-icon"><span class="docs-icon-img"></span></span></button>
<button id="inline" aria-label="Link"><span class="docs-icon"><span class="docs-icon-img" style='background-image:url("${gray}")'></span></span></button>
<button id="parent" aria-label="Menu"><span class="docs-icon" style='background-image:url("${gray}")'></span></button>
<button id="selected" class="selected" aria-label="Bold" aria-pressed="true"><span class="docs-icon"><span class="docs-icon-img"></span></span></button>
<button id="disabled" class="disabled" aria-label="Undo" disabled><span class="docs-icon"><span class="docs-icon-img"></span></span></button>
<span id="heading">Heading 2</span><span id="size">16</span>
</div>
<div class="content"><img id="photo" src="${photo}" alt="Document image"><div class="photo-background"></div><div id="docs-editor"><div class="kix-page"><canvas width="300" height="100"></canvas><svg width="160" height="50"><rect id="document-vector" width="40" height="40" fill="#cc3344"/><image id="document-image" href="${photo}" x="60" width="40" height="40"/></svg></div></div></div>
<script>const context=document.querySelector('canvas').getContext('2d'); context.fillStyle='black'; context.fillRect(10,10,40,6); context.fillStyle='#cc3344'; context.fillRect(10,30,80,50);</script>
</body></html>`;

let browser;
const errors = [];
const results = [];
try {
    browser = await launch({executablePath, headless: false, pipe: true, enableExtensions: true, userDataDir: profile});
    const id = await browser.installExtension(path.resolve('build/release/chrome-mv3'));
    const page = await browser.newPage();
    await page.setViewport({width: 900, height: 500, deviceScaleFactor: 1});
    await page.setRequestInterception(true);
    page.on('request', (request) => request.isNavigationRequest() ? request.respond({status: 200, contentType: 'text/html', body: fixture}) : request.abort());
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto('https://docs.google.com/document/d/toolbar-fixture/edit');
    const popup = await browser.newPage();
    await popup.goto(`chrome-extension://${id}/ui/popup/index.html`);
    await popup.waitForSelector('.filter-settings');
    const settings = await popup.evaluate(async () => (await chrome.runtime.sendMessage({type: 'ui-bg-get-data'})).data.settings);
    const change = async (data) => popup.evaluate((data) => { chrome.runtime.sendMessage({type: 'ui-bg-change-settings', data}); }, data);
    const sample = async (name) => {
        await page.bringToFront();
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const screenshot = await page.screenshot({path: path.join(outputDir, `${name}.png`)});
        return await page.evaluate(async (base64) => {
            const image = new Image(); image.src = `data:image/png;base64,${base64}`; await image.decode();
            const canvas = new OffscreenCanvas(image.width, image.height);
            const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
            const pixel = (selector, dx = 0, dy = 0) => {
                const rect = document.querySelector(selector).getBoundingClientRect();
                return Array.from(context.getImageData(Math.floor(rect.x + rect.width / 2 + dx), Math.floor(rect.y + rect.height / 2 + dy), 1, 1).data).slice(0, 3);
            };
            return {
                enabled: pixel('#enabled .docs-icon-img'), inline: pixel('#inline .docs-icon-img'), parent: pixel('#parent .docs-icon'),
                selected: pixel('#selected .docs-icon-img'), disabled: pixel('#disabled .docs-icon-img'),
                background: pixel('#enabled', -15), selectedBackground: pixel('#selected', -15),
                photo: pixel('#photo'), photoBackground: pixel('.photo-background'),
                canvasPhoto: pixel('canvas', -100, 0), canvasText: pixel('canvas', -130, -37),
                paper: pixel('canvas', 0, 0), documentVector: pixel('#document-vector'), documentImage: pixel('#document-image'),
                selectedState: document.querySelector('#selected').getAttribute('aria-pressed'),
                disabledState: document.querySelector('#disabled').disabled,
                values: [document.querySelector('#heading').textContent, document.querySelector('#size').textContent],
                photoFilter: getComputedStyle(document.querySelector('#photo')).filter,
                photoURL: getComputedStyle(document.querySelector('.photo-background')).backgroundImage,
            };
        }, Buffer.from(screenshot).toString('base64'));
    };
    const luminance = (rgb) => rgb.map((v) => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
    const disabled = async () => {
        await change({enabled: false}); await page.bringToFront();
        await page.waitForFunction(() => !document.documentElement.hasAttribute('data-darkreader-mode'));
        return await sample('off');
    };
    const off = await disabled(); results.push({mode: 'off', ...off});
    for (const engine of ['default-preset', 'dynamicTheme', 'cssFilter', 'svgFilter', 'staticTheme']) {
        const mode = 'dynamic';
        await change({enabled: true, customThemes: engine === 'default-preset' ? settings.customThemes : [], presets: [], theme: {...settings.theme, engine: engine === 'default-preset' ? settings.theme.engine : engine, preserveImages: true}, syncSettings: false, detectDarkTheme: false});
        await page.bringToFront();
        await page.waitForFunction((expected) => document.documentElement.getAttribute('data-darkreader-mode') === expected, {}, mode === 'dynamic' ? 'dynamic' : 'filter');
        if (mode === 'dynamic') await page.waitForFunction(() => getComputedStyle(document.querySelector('#enabled .docs-icon')).filter !== 'none');
        const rendered = await sample(engine);
        results.push({savedEngine: engine, effectiveMode: mode, ...rendered});
        for (const key of ['enabled', 'inline', 'parent']) {
            assert.ok(contrast(rendered[key], rendered.background) >= 3, `${mode} ${key} glyph must remain distinguishable`);
        }
        assert.notDeepEqual(rendered.selectedBackground, rendered.background, `${mode} selected control retains its background`);
        assert.ok(contrast(rendered.selected, rendered.selectedBackground) >= 3, `${mode} selected glyph contrast`);
        assert.ok(contrast(rendered.disabled, rendered.background) < contrast(rendered.enabled, rendered.background), `${mode} disabled state stays visually dimmer`);
        assert.equal(rendered.selectedState, 'true'); assert.equal(rendered.disabledState, true);
        assert.deepEqual(rendered.values, off.values);
        for (const key of ['photo', 'photoBackground', 'canvasPhoto', 'canvasText', 'paper', 'documentVector', 'documentImage']) assert.deepEqual(rendered[key], off[key], `${engine} preserves ${key}`);
        assert.equal(rendered.photoFilter, 'none'); assert.ok(rendered.photoURL.includes(photo));
        const restored = await disabled();
        for (const key of ['enabled', 'inline', 'parent', 'selected', 'disabled', 'photo']) assert.deepEqual(restored[key], off[key], `${mode} restores ${key} when switched off`);
    }
    await change({enabled: true, customThemes: settings.customThemes, theme: {...settings.theme, preserveImages: false}, imagePreservationOverrides: [{host: 'docs.google.com', preserveImages: true}]});
    await page.bringToFront(); await page.waitForFunction(() => document.documentElement.dataset.darkreaderMode === 'dynamic');
    const sitePreserved = await sample('site-preserve');
    assert.deepEqual(sitePreserved.canvasPhoto, off.canvasPhoto);
    await change({imagePreservationOverrides: [{host: 'docs.google.com', preserveImages: false}]});
    await page.waitForFunction(() => document.documentElement.dataset.darkreaderMode === 'filter');
    await change({imagePreservationOverrides: [], theme: {...settings.theme, preserveImages: true}});
    await change({customThemes: [], theme: {...settings.theme, preserveImages: true, stylesheet: '.kix-page {background-color: rgb(250, 240, 220) !important}'}});
    await page.bringToFront();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.kix-page')).backgroundColor === 'rgb(250, 240, 220)');
    const userStyled = await sample('user-stylesheet');
    assert.deepEqual(userStyled.paper, [250, 240, 220], 'Explicit user CSS wins over personal Docs paper override');
    assert.deepEqual(userStyled.canvasPhoto, off.canvasPhoto);
    // Class names on unrelated websites must not activate the Docs exception.
    await disabled();
    await page.goto('https://unrelated.example/');
    await change({enabled: true, theme: {...settings.theme, engine: 'dynamicTheme', preserveImages: true}});
    await page.bringToFront(); await page.waitForFunction(() => document.documentElement.dataset.darkreaderMode === 'dynamic');
    assert.equal(await page.$eval('.docs-icon', (node) => getComputedStyle(node).filter), 'none');
    assert.deepEqual(errors, []);
    await writeFile(path.join(outputDir, 'results.json'), JSON.stringify({fixture: 'Controlled Docs DOM patterns; no signed-in editor access', results}, null, 2));
    console.log('PASS: Docs toolbar states and exact content pixels for IMG, CSS backgrounds, SVG images/vectors, transparent canvas text/photo/paper, all saved engines and default presets, per-site inheritance, on/off restoration, and site isolation.');
} finally {
    await browser?.close();
    await rm(profile, {recursive: true, force: true});
}
