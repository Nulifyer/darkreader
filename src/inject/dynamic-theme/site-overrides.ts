import type {Theme} from '../../definitions';
import {parseColorWithCache} from '../../utils/color';
import {getSiteUIIconSelectors} from '../../utils/theme-compatibility';

import {preserveImagesInSiteFixes} from './image-preservation';
import {modifyForegroundColor} from './modify-colors';

interface SiteOverrides {
    css: string;
    invert: readonly string[];
    ignoreInlineStyle: string[];
}

// Generated colors, upstream known fixes, then these personal site overrides.
// Explicit user stylesheets remain the final user-controlled layer.
export function getSiteOverrides(url: string, theme: Theme): SiteOverrides {
    const result: SiteOverrides = {css: '', invert: [], ignoreInlineStyle: []};
    result.invert = theme.preserveImages ? getSiteUIIconSelectors(url) : [];
    let documentURL: URL;
    try {
        documentURL = new URL(url);
    } catch {
        return result;
    }
    if (theme.preserveImages && documentURL.hostname === 'docs.google.com' && documentURL.pathname.startsWith('/document/')) {
        // Text and photos share a canvas. Keep native document colors and a
        // light paper surface, including behind transparent canvas text tiles.
        const boundaries = ['.kix-page', '.kix-page-paginated', '.kix-canvas-tile-content'];
        result.ignoreInlineStyle = boundaries.flatMap((selector) => [selector, `${selector} *`]);
        result.css = [
            '.kix-page, .kix-page-paginated, .docs-body-pageless .kix-appview-editor {',
            '    background-color: white !important;',
            '    color: black !important;',
            '    color-scheme: light !important;',
            '}',
            '.kix-page .kix-canvas-tile-content {',
            '    background-color: transparent !important;',
            '}',
            '.kix-cursor-caret { border-color: black !important; }',
        ].join('\n');
    }
    const syntaxScope = documentURL.hostname === 'pypi.org' ? '.project-description' : documentURL.hostname.endsWith('.wikipedia.org') ? '.mw-highlight' : null;
    if (syntaxScope && theme.mode === 1 && theme.colorProfile === 'balanced') {
        // PyPI/Wikipedia Pygments string reds fall below 4.5:1 on dark code blocks.
        // Keep syntax semantics with a muted red, adjusted with the user's theme.
        const stringColor = modifyForegroundColor(parseColorWithCache('#e6aaaa')!, theme);
        const strings = ['s', 's1', 's2', 'sa', 'sb', 'sc', 'sd', 'se', 'sh', 'si', 'sr', 'ss', 'sx'];
        result.css = `${strings.map((token) => `${syntaxScope} .${token}`).join(', ')} { color: ${stringColor} !important; }`;
    }
    if (documentURL.hostname === 'doc.rust-lang.org' && theme.mode === 1 && theme.colorProfile === 'balanced') {
        // The light mdBook theme's active chapter blue otherwise ends up below
        // 4.5:1 on the generated sidebar. Native themes are handled upstream.
        const activeColor = modifyForegroundColor(parseColorWithCache('#8ab4f8')!, theme);
        result.css = `.sidebar .chapter a.active { color: ${activeColor} !important; }`;
    }
    return result;
}

export function composeSiteFixesCSS(knownCSS: string, customCSS: string, preserveImages: boolean, userCSS = ''): string {
    const known = preserveImages ? preserveImagesInSiteFixes(knownCSS) : knownCSS;
    return [known, customCSS, userCSS].filter(Boolean).join('\n');
}
