import {m} from 'malevic';

import type {ExtWrapper} from '../../../../definitions';
import {ThemeEngine} from '../../../../generators/theme-engines';
import {AutomationMode} from '../../../../utils/automation';
import {openExtensionPage} from '../../../utils';
import {PopupSwitch} from '../controls';
import SiteListSettings from '../site-list-settings';
import {getSiteTheme, setScopedTheme} from '../theme-scope';
import type {AppearanceScope} from '../theme-scope';

export default function MoreSettings(props: ExtWrapper & { scope: AppearanceScope }) {
    const {data, actions, scope} = props;
    const {settings} = data;
    const theme = scope === 'site' ? getSiteTheme(data) : settings.theme;
    const mode = settings.automation.enabled ? settings.automation.mode : AutomationMode.NONE;
    return (
        <section class="more-settings">
            <div class="settings-row">
                <div>
                    <strong>Respect native dark themes</strong>
                    <p>Use a website’s own dark theme when available.</p>
                </div>
                <PopupSwitch
                    label="Respect native dark themes"
                    checked={settings.detectDarkTheme}
                    onChange={(detectDarkTheme) => actions.changeSettings({detectDarkTheme})}
                />
            </div>
            <div class="settings-row">
                <div>
                    <strong>Follow system appearance</strong>
                    <p>Turn on when your system uses dark mode.</p>
                </div>
                <div class="automation-system">
                    <PopupSwitch
                        label="Follow system appearance"
                        checked={mode === AutomationMode.SYSTEM}
                        onChange={(checked) =>
                            actions.changeSettings({
                                automation: {
                                    ...settings.automation,
                                    enabled: checked,
                                    mode: checked ? AutomationMode.SYSTEM : AutomationMode.NONE,
                                },
                            })
                        }
                    />
                </div>
            </div>
            <details class="appearance-details">
                <summary>Schedule</summary>
                <div class="appearance-details__content">
                    <label class="appearance-choice">
                        <span>Turn on</span>
                        <select
                            class="automation-mode"
                            aria-label="Automation"
                            onrender={(node: HTMLSelectElement) => (node.value = mode)}
                            onchange={(event: Event) => {
                                const mode = (event.target as HTMLSelectElement).value as AutomationMode;
                                actions.changeSettings({automation: {...settings.automation, mode, enabled: Boolean(mode)}});
                            }}
                        >
                            <option value="">Manually</option>
                            <option value={AutomationMode.SYSTEM}>With system</option>
                            <option value={AutomationMode.TIME}>On a schedule</option>
                            <option value={AutomationMode.LOCATION}>Sunset to sunrise</option>
                        </select>
                    </label>
                    {mode === AutomationMode.TIME ? (
                        <div class="schedule-times">
                            <label>
                                From
                                <input
                                    type="time"
                                    aria-label="Start time"
                                    onrender={(node: HTMLInputElement) => (node.value = settings.time.activation)}
                                    onchange={(event: Event) =>
                                        actions.changeSettings({
                                            time: {...settings.time, activation: (event.target as HTMLInputElement).value},
                                        })
                                    }
                                />
                            </label>
                            <label>
                                Until
                                <input
                                    type="time"
                                    aria-label="End time"
                                    onrender={(node: HTMLInputElement) => (node.value = settings.time.deactivation)}
                                    onchange={(event: Event) =>
                                        actions.changeSettings({
                                            time: {...settings.time, deactivation: (event.target as HTMLInputElement).value},
                                        })
                                    }
                                />
                            </label>
                        </div>
                    ) : null}
                    {mode === AutomationMode.LOCATION ? (
                        <div class="schedule-times">
                            {(['latitude', 'longitude'] as const).map((key) => (
                                <label>
                                    {key === 'latitude' ? 'Latitude' : 'Longitude'}
                                    <input
                                        type="number"
                                        aria-label={key}
                                        min={key === 'latitude' ? -90 : -180}
                                        max={key === 'latitude' ? 90 : 180}
                                        step="any"
                                        onrender={(node: HTMLInputElement) =>
                                            (node.value = settings.location[key] == null ? '' : String(settings.location[key]))
                                        }
                                        onchange={(event: Event) => {
                                            const node = event.target as HTMLInputElement;
                                            if (node.validity.valid) {
                                                actions.changeSettings({
                                                    location: {
                                                        ...settings.location,
                                                        [key]: node.value === '' ? null : Number(node.value),
                                                    },
                                                });
                                            }
                                        }}
                                    />
                                </label>
                            ))}
                        </div>
                    ) : null}
                </div>
            </details>
            <details class="appearance-details">
                <summary>Website rules</summary>
                <div class="appearance-details__content">
                    <SiteListSettings data={data} actions={actions} isFocused={false} />
                </div>
            </details>
            <details class="appearance-details">
                <summary>Rendering</summary>
                <div class="appearance-details__content">
                    <p class="popup-help">{scope === 'site' ? 'Applies to the current website.' : 'Applies to your defaults.'}</p>
                    <label class="appearance-choice">
                        <span>Preferred engine</span>
                        <select
                            aria-label="Rendering engine"
                            onrender={(node: HTMLSelectElement) => (node.value = theme.engine)}
                            onchange={(event: Event) =>
                                setScopedTheme(props, scope, {engine: (event.target as HTMLSelectElement).value as ThemeEngine})
                            }
                        >
                            <option value={ThemeEngine.dynamicTheme}>Dynamic</option>
                            <option value={ThemeEngine.cssFilter}>Filter</option>
                            <option value={ThemeEngine.svgFilter}>Filter+</option>
                            <option value={ThemeEngine.staticTheme}>Static</option>
                        </select>
                    </label>
                    <p class="popup-help">
                        Preserving images uses Dynamic. Your preferred engine resumes when automatic image adjustment is allowed.
                    </p>
                    <button class="popup-text-button" onclick={() => openExtensionPage('stylesheet-editor')}>
                        Edit custom CSS
                    </button>
                </div>
            </details>
            <div class="settings-links">
                <button class="popup-link-row" onclick={() => openExtensionPage('options')}>
                    All settings<span aria-hidden="true">↗</span>
                </button>
                <button class="popup-link-row" onclick={() => openExtensionPage('devtools')}>
                    Developer tools<span aria-hidden="true">↗</span>
                </button>
            </div>
        </section>
    );
}
