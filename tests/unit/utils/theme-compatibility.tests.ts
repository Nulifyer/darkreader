import {readFileSync} from 'node:fs';

import {parseDynamicThemeFixes} from '../../../src/generators/dynamic-theme';
import {getSiteUIIconSelectors} from '../../../src/utils/theme-compatibility';

test.each(['https://example.com/', 'https://docs.google.com.example.org/', 'https://drive.google.com/', 'invalid'])('does not apply Docs UI exceptions to %s', (url) => {
    expect(getSiteUIIconSelectors(url)).toEqual([]);
});

test('Docs UI exceptions retain known upstream glyph selectors without allowing document images or canvases', () => {
    const selectors = getSiteUIIconSelectors('https://docs.google.com/document/d/test/edit');
    const config = readFileSync('src/config/dynamic-theme-fixes.config', 'utf8');
    const docs = parseDynamicThemeFixes(config).find((fix) => fix.url[0] === 'docs.google.com')!;
    expect(selectors).toContain('.docs-icon');
    expect(selectors).toContain('#docs-star');
    for (const selector of selectors) {
        expect(docs.invert).toContain(selector);
    }
    expect(selectors).not.toContain('#docs-editor canvas');
    expect(selectors).not.toContain('.kix-embeddedobject-image');
    expect(selectors).not.toContain('img');
});
