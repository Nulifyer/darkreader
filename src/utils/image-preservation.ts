import type {Theme, UserSettings} from '../definitions';
import {ThemeEngine} from '../generators/theme-engines';

import {getURLHostOrProtocol} from './url';

export function getSiteImagePreservation(settings: UserSettings, url: string): boolean | null {
    const host = getURLHostOrProtocol(url);
    return settings.imagePreservationOverrides.find((entry) => entry.host === host)?.preserveImages ?? null;
}

export function shouldPreserveImages(settings: UserSettings, url: string): boolean {
    return getSiteImagePreservation(settings, url) ?? settings.theme.preserveImages ?? true;
}

export function setSiteImagePreservation(settings: UserSettings, url: string, preserveImages: boolean | null): UserSettings['imagePreservationOverrides'] {
    const host = getURLHostOrProtocol(url);
    const overrides = settings.imagePreservationOverrides.filter((entry) => entry.host !== host);
    if (preserveImages !== null) {
        overrides.push({host, preserveImages});
    }
    return overrides;
}

export function getImagePreservingTheme(theme: Theme, settings: UserSettings, url: string): Theme {
    const preserveImages = shouldPreserveImages(settings, url);
    const colorProfile = theme.colorProfile ?? settings.theme.colorProfile ?? 'balanced';
    const engine = preserveImages ? ThemeEngine.dynamicTheme : theme.engine;
    return {
        ...theme,
        colorProfile,
        preserveImages,
        // A whole-page filter also filters arbitrary background images. Dynamic
        // rendering lets us preserve those resources without filtering their text.
        engine,
        // Filter profiles have no per-element color roles. Start from a softer
        // contrast curve while retaining the user's relative adjustment.
        contrast: colorProfile === 'balanced' && (engine === ThemeEngine.cssFilter || engine === ThemeEngine.svgFilter) ? theme.contrast * 0.85 : theme.contrast,
    };
}
