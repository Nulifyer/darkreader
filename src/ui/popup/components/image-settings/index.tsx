import {m} from 'malevic';

import type {ExtWrapper} from '../../../../definitions';
import {getSiteImagePreservation, setSiteImagePreservation, shouldPreserveImages} from '../../../../utils/image-preservation';
import {PopupSwitch} from '../controls';
import type {AppearanceScope} from '../theme-scope';

export default function ImageSettings({data, actions, scope}: ExtWrapper & { scope: AppearanceScope }) {
    const {settings, activeTab} = data;
    const globalPreserve = settings.theme.preserveImages ?? true;
    const siteValue = getSiteImagePreservation(settings, activeTab.url);
    const selected = siteValue === null ? 'global' : siteValue ? 'preserve' : 'auto';
    const preserves = scope === 'defaults' ? globalPreserve : shouldPreserveImages(settings, activeTab.url);
    const docs = scope === 'site' && preserves && /^https?:\/\/docs\.google\.com\/document\//.test(activeTab.url);
    return (
        <section class="image-settings" aria-label="Images">
            <div class="image-settings__row">
                <div class="image-settings__copy">
                    <h2>{scope === 'defaults' ? 'Keep image colors' : 'Images'}</h2>
                </div>
                {scope === 'defaults' ? (
                    <div class="image-settings__global">
                        <PopupSwitch
                            label="Preserve images by default"
                            checked={globalPreserve}
                            onChange={(preserveImages) => actions.setTheme({preserveImages})}
                        />
                    </div>
                ) : (
                    <select
                        class="image-settings__select"
                        aria-label="Image handling for this site"
                        disabled={activeTab.isProtected}
                        onrender={(node: HTMLSelectElement) => (node.value = selected)}
                        onchange={(event: Event) => {
                            const value = (event.target as HTMLSelectElement).value;
                            actions.changeSettings({
                                imagePreservationOverrides: setSiteImagePreservation(
                                    settings,
                                    activeTab.url,
                                    value === 'global' ? null : value === 'preserve',
                                ),
                            });
                        }}
                    >
                        <option value="global">{`Default: ${globalPreserve ? 'keep original' : 'adjust automatically'}`}</option>
                        <option value="preserve">Keep original</option>
                        <option value="auto">Adjust automatically</option>
                    </select>
                )}
            </div>
            <p class="image-settings__description">
                {docs
                    ? 'Original document colors on light paper. Dark controls.'
                    : preserves
                        ? 'Photos and illustrations keep their original colors.'
                        : 'Dark Reader can adjust images to suit the theme.'}
            </p>
        </section>
    );
}
