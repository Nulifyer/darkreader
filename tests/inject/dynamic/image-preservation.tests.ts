import '../support/polyfills';
import {DEFAULT_THEME} from '../../../src/defaults';
import type {DynamicThemeFix} from '../../../src/definitions';
import {createOrUpdateDynamicTheme, removeDynamicTheme} from '../../../src/inject/dynamic-theme';
import {timeout} from '../support/test-utils';

const image = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle fill="black" cx="8" cy="8" r="7"/></svg>')}`;
const largeImage = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect fill="white" width="1024" height="1024"/></svg>')}`;

beforeEach(() => {
    document.body.innerHTML = '';
});

afterEach(() => {
    removeDynamicTheme();
    document.body.innerHTML = '';
    document.body.removeAttribute('style');
});

async function expectOriginalImage(element: Element, expectedURL: string, pseudo?: string) {
    const style = getComputedStyle(element, pseudo);
    expect(style.backgroundImage).toContain(expectedURL);
    expect(style.filter).toBe('none');
    const loaded = new Image();
    loaded.src = style.backgroundImage.match(/^url\("(.*)"\)$/)![1];
    await loaded.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const context = canvas.getContext('2d')!;
    context.drawImage(loaded, 0, 0, 16, 16);
    const center = context.getImageData(8, 8, 1, 1).data;
    expect(Array.from(center)).toEqual(expectedURL === largeImage ? [255, 255, 255, 255] : [0, 0, 0, 255]);
}

