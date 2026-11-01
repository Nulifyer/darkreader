import {m} from 'malevic';

import type {ExtWrapper} from '../../../../definitions';
import {getURLHostOrProtocol, isURLInList} from '../../../../utils/url';
import {Button} from '../../../controls';

declare const __THUNDERBIRD__: boolean;

export default function CustomSettingsToggle({data, actions}: ExtWrapper) {
    const tab = data.activeTab;
    const host = getURLHostOrProtocol(tab.url);

    const isCustom = data.settings.customThemes.some(({url}) => isURLInList(tab.url, url));

    return (
        <Button
            aria-pressed={isCustom}
            title={host}
            class={{
                'custom-settings-toggle': true,
                'custom-settings-toggle--checked': isCustom,
                'custom-settings-toggle--disabled': __THUNDERBIRD__ || tab.isProtected,
            }}
            onclick={(e) => {
                if (isCustom) {
                    const filtered = data.settings.customThemes.filter(({url}) => !isURLInList(tab.url, url));
                    actions.changeSettings({customThemes: filtered});
                } else {
                    const extended = data.settings.customThemes.concat({
                        url: [host],
                        theme: {...data.settings.theme},
                    });
                    actions.changeSettings({customThemes: extended});
                    (e.currentTarget as HTMLElement).classList.add('custom-settings-toggle--checked'); // Speed-up reaction
                }
            }}
        >
            <span class="custom-settings-toggle__wrapper">
                {isCustom ? 'Appearance: this site' : 'Appearance: all sites'}
            </span>
        </Button>
    );
}
