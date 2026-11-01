import {DEFAULT_SETTINGS, DEFAULT_THEME} from '../../../src/defaults';
import type {Theme} from '../../../src/definitions';
import {ThemeEngine} from '../../../src/generators/theme-engines';
import {modifyBackgroundColor, modifyChartColor, modifyForegroundColor} from '../../../src/inject/dynamic-theme/modify-colors';
import {parseColorWithCache, rgbToHSL} from '../../../src/utils/color';
import {getImagePreservingTheme} from '../../../src/utils/image-preservation';

function luminance(color: string): number {
    const {r, g, b} = parseColorWithCache(color)!;
    return [r, g, b].map((x) => {
        const c = x / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i], 0);
}

function contrast(fg: string, bg: string) {
    const a = luminance(fg);
    const b = luminance(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('balanced fixes light text contrast on an orange navigation surface', () => {
    const orange = parseColorWithCache('#ff6600')!;
    const text = modifyForegroundColor(parseColorWithCache('black')!, DEFAULT_THEME, false);
    const classic = modifyBackgroundColor(orange, {...DEFAULT_THEME, colorProfile: 'classic'}, false);
    const balanced = modifyBackgroundColor(orange, DEFAULT_THEME, false);
    expect(contrast(text, classic)).toBeLessThan(4.5);
    expect(contrast(text, balanced)).toBeGreaterThanOrEqual(7);
});

test('balanced retains neutral surface layers, alpha, and user-selected background colors', () => {
    const theme = {...DEFAULT_THEME, darkSchemeBackgroundColor: '#202124'};
    const colors = ['white', '#f5f5f5', '#eeeeee'].map((value) => modifyBackgroundColor(parseColorWithCache(value)!, theme, false));
    expect(colors[0]).toBe('#202124');
    expect(new Set(colors).size).toBe(3);
    expect(luminance(colors[0])).toBeLessThan(luminance(colors[1]));
    expect(luminance(colors[1])).toBeLessThan(luminance(colors[2]));
    expect(modifyBackgroundColor({r: 255, g: 102, b: 0, a: 0.5}, theme, false)).toContain('0.5');
});

test.each(['#ff0000', '#ff6600', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'])('balanced colored surface %s supports primary text', (color) => {
    const bg = modifyBackgroundColor(parseColorWithCache(color)!, DEFAULT_THEME, false);
    const fg = modifyForegroundColor(parseColorWithCache('black')!, DEFAULT_THEME, false);
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
});

test('light mode and Original profile preserve upstream color generation', () => {
    const color = parseColorWithCache('#ff6600')!;
    const light: Theme = {...DEFAULT_THEME, mode: 0};
    expect(modifyBackgroundColor(color, light, false)).toBe(modifyBackgroundColor(color, {...light, colorProfile: 'classic'}, false));
    expect(modifyBackgroundColor(color, {...DEFAULT_THEME, colorProfile: 'classic'}, false)).toBe('#cc5200');
});

test.each(['#34a853', '#50c971', '#cc785c', '#1f1f1f', '#047afe', '#0089f4', '#736cd3', '#2243e6', '#1c7ff8', '#ff6900'])('balanced chart mark %s is restrained, visible on the plot, and supports light labels', (color) => {
    const mark = modifyChartColor(parseColorWithCache(color)!, DEFAULT_THEME, false);
    const bg = modifyBackgroundColor(parseColorWithCache('white')!, DEFAULT_THEME, false);
    const fg = modifyForegroundColor(parseColorWithCache('black')!, DEFAULT_THEME, false);
    expect(contrast(mark, bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(fg, mark)).toBeGreaterThanOrEqual(4.5);
    expect(rgbToHSL(parseColorWithCache(mark)!).s).toBeLessThanOrEqual(0.57);
    expect(modifyChartColor({...parseColorWithCache(color)!, a: 0.5}, DEFAULT_THEME, false)).toContain('0.5');
});

test.each(['https://docs.google.com/document/d/fixture/edit', 'https://docs.google.com/spreadsheets/d/fixture/edit', 'https://tenant.sharepoint.com/'])('image preservation takes precedence over compatibility renderers on %s', (url) => {
    const selected = {...DEFAULT_THEME, engine: ThemeEngine.cssFilter};
    const effective = getImagePreservingTheme(selected, DEFAULT_SETTINGS, url);
    expect(effective.engine).toBe(ThemeEngine.dynamicTheme);
    expect(effective.preserveImages).toBe(true);
    expect(effective.contrast).toBe(100);
    expect(selected.contrast).toBe(100);
    expect(getImagePreservingTheme({...selected, colorProfile: 'classic'}, DEFAULT_SETTINGS, url).contrast).toBe(100);
    expect(getImagePreservingTheme(selected, {...DEFAULT_SETTINGS, theme: {...DEFAULT_THEME, preserveImages: false}}, url).engine).toBe(ThemeEngine.cssFilter);
});