describe('Image preservation', () => {
    it('preserves image URLs in stylesheets, variables, pseudo-elements and inline styles by default', async () => {
        document.body.innerHTML = `
            <style>
                .image { background-image: url("${image}"); width: 16px; height: 16px; }
                .variable { --image: url("${image}"); background-image: var(--image); }
                .pseudo::before { content: ""; background-image: url("${image}"); }
            </style>
            <div class="image"></div><div class="variable"></div><div class="pseudo"></div>
            <div id="inline" style='background-image: url("${image}")'></div>`;
        createOrUpdateDynamicTheme(DEFAULT_THEME, null, false);
        await timeout(100);
        await expectOriginalImage(document.querySelector('.image')!, image);
        await expectOriginalImage(document.querySelector('.variable')!, image);
        await expectOriginalImage(document.querySelector('.pseudo')!, image, '::before');
        await expectOriginalImage(document.querySelector('#inline')!, image);
    });

    it('keeps large bright backgrounds, including body inline backgrounds', async () => {
        document.body.innerHTML = `<style>.bright { background-image: url("${largeImage}"); }</style><div class="bright"></div>`;
        document.body.style.backgroundImage = `url("${largeImage}")`;
        createOrUpdateDynamicTheme(DEFAULT_THEME, null, false);
        await timeout(100);
        await expectOriginalImage(document.querySelector('.bright')!, largeImage);
        await expectOriginalImage(document.body, largeImage);
    });

    it('overrides inversion and image replacement site fixes while retaining page and user filters', async () => {
        document.body.innerHTML = `<img src="${image}"><svg><image href="${image}"/></svg><div class="image" style='background-image:url("${image}")'></div><img class="authored" src="${image}" style="filter: opacity(.8)">`;
        const fixes = [{url: ['*'], invert: ['img', 'svg image', '.image'], css: 'img { filter: invert(1) !important; } .image { background-image: none !important; }'}] as DynamicThemeFix[];
        createOrUpdateDynamicTheme(DEFAULT_THEME, fixes, false);
        await timeout(100);
        expect(getComputedStyle(document.querySelector('img')!).filter).toBe('none');
        expect(getComputedStyle(document.querySelector('svg image')!).filter).toBe('none');
        expect(getComputedStyle(document.querySelector('.authored')!).filter).toBe('opacity(0.8)');
        await expectOriginalImage(document.querySelector('.image')!, image);
    });

    it('updates existing stylesheet and inline images when switching from automatic adjustment', async () => {
        document.body.innerHTML = `<style>.image { background-image:url("${image}"); width:16px; height:16px; }</style><div class="image"></div><div id="inline" style='background-image:url("${largeImage}")'></div>`;
        createOrUpdateDynamicTheme({...DEFAULT_THEME, preserveImages: false}, null, false);
        await timeout(300);
        const element = document.querySelector('.image')!;
        expect(getComputedStyle(element).backgroundImage).not.toContain(image);
        createOrUpdateDynamicTheme(DEFAULT_THEME, null, false);
        await timeout(100);
        await expectOriginalImage(element, image);
        await expectOriginalImage(document.querySelector('#inline')!, largeImage);
        createOrUpdateDynamicTheme({...DEFAULT_THEME, preserveImages: false}, null, false);
        await timeout(300);
        expect(getComputedStyle(element).backgroundImage).not.toContain(image);
    });

    it('preserves images and inversion fixes inside shadow roots', async () => {
        const host = document.createElement('div');
        document.body.append(host);
        const shadow = host.attachShadow({mode: 'open'});
        shadow.innerHTML = `<style>.image {background-image:url("${image}"); width:16px; height:16px;}</style><div class="image"></div><img src="${image}">`;
        createOrUpdateDynamicTheme(DEFAULT_THEME, [{url: ['*'], invert: ['img']}] as DynamicThemeFix[], false);
        await timeout(100);
        await expectOriginalImage(shadow.querySelector('.image')!, image);
        expect(getComputedStyle(shadow.querySelector('img')!).filter).toBe('none');
    });

    it('ignores pending image and SVG logo analysis after preservation is enabled', async () => {
        const pendingImage = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17"><circle fill="black" cx="8" cy="8" r="7"/></svg>')}`;
        document.body.innerHTML = `<div class="image" style='background-image:url("${pendingImage}")'></div><svg class="logo" width="17" height="17"><circle fill="black" cx="8" cy="8" r="7"/></svg>`;
        createOrUpdateDynamicTheme({...DEFAULT_THEME, preserveImages: false}, null, false);
        createOrUpdateDynamicTheme(DEFAULT_THEME, null, false);
        await timeout(300);
        expect(getComputedStyle(document.querySelector('.image')!).backgroundImage).toContain(pendingImage);
        expect(document.querySelector('svg')!.hasAttribute('data-darkreader-inline-invert')).toBe(false);
        expect(getComputedStyle(document.querySelector('svg')!).filter).toBe('none');
    });
    it('retains known glyph fixes but protects images inside icon containers', async () => {
        document.body.innerHTML = `<span class="glyph">+</span><span class="glyph content"><img src="${image}"></span>`;
        createOrUpdateDynamicTheme(DEFAULT_THEME, [{url: ['*'], invert: ['.glyph']}] as DynamicThemeFix[], false);
        await timeout(100);
        expect(getComputedStyle(document.querySelector('.glyph')!).filter).toContain('invert(1)');
        expect(getComputedStyle(document.querySelector('.content')!).filter).toBe('none');
    });

    it('applies known fixes after generated colors and explicit user CSS after site fixes', async () => {
        document.body.innerHTML = '<style>.text {color:black}</style><p class="text">Text</p>';
        const fixes = [{url: ['*'], css: '.text {color:red !important}'}] as DynamicThemeFix[];
        createOrUpdateDynamicTheme(DEFAULT_THEME, fixes, false);
        await timeout(100);
        expect(getComputedStyle(document.querySelector('.text')!).color).toBe('rgb(255, 0, 0)');
        createOrUpdateDynamicTheme({...DEFAULT_THEME, stylesheet: '.text {color:green !important}'}, fixes, false);
        await timeout(100);
        expect(getComputedStyle(document.querySelector('.text')!).color).toBe('rgb(0, 128, 0)');
    });
});
