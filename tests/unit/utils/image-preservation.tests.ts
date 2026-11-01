import {DEFAULT_SETTINGS, DEFAULT_THEME} from '../../../src/defaults';
import type {Theme, UserSettings} from '../../../src/definitions';
import {ThemeEngine} from '../../../src/generators/theme-engines';
import {preserveImagesInSiteFixes} from '../../../src/inject/dynamic-theme/image-preservation';
import {getImagePreservingTheme, getSiteImagePreservation, setSiteImagePreservation, shouldPreserveImages} from '../../../src/utils/image-preservation';
import {validateSettings, validateTheme} from '../../../src/utils/validation';

const url = 'https://example.com/article';
let settings: UserSettings;

beforeEach(() => settings = structuredClone(DEFAULT_SETTINGS));

test('old themes default to preserving images', () => {
    settings.theme = {brightness: 100} as Theme;
    expect(shouldPreserveImages(settings, url)).toBe(true);
    expect(validateTheme(settings.theme).errors).toEqual([]);
});

test('inherited image policy follows global changes despite a custom site theme', () => {
    settings.customThemes = [{url: ['example.com'], theme: {...DEFAULT_THEME, brightness: 85}}];
    const custom = settings.customThemes[0].theme;
    expect(getImagePreservingTheme(custom, settings, url).preserveImages).toBe(true);
    settings.theme.preserveImages = false;
    const resolved = getImagePreservingTheme(custom, settings, url);
    expect(resolved.preserveImages).toBe(false);
    expect(resolved.brightness).toBe(85);
    expect(custom.preserveImages).toBe(true);
});

test('site override wins in both directions and resetting restores inheritance', () => {
    settings.imagePreservationOverrides = setSiteImagePreservation(settings, url, false);
    expect(shouldPreserveImages(settings, url)).toBe(false);
    expect(shouldPreserveImages(settings, 'https://other.example/')).toBe(true);
    settings.theme.preserveImages = false;
    settings.imagePreservationOverrides = setSiteImagePreservation(settings, url, true);
    expect(shouldPreserveImages(settings, url)).toBe(true);
    settings.imagePreservationOverrides = setSiteImagePreservation(settings, url, null);
    expect(getSiteImagePreservation(settings, url)).toBeNull();
    expect(shouldPreserveImages(settings, url)).toBe(false);
    settings.theme.preserveImages = true;
    expect(shouldPreserveImages(settings, url)).toBe(true);
});

test('site overrides do not leak across subdomains or overwrite other sites', () => {
    settings.imagePreservationOverrides = setSiteImagePreservation(settings, url, false);
    settings.imagePreservationOverrides = setSiteImagePreservation(settings, 'https://sub.example.com/', true);
    expect(shouldPreserveImages(settings, 'http://example.com/other')).toBe(false);
    expect(shouldPreserveImages(settings, 'https://sub.example.com/')).toBe(true);
    settings.imagePreservationOverrides = setSiteImagePreservation(settings, 'https://sub.example.com/', null);
    expect(shouldPreserveImages(settings, url)).toBe(false);
    expect(settings.customThemes).toEqual(DEFAULT_SETTINGS.customThemes);
});

test.each(Object.values(ThemeEngine))('preservation uses Dynamic while retaining selected %s engine', (engine) => {
    const selected = {...DEFAULT_THEME, engine};
    expect(getImagePreservingTheme(selected, settings, url).engine).toBe(ThemeEngine.dynamicTheme);
    settings.theme.preserveImages = false;
    expect(getImagePreservingTheme(selected, settings, url).engine).toBe(engine);
    expect(selected.engine).toBe(engine);
});

test('image policy survives a validated JSON export/import round trip', () => {
    settings.theme.preserveImages = false;
    settings.imagePreservationOverrides = setSiteImagePreservation(settings, url, true);
    const imported = JSON.parse(JSON.stringify(settings));
    expect(validateSettings(imported).errors).toEqual([]);
    expect(shouldPreserveImages(imported, url)).toBe(true);
    expect(shouldPreserveImages(imported, 'https://elsewhere.example/')).toBe(false);
});

test('malformed imported image rules are rejected', () => {
    const imported = {
        theme: {...DEFAULT_THEME, preserveImages: 'yes'},
        imagePreservationOverrides: [null, {host: '', preserveImages: true}, {host: 'example.com', preserveImages: 'no'}, {host: 'valid.example', preserveImages: false}],
    };
    const {errors, settings: validated} = validateSettings(imported as any);
    expect(errors).toHaveLength(2);
    expect(validated.theme!.preserveImages).toBe(true);
    expect(validated.imagePreservationOverrides).toEqual([{host: 'valid.example', preserveImages: false}]);
});

test('site fix image transformations are omitted while nested color/layout fixes remain', () => {
    const css = preserveImagesInSiteFixes('@media screen { img { filter: invert(1); -webkit-filter: brightness(.8); background-image: none; color: red; width: 10px; } .icon { background: white; } }');
    expect(css).not.toMatch(/filter:|background-image:/);
    expect(css).toContain('@media screen');
    expect(css).toContain('color: red');
    expect(css).toContain('width: 10px');
    expect(css).toContain('background-color: white');
});
