import '../support/polyfills';
import {DEFAULT_THEME} from '../../../src/defaults';
import type {DynamicThemeFix} from '../../../src/definitions';
import {createOrUpdateDynamicTheme, removeDynamicTheme} from '../../../src/inject/dynamic-theme';
import {timeout} from '../support/test-utils';

afterEach(() => {
    removeDynamicTheme();
    document.body.innerHTML = '';
});

it('writes SVG presentation attributes to their paint properties and retains them across observer passes', async () => {
    document.body.innerHTML = '<svg width="300" height="100"><defs><linearGradient id="gradient"><stop stop-color="red"/></linearGradient></defs><rect width="100" height="60" fill="red"/><text fill="black" x="0" y="80">Label</text><line x1="0" y1="90" x2="200" y2="90" stroke="black"/></svg>';
    createOrUpdateDynamicTheme(DEFAULT_THEME, null, false);
    await timeout(100);
    const rect = document.querySelector('rect')!;
    const text = document.querySelector('text')!;
    const line = document.querySelector('line')!;
    const stop = document.querySelector('stop')!;
    expect(rect.hasAttribute('data-darkreader-inline-fill')).toBe(true);
    expect(text.hasAttribute('data-darkreader-inline-fill')).toBe(true);
    expect(line.hasAttribute('data-darkreader-inline-stroke')).toBe(true);
    expect(stop.hasAttribute('data-darkreader-inline-stopcolor')).toBe(true);
    const fill = getComputedStyle(rect).fill;
    expect(fill).not.toBe('rgb(255, 0, 0)');
    expect(getComputedStyle(text).fill).not.toBe('rgb(0, 0, 0)');
    expect(getComputedStyle(line).stroke).not.toBe('rgb(0, 0, 0)');
    expect(getComputedStyle(stop).stopColor).not.toBe('rgb(255, 0, 0)');
    rect.style.opacity = '0.8';
    await timeout(100);
    expect(getComputedStyle(rect).fill).toBe(fill);
    expect(rect.style.getPropertyValue('--darkreader-inline-fill')).not.toBe('');
});

it('keeps chart colors separate from page colors, updates them live, and preserves embedded images and patterns', async () => {
    const logo = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"/%3E';
    document.body.innerHTML = `<svg class="recharts-surface" width="300" height="160"><defs><pattern id="texture"><rect width="12" height="12" fill="#34a853"/><rect width="6" height="6" fill="#50c971"/></pattern></defs><rect id="bar" width="100" height="100" fill="#047afe"/><rect id="pattern" x="100" width="100" height="100" fill="url(#texture)"/><image href='${logo}'/></svg><span style="color:#047afe">Link</span>`;
    const fixes = [{url: ['*'], css: ''}] as DynamicThemeFix[];
    const bar = document.querySelector('#bar')!;
    createOrUpdateDynamicTheme(DEFAULT_THEME, fixes, false);
    await timeout(100);
    const balanced = getComputedStyle(bar).fill;
    expect(balanced).not.toBe('rgb(4, 122, 254)');
    expect(balanced).not.toBe(getComputedStyle(document.querySelector('span')!).color);
    expect(bar.getAttribute('style')).toContain('--darkreader-chart-');
    expect(getComputedStyle(document.querySelector('#pattern')!).fill).toContain('#texture');
    const cells = document.querySelectorAll('pattern rect');
    expect(getComputedStyle(cells[0]).fill).not.toBe(getComputedStyle(cells[1]).fill);
    expect(document.querySelector('image')!.getAttribute('href')).toBe(logo);
    createOrUpdateDynamicTheme({...DEFAULT_THEME, brightness: 85}, fixes, false);
    await timeout(100);
    expect(getComputedStyle(bar).fill).not.toBe(balanced);
    createOrUpdateDynamicTheme({...DEFAULT_THEME, colorProfile: 'classic'}, fixes, false);
    await timeout(100);
    expect(bar.getAttribute('style')).not.toContain('--darkreader-chart-');
    createOrUpdateDynamicTheme(DEFAULT_THEME, fixes, false);
    await timeout(100);
    expect(getComputedStyle(bar).fill).toBe(balanced);
});
