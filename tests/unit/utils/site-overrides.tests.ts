import {DEFAULT_THEME} from '../../../src/defaults';
import {getImagePreservingIconSelector, isUIIconSelector, preserveImagesInSiteFixes} from '../../../src/inject/dynamic-theme/image-preservation';
import {composeSiteFixesCSS, getSiteOverrides} from '../../../src/inject/dynamic-theme/site-overrides';

test('known fixes precede personal overrides and explicit user CSS stays last', () => {
    const known = '.text { color: red; } img { filter: invert(1); }';
    const custom = '.text { color: green; }';
    const user = 'img { filter: sepia(1); }';
    const css = composeSiteFixesCSS(known, custom, true, user);
    expect(css.indexOf('color: red')).toBeLessThan(css.indexOf(custom));
    expect(css.indexOf(custom)).toBeLessThan(css.indexOf(user));
    expect(css).not.toContain('invert(1)');
    expect(css).toContain(user);
    expect(composeSiteFixesCSS(known, custom, false)).toContain(known);
});

test('known UI glyph fixes survive preservation without filtering media containers', () => {
    for (const selector of ['.material-icons', '.glyph::before', '.checkbox']) {
        expect(isUIIconSelector(selector)).toBe(true);
    }
    for (const selector of ['img.icon', '.image-icon', 'canvas', '.avatar', '.icon-background', '.photo-icon']) {
        expect(isUIIconSelector(selector)).toBe(false);
    }
    expect(getImagePreservingIconSelector('.glyph::before')).toBe('.glyph:not(:has(img, image, canvas, video))::before');
    expect(getImagePreservingIconSelector('.glyph:before')).toBe('.glyph:not(:has(img, image, canvas, video)):before');
    const css = preserveImagesInSiteFixes('.glyph { filter: invert(1); width: 20px; } .photo, .icon { filter: invert(1); color: red; }');
    expect(css).toContain('.glyph:not(:has(img, image, canvas, video))');
    expect(css.match(/filter:/g)).toHaveLength(1);
    expect(css).toContain('width: 20px');
    expect(css).toContain('color: red');
});

test('document preservation is scoped to Docs document pages and respects image policy', () => {
    const fix = getSiteOverrides('https://docs.google.com/document/d/public/edit', DEFAULT_THEME);
    expect(fix.css).toContain('background-color: white');
    expect(fix.ignoreInlineStyle).toContain('.kix-page *');
    expect(fix.invert).toContain('.docs-icon');
    for (const url of ['https://docs.google.com/spreadsheets/d/test/edit', 'https://docs.google.com.evil.example/document/d/test/edit', 'invalid']) {
        expect(getSiteOverrides(url, DEFAULT_THEME).css).toBe('');
    }
    expect(getSiteOverrides('https://docs.google.com/document/d/public/edit', {...DEFAULT_THEME, preserveImages: false}).css).toBe('');
});

test('PyPI string contrast override applies only to Balanced dark mode', () => {
    const url = 'https://pypi.org/project/requests/';
    expect(getSiteOverrides(url, DEFAULT_THEME).css).toContain('.project-description .s1');
    expect(getSiteOverrides('https://en.wikipedia.org/wiki/Dark_mode', DEFAULT_THEME).css).toContain('.mw-highlight .s1');
    expect(getSiteOverrides('https://wikipedia.org.evil.example/', DEFAULT_THEME).css).toBe('');
    expect(getSiteOverrides(url, {...DEFAULT_THEME, preserveImages: false}).css).toContain('.project-description .s1');
    expect(getSiteOverrides(url, {...DEFAULT_THEME, mode: 0}).css).toBe('');
    expect(getSiteOverrides(url, {...DEFAULT_THEME, colorProfile: 'classic'}).css).toBe('');
    expect(getSiteOverrides('https://other.example/', DEFAULT_THEME).css).toBe('');
});

test('Rust chapter fix is confined to the generated Balanced dark appearance', () => {
    const url = 'https://doc.rust-lang.org/book/';
    expect(getSiteOverrides(url, DEFAULT_THEME).css).toContain('.sidebar .chapter a.active');
    expect(getSiteOverrides(url, {...DEFAULT_THEME, mode: 0}).css).toBe('');
    expect(getSiteOverrides(url, {...DEFAULT_THEME, colorProfile: 'classic'}).css).toBe('');
});
