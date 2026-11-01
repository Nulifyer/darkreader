import assert from 'node:assert/strict';
import {cp, mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {launch} from 'puppeteer-core';

// Public, signed-out browsing only. No sign-ins, document edits, purchases,
// form submissions, or changes to the user's normal browser profile.
const sites = [
    ['wikipedia', 'reference', 'https://en.wikipedia.org/wiki/Dark_mode'],
    ['hacker-news', 'legacy', 'https://news.ycombinator.com/'],
    ['arxiv', 'research', 'https://arxiv.org/'],
    ['craigslist', 'legacy', 'https://www.craigslist.org/about/sites'],
    ['github', 'native-theme', 'https://github.com/darkreader/darkreader'],
    ['mdn', 'native-theme', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript'],
    ['python', 'native-theme', 'https://docs.python.org/3/library/asyncio.html'],
    ['rust', 'native-theme', 'https://doc.rust-lang.org/book/'],
    ['chrome-docs', 'documentation', 'https://developer.chrome.com/docs/extensions'],
    ['stackoverflow', 'community', 'https://stackoverflow.com/questions'],
    ['math-stackexchange', 'community', 'https://math.stackexchange.com/'],
    ['youtube', 'native-theme', 'https://www.youtube.com/'],
    ['reddit', 'native-theme', 'https://www.reddit.com/r/programming/'],
    ['google', 'search', 'https://www.google.com/search?q=dark+reader'],
    ['duckduckgo', 'search', 'https://duckduckgo.com/?q=dark+reader'],
    ['commons', 'images', 'https://commons.wikimedia.org/wiki/Main_Page'],
    ['unsplash', 'images', 'https://unsplash.com/s/photos/landscape'],
    ['bbc', 'news', 'https://www.bbc.com/news'],
    ['npr', 'news', 'https://www.npr.org/'],
    ['amazon', 'commerce', 'https://www.amazon.com/'],
    ['openstreetmap', 'maps', 'https://www.openstreetmap.org/'],
    ['artificial-analysis', 'charts', 'https://artificialanalysis.ai/models'],
    ['pypi', 'packages', 'https://pypi.org/project/requests/'],
    ['caniuse', 'native-theme', 'https://caniuse.com/'],
    ['docs-public', 'editor', 'https://docs.google.com/document/d/1BAONkD_T-SNmlbNTDK2jAxlc1vEP2f13d_oPkJ8fnhs/edit'],
    ['docs-public-2', 'editor', 'https://docs.google.com/document/d/1_92TL0Sh8nEtpqivV5RaZU1SHunmP3fvJCh0gI5seqU/edit'],
    ['docs-public-image', 'editor', 'https://docs.google.com/document/d/1mPFvwqeS6NK2hb_7JKNusttIO5C9MlGyBntMA4qawRs/edit'],
    ['office', 'editor', 'https://www.office.com/'],
];
const cases = [...sites.map((site) => [...site, 1366, 'dark']), ...sites.filter(([id]) => ['wikipedia', 'artificial-analysis', 'pypi', 'github'].includes(id)).map(([id, category, url]) => [`${id}-mobile`, category, url, 390, 'dark']), ...sites.filter(([id]) => ['github', 'mdn', 'python', 'rust'].includes(id)).map(([id, category, url]) => [`${id}-light-os`, category, url, 1366, 'light'])];
const selected = cases.filter(([id]) => !process.env.SITE_FILTER || new RegExp(process.env.SITE_FILTER).test(id));
assert.ok(process.env.CHROME_BIN, 'Set CHROME_BIN and build with npm run build:personal first.');
const outputDir = path.resolve(process.env.AUDIT_OUTPUT || 'build/audit/site-matrix');
await mkdir(outputDir, {recursive: true});
const profile = await mkdtemp(path.join(tmpdir(), 'darkreader-site-matrix-'));
const extensionDir = path.join(profile, 'extension');
await cp(path.resolve('build/release/chrome-mv3'), extensionDir, {recursive: true});
const report = {
    method: 'Actual unpacked release; isolated signed-out Chrome; dark/light OS preferences; desktop/mobile; extension off/on; sampled visible DOM contrast and image resources/ancestor filters. Not accessibility certification or signed-in app coverage.',
    releaseSHA256: createHash('sha256').update(await readFile(path.join(extensionDir, 'background/index.js'))).digest('hex'),
    contentSHA256: createHash('sha256').update(await readFile(path.join(extensionDir, 'inject/index.js'))).digest('hex'),
    fixesSHA256: createHash('sha256').update(await readFile(path.join(extensionDir, 'config/dynamic-theme-fixes.config'))).digest('hex'),
    results: [],
};

function inspectPage() {
    const parse = (value) => {
        const match = value.match(/^rgba?\(([^)]+)\)/);
        if (!match) return null;
        const values = match[1].split(',').map(Number);
        return [values[0], values[1], values[2], values[3] ?? 1];
    };
    const over = (top, bottom) => {
        const a = top[3] + bottom[3] * (1 - top[3]);
        return [0, 1, 2].map((i) => (top[i] * top[3] + bottom[i] * bottom[3] * (1 - top[3])) / (a || 1)).concat(a);
    };
    const luminance = (rgb) => rgb.slice(0, 3).map((v) => {v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;}).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0);
    const background = (node) => {
        let color = [0, 0, 0, 0]; let unknown = false;
        for (let parent = node; parent && color[3] < .999; parent = parent.parentElement) {
            const style = getComputedStyle(parent);
            unknown ||= style.backgroundImage !== 'none' || +style.opacity < 1 || style.filter !== 'none';
            const parsed = parse(style.backgroundColor);
            if (!parsed) return null;
            color = over(color, parsed);
        }
        return unknown ? null : over(color, [255, 255, 255, 1]);
    };
    const visible = (node) => {
        const rect = node.getBoundingClientRect(); const style = getComputedStyle(node);
        return rect.width > 1 && rect.height > 1 && rect.left < innerWidth && rect.right > 0 && rect.top < innerHeight && rect.bottom > 0 && style.visibility === 'visible' && +style.opacity > 0 && style.clipPath === 'none' && style.clip === 'auto' && !node.closest('.sr-only,.sr_only,.visually-hidden,.visuallyHidden');
    };
    const issues = []; let samples = 0; let skipped = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let text;
    while ((text = walker.nextNode()) && samples < 300) {
        const node = text.parentElement;
        if (!node || !text.textContent.trim() || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.tagName) || !visible(node)) continue;
        const bg = background(node); const style = getComputedStyle(node); const fg = parse(style.color);
        if (!bg || !fg || fg[3] === 0 || parseFloat(style.fontSize) === 0 || parseFloat(style.textIndent) < -1000) {skipped++; continue;}
        const a = luminance(over(fg, bg)); const b = luminance(bg);
        const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
        const large = parseFloat(style.fontSize) >= 24 || (parseFloat(style.fontSize) >= 18.66 && +style.fontWeight >= 700);
        samples++;
        if (ratio < (large ? 3 : 4.5)) issues.push({text: text.textContent.trim().slice(0, 70), ratio, fg: style.color, bg, tag: node.tagName, class: node.getAttribute('class')?.slice(0, 160)});
    }
    const images = [];
    const filters = (node) => {
        const result = [];
        for (let parent = node; parent; parent = parent.parentElement) {
            const filter = getComputedStyle(parent).filter;
            if (filter !== 'none') result.push(filter);
        }
        return result;
    };
    for (const node of document.querySelectorAll('img,svg image,div,a,span,section,header,figure')) {
        if (images.length >= 100 || !visible(node)) continue;
        const style = getComputedStyle(node);
        const urls = node instanceof HTMLImageElement ? node.currentSrc || node.src : node instanceof SVGImageElement ? node.href.baseVal : (style.backgroundImage.match(/url\([^)]*\)/g) || []).join(' ');
        if (!urls) continue;
        images.push({tag: node.tagName, resource: urls, filters: filters(node), ui: !!node.closest('button,[role="button"],.docs-icon'), class: node.getAttribute('class')?.slice(0, 100)});
    }
    const rootStyle = getComputedStyle(document.documentElement);
        const nativeSignal = document.documentElement.classList.contains('dark') || document.documentElement.dataset.theme === 'dark' || document.documentElement.dataset.colorMode === 'dark' || rootStyle.colorScheme === 'dark' ;
    return {
        url: location.href, title: document.title, textLength: document.body.innerText.length, summary: document.body.innerText.slice(0, 500),
        mode: document.documentElement.dataset.darkreaderMode || null, nativeSignal,
        consentOverlay: Array.from(document.querySelectorAll('button,[role="button"]')).some((node) => visible(node) && /^(accept and continue|accept all cookies|accept all)$/i.test(node.textContent.trim())),
        root: {class: document.documentElement.className, theme: document.documentElement.dataset.theme, scheme: rootStyle.colorScheme},
        samples, skipped, belowThreshold: issues.length, issues: issues.slice(0, 20), images,
        editor: {pages: document.querySelectorAll('.kix-page, .kix-page-paginated').length, canvases: document.querySelectorAll('#docs-editor canvas').length},
    };
}

