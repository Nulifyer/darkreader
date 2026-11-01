import {ThemeEngine} from '../../../src/generators/theme-engines';
import {timeout} from '../../support/test-utils';

const image = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle fill="black" cx="8" cy="8" r="7"/></svg>').toString('base64')}`;

beforeEach(async () => {
    const {settings} = await backgroundUtils.collectData();
    await backgroundUtils.changeSettings({
        theme: {...settings.theme, engine: ThemeEngine.dynamicTheme, preserveImages: true},
        imagePreservationOverrides: [],
        customThemes: [],
        presets: [],
        fetchNews: false,
        syncSettings: false,
    });
    await loadTestPage({'/': `<html><head><style>.image {background-image:url("${image}"); width:16px; height:16px;}</style></head><body><div class="image"></div></body></html>`});
    await popupUtils.click('#tab-defaults');
});

it('preserves images on a fresh page and changing the global popup checkbox updates live pages', async () => {
    await expectPageStyles(expect, ['.image', 'background-image', `url("${image}")`]);
    await popupUtils.click('.image-settings__global input');
    const {settings} = await backgroundUtils.collectData();
    expect(settings.theme.preserveImages).toBe(false);
    await timeout(300);
    expect(await pageUtils.evaluateScript(() => getComputedStyle(document.querySelector('.image')!).backgroundImage)).not.toContain(image);
    await popupUtils.click('.image-settings__global input');
    await expectPageStyles(expect, ['.image', 'background-image', `url("${image}")`]);
});

it('a site override wins over global settings and resetting follows later global changes', async () => {
    const {settings, activeTab} = await backgroundUtils.collectData();
    const host = new URL(activeTab.url).host;
    await backgroundUtils.changeSettings({
        theme: {...settings.theme, preserveImages: false},
        imagePreservationOverrides: [{host, preserveImages: true}],
    });
    await expectPageStyles(expect, ['.image', 'background-image', `url("${image}")`]);
    await backgroundUtils.changeSettings({imagePreservationOverrides: []});
    await timeout(300);
    expect(await pageUtils.evaluateScript(() => getComputedStyle(document.querySelector('.image')!).backgroundImage)).not.toContain(image);
    await backgroundUtils.changeSettings({theme: {...settings.theme, preserveImages: true}});
    await expectPageStyles(expect, ['.image', 'background-image', `url("${image}")`]);
});

it('uses Dynamic rendering for preservation and restores the saved filter engine when allowed', async () => {
    const {settings} = await backgroundUtils.collectData();
    await backgroundUtils.changeSettings({theme: {...settings.theme, engine: ThemeEngine.cssFilter}});
    expect(await pageUtils.evaluateScript(() => document.documentElement.getAttribute('data-darkreader-mode'))).toBe('dynamic');
    expect((await backgroundUtils.collectData()).settings.theme.engine).toBe(ThemeEngine.cssFilter);
    await popupUtils.exists('.image-settings__description');
    await backgroundUtils.changeSettings({theme: {...settings.theme, engine: ThemeEngine.cssFilter, preserveImages: false}});
    await timeout(300);
    expect(await pageUtils.evaluateScript(() => document.documentElement.getAttribute('data-darkreader-mode'))).toBe('filter');
});

it('follows the global image policy even with a custom site theme', async () => {
    const {settings, activeTab} = await backgroundUtils.collectData();
    await backgroundUtils.changeSettings({
        customThemes: [{url: [new URL(activeTab.url).host], theme: {...settings.theme, brightness: 85}}],
        theme: {...settings.theme, preserveImages: false},
    });
    await timeout(300);
    expect(await pageUtils.evaluateScript(() => getComputedStyle(document.querySelector('.image')!).backgroundImage)).not.toContain(image);
    await backgroundUtils.changeSettings({theme: {...settings.theme, preserveImages: true}});
    await expectPageStyles(expect, ['.image', 'background-image', `url("${image}")`]);
});

it('writes global and site choices to browser storage', async () => {
    const {settings, activeTab} = await backgroundUtils.collectData();
    const overrides = [{host: new URL(activeTab.url).host, preserveImages: true}];
    await backgroundUtils.changeSettings({theme: {...settings.theme, preserveImages: false}, imagePreservationOverrides: overrides});
    await timeout(1500);
    const stored = await backgroundUtils.getChromeStorage('local', ['theme', 'imagePreservationOverrides']);
    expect(stored.theme.preserveImages).toBe(false);
    expect(stored.imagePreservationOverrides).toEqual(overrides);
});
