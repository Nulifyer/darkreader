import {isURLInList} from './url';

// Upstream's compatibility defaults apply when automatic image adjustment is
// allowed. Preservation always uses Dynamic, including on canvas editors.
export const FILTER_MODE_SITES = [
    '*.officeapps.live.com',
    '*.sharepoint.com',
    'docs.google.com',
    'onedrive.live.com',
];

export function needsFilterMode(url: string): boolean {
    return isURLInList(url, FILTER_MODE_SITES);
}

// These are control glyphs from upstream's Google Docs Dynamic fixes, not
// document images. Sprite-backed buttons need the same foreground adaptation
// as text even when content images are preserved. Keep this list in code so
// syncing upstream site fixes cannot discard the personal fork's exception.
const googleDocsUIIcons = [
    '.docs-icon',
    '.kix-equation-toolbar-icon',
    '.kix-equation-toolbar-palette-icon',
    '.docs-instant-button-bubble-icon-container',
    '.goog-menuitem-checkbox',
    '#docs-star',
    '.rs-role-icon',
    '.toggle-link-icon',
    '.link-management-drop-down-icon',
    '.vs-icon',
    '.vpc-icon',
    '.share-butter-copy-icon',
    '#docs-titlebar-share-client-button .scb-button-icon:not([class*="white"])',
    '.docs-gm .docos-icon-overflow-three-dots-size',
];

export function getSiteUIIconSelectors(url: string): readonly string[] {
    try {
        return new URL(url).hostname === 'docs.google.com' ? googleDocsUIIcons : [];
    } catch {
        return [];
    }
}