let browser;
try {
    browser = await launch({executablePath: process.env.CHROME_BIN, headless: false, pipe: true, enableExtensions: true, userDataDir: profile});
    const id = await browser.installExtension(extensionDir);
    const popup = await browser.newPage();
    await popup.goto(`chrome-extension://${id}/ui/popup/index.html`);
    await popup.waitForSelector('.filter-settings');
    const change = (data) => popup.evaluate((data) => {chrome.runtime.sendMessage({type: 'ui-bg-change-settings', data});}, data);
    await change({enabled: false, syncSettings: false, syncSitesFixes: false, detectDarkTheme: true});
    for (const [site, category, url, width, scheme] of selected) {
        const page = await browser.newPage();
        page.setDefaultTimeout(12000);
        await page.setViewport({width, height: 900});
        await page.emulateMediaFeatures([{name: 'prefers-color-scheme', value: scheme}]);
        const result = {site, category, requestedURL: url, width, scheme};
        try {
            await change({enabled: false});
            await page.bringToFront();
            const response = await page.goto(url, {waitUntil: 'domcontentloaded', timeout: 25000});
            result.httpStatus = response?.status();
            await page.waitForFunction(() => document.body?.innerText.length > 100, {timeout: 10000}).catch(() => {});
            if (category === 'editor' && url.startsWith('https://docs.google.com/')) await page.waitForSelector('.kix-page, .kix-page-paginated', {timeout: 12000});
            await page.evaluate(() => Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 3000))]));
            await new Promise((resolve) => setTimeout(resolve, 2500));
            result.off = await page.evaluate(inspectPage);
            let paper;
            let paperBefore;
            let paperClip;
            if (category === 'editor' && result.off.editor.pages > 0) {
                paper = await page.$('.kix-page, .kix-page-paginated');
                paperClip = await paper.evaluate((node) => {
                    const r = node.getBoundingClientRect();
                    return {x: r.x + 8, y: r.y + 8, width: r.width - 16, height: Math.min(r.height, innerHeight - r.y - 120) - 16};
                });
                paperBefore = await page.screenshot({clip: paperClip, path: path.join(outputDir, `${site}-paper-off.png`)});
                result.editorDOM = await page.evaluate(() => Array.from(document.querySelectorAll('.kix-page, .kix-page-paginated, .kix-canvas-tile-content, #docs-editor canvas')).slice(0, 10).map((node) => ({tag: node.tagName, class: node.className, parent: node.parentElement?.className, filter: getComputedStyle(node).filter, background: getComputedStyle(node).backgroundColor})));
            }
            const blocked = (result.httpStatus >= 400) || /accounts\.google\.|login\.microsoftonline\./.test(page.url()) || /just a moment|access denied|verify you are human|security verification|you need access|before you continue to google/i.test(result.off.title + result.off.summary);
            result.status = blocked ? 'blocked-or-access-gated' : 'inspected';
            await page.screenshot({path: path.join(outputDir, `${site}-off.png`)});
            if (!blocked) {
                await change({enabled: true});
                await page.bringToFront();
                await new Promise((resolve) => setTimeout(resolve, 3000));
                result.on = await page.evaluate(inspectPage);
                if (paper) {
                    const paperAfter = await page.screenshot({clip: paperClip, path: path.join(outputDir, `${site}-paper-on.png`)});
                    result.paperPixels = await page.evaluate(async (before, after) => {
                        const decode = async (data) => {const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode(); const canvas = new OffscreenCanvas(image.width, image.height); const context = canvas.getContext('2d'); context.drawImage(image, 0, 0); return {width: image.width, height: image.height, pixels: context.getImageData(0, 0, image.width, image.height).data};};
                        const a = await decode(before); const b = await decode(after);
                        if (a.width !== b.width || a.height !== b.height) return {sameSize: false};
                        let changed = 0; let total = 0; let maxDelta = 0; let minX = a.width; let minY = a.height; let maxX = 0; let maxY = 0;
                        // Ignore the thin page border, which belongs to editor chrome.
                        for (let y = 4; y < a.height - 4; y++) for (let x = 4; x < a.width - 4; x++) {
                            const i = (y * a.width + x) * 4;
                            const delta = Math.max(...[0, 1, 2].map((c) => Math.abs(a.pixels[i + c] - b.pixels[i + c])));
                            total++; if (delta > 2) {changed++; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);} maxDelta = Math.max(maxDelta, delta);
                        }
                        return {sameSize: true, width: a.width, height: a.height, total, changed, changedFraction: changed / total, maxDelta, changedBounds: changed ? {minX, minY, maxX, maxY} : null};
                    }, Buffer.from(paperBefore).toString('base64'), Buffer.from(paperAfter).toString('base64'));
                    await page.evaluate(() => window.scrollTo(0, 0));
                }
                await page.screenshot({path: path.join(outputDir, `${site}-on.png`)});
                const afterImages = [...result.on.images];
                result.imageChanges = result.off.images.filter((image) => !image.ui).flatMap((before) => {
                    const index = afterImages.findIndex((image) => image.tag === before.tag && image.resource === before.resource && image.class === before.class);
                    if (index < 0) return [{kind: 'resource-or-layout-changed', before}];
                    const [after] = afterImages.splice(index, 1);
                    return JSON.stringify(before.filters) === JSON.stringify(after.filters) ? [] : [{kind: 'filter-changed', before, after}];
                });
                if (category !== 'editor') {
                    await page.evaluate(() => {
                        const chart = document.querySelector('.recharts-wrapper');
                        chart ? chart.scrollIntoView({block: 'center'}) : window.scrollTo(0, Math.min(900, document.body.scrollHeight - innerHeight));
                    });
                    await new Promise((resolve) => setTimeout(resolve, 700));
                    result.scrolled = await page.evaluate(inspectPage);
                    await page.screenshot({path: path.join(outputDir, `${site}-scrolled.png`)});
                }
                result.nativeHandoff = result.off.nativeSignal ? result.on.mode === null : null;
            }
        } catch (error) {
            result.status = 'navigation-or-test-error'; result.error = String(error);
        }
        report.results.push(result);
        await writeFile(path.join(outputDir, 'results.json'), JSON.stringify(report, (key, value) => key === 'resource' && value.length > 1024 ? `${value.slice(0, 100)}…[sha256:${createHash('sha256').update(value).digest('hex')}]` : value, 2));
        console.log(JSON.stringify({site, status: result.status, mode: result.on?.mode, nativeHandoff: result.nativeHandoff, contrast: result.on?.belowThreshold, imageChanges: result.imageChanges?.length, error: result.error}));
        await page.close();
    }
    report.audit = {
        cases: report.results.length,
        inspected: report.results.filter((r) => r.status === 'inspected').length,
        gated: report.results.filter((r) => r.status === 'blocked-or-access-gated').length,
        errors: report.results.filter((r) => r.status === 'navigation-or-test-error').map((r) => r.site),
        imageFilterChanges: report.results.filter((r) => r.imageChanges?.some((change) => change.kind === 'filter-changed')).map((r) => r.site),
        nativeHandoffFailures: report.results.filter((r) => r.nativeHandoff === false).map((r) => r.site),
        paperFailures: report.results.filter((r) => r.paperPixels && (!r.paperPixels.sameSize || r.paperPixels.changedFraction > .005)).map((r) => r.site),
    };
    await writeFile(path.join(outputDir, 'results.json'), JSON.stringify(report, (key, value) => key === 'resource' && value.length > 1024 ? `${value.slice(0, 100)}…[sha256:${createHash('sha256').update(value).digest('hex')}]` : value, 2));
    console.log(JSON.stringify(report.audit));
    assert.deepEqual(report.audit.imageFilterChanges, [], 'Review changed content-image filters');
    assert.deepEqual(report.audit.nativeHandoffFailures, [], 'Review native dark themes receiving generated styles');
    assert.deepEqual(report.audit.paperFailures, [], 'Review changed Docs paper pixels');

} finally {
    await browser?.close();
    await rm(profile, {recursive: true, force: true});
}
