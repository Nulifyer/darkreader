import type {ExtWrapper, Theme} from '../../../definitions';
import {getURLHostOrProtocol, isURLInList} from '../../../utils/url';

export type AppearanceScope = 'site' | 'defaults';

export function getSiteTheme(data: ExtWrapper['data']): Theme {
    return (
        data.settings.customThemes.find(({url}) => isURLInList(data.activeTab.url, url))?.theme ??
        data.settings.presets.find(({urls}) => isURLInList(data.activeTab.url, urls))?.theme ??
        data.settings.theme
    );
}

export function hasSiteTheme(data: ExtWrapper['data']): boolean {
    const host = getURLHostOrProtocol(data.activeTab.url);
    return data.settings.customThemes.some(({url}) => url.length === 1 && url[0] === host);
}

export function getSiteThemeLabel(data: ExtWrapper['data']): string {
    if (hasSiteTheme(data)) {
        return 'Custom appearance for this website';
    }
    if (data.settings.customThemes.some(({url}) => isURLInList(data.activeTab.url, url))) {
        return 'Using shared website settings';
    }
    const preset = data.settings.presets.find(({urls}) => isURLInList(data.activeTab.url, urls));
    return preset ? `Using preset: ${preset.name}` : 'Using your defaults';
}

export function setScopedTheme({data, actions}: ExtWrapper, scope: AppearanceScope, change: Partial<Theme>): void {
    if (scope === 'defaults') {
        actions.setTheme(change);
        return;
    }
    const host = getURLHostOrProtocol(data.activeTab.url);
    const existing = data.settings.customThemes.find(({url}) => url.length === 1 && url[0] === host);
    const theme = {...getSiteTheme(data), ...change};
    const customThemes = [
        {...(existing ?? {url: [host]}), theme},
        ...data.settings.customThemes.filter((entry) => entry !== existing),
    ];
    actions.changeSettings({customThemes});
}

export function resetSiteTheme({data, actions}: ExtWrapper): void {
    const host = getURLHostOrProtocol(data.activeTab.url);
    actions.changeSettings({customThemes: data.settings.customThemes.filter(({url}) => !(url.length === 1 && url[0] === host))});
}
