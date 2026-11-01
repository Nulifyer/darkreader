import '../support/polyfills';
import {DEFAULT_THEME} from '../../../src/defaults';
import type {DynamicThemeFix} from '../../../src/definitions';
import {createOrUpdateDynamicTheme, removeDynamicTheme} from '../../../src/inject/dynamic-theme';
import {timeout} from '../support/test-utils';

afterEach(() => {
    removeDynamicTheme();
    document.body.innerHTML = '';
});

it('switches inline, legacy bgcolor and stylesheet colors together without reloading', async () => {
    document.body.innerHTML = '<style>.sheet {background:#ff6600;}</style><div class="sheet">Sheet</div><div class="inline" style="background:#ff6600">Inline</div><table><tbody><tr><td bgcolor="#ff6600">Legacy</td></tr></tbody></table>';
    const fixes = [{url: ['*'], css: ''}] as DynamicThemeFix[];
    const colors = () => ['.sheet', '.inline', 'td'].map((selector) => getComputedStyle(document.querySelector(selector)!).backgroundColor);
    createOrUpdateDynamicTheme({...DEFAULT_THEME, colorProfile: 'classic'}, fixes, false);
    await timeout(50);
    expect(colors()).toEqual(['rgb(204, 82, 0)', 'rgb(204, 82, 0)', 'rgb(204, 82, 0)']);
    createOrUpdateDynamicTheme(DEFAULT_THEME, fixes, false);
    await timeout(50);
    const balanced = colors();
    expect(new Set(balanced).size).toBe(1);
    expect(balanced[0]).not.toBe('rgb(204, 82, 0)');
    createOrUpdateDynamicTheme({...DEFAULT_THEME, colorProfile: 'classic'}, fixes, false);
    await timeout(50);
    expect(colors()).toEqual(['rgb(204, 82, 0)', 'rgb(204, 82, 0)', 'rgb(204, 82, 0)']);
});
