import {m} from 'malevic';

import type {ExtWrapper} from '../../../../definitions';
import {getURLHostOrProtocol} from '../../../../utils/url';
import {PopupSwitch} from '../controls';
import {getSiteToggleData} from '../site-toggle';

export function toggleExtension({data, actions}: ExtWrapper, enabled: boolean) {
    actions.changeSettings({enabled, automation: {...data.settings.automation, enabled: false}});
}

export function Header(props: ExtWrapper) {
    const {data} = props;
    const {isSiteEnabled, toggleHasEffect, onSiteToggleClick} = getSiteToggleData(props);
    const native = !isSiteEnabled && (data.activeTab.isInDarkList || data.activeTab.isDarkThemeDetected);
    const unavailable = data.activeTab.isProtected || !toggleHasEffect;
    const status = unavailable
        ? 'Unavailable on this page'
        : !data.isEnabled
            ? 'Paused on all websites'
            : native
                ? 'Using the website’s dark theme'
                : isSiteEnabled
                    ? 'Dark Reader is active here'
                    : 'Off for this website';
    const host = getURLHostOrProtocol(data.activeTab.url).replace(/^www\./, '');
    return (
        <header class="header">
            <div class="header__top">
                <h1 class="header__logo">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20.8 14.2A9 9 0 0 1 9.8 3.1a9 9 0 1 0 11 11.1Z" />
                    </svg>
                    Dark Reader
                </h1>
                <button
                    type="button"
                    class="header__power"
                    aria-label="Dark Reader on all websites"
                    aria-pressed={String(data.isEnabled)}
                    title={data.isEnabled ? 'Pause on all websites' : 'Resume on all websites'}
                    onclick={() => toggleExtension(props, !data.isEnabled)}
                >
                    <svg viewBox="0 0 20 20" aria-hidden="true">
                        <path d="M10 2v7M5 4.8a7 7 0 1 0 10 0" />
                    </svg>
                    {data.isEnabled ? 'On' : 'Paused'}
                </button>
            </div>
            <div class="header__site">
                <div class="header__site-copy">
                    <strong title={host}>{host || 'Current website'}</strong>
                    <span class="header__status" role="status">
                        {status}
                    </span>
                </div>
                <PopupSwitch
                    label="Use Dark Reader on this website"
                    checked={isSiteEnabled}
                    disabled={unavailable}
                    onChange={onSiteToggleClick}
                />
            </div>
        </header>
    );
}
