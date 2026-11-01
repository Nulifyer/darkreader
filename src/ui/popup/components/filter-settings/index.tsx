import {m} from 'malevic';
import {getContext} from 'malevic/dom';

import type {ExtWrapper} from '../../../../definitions';
import {ChoiceGroup} from '../controls';
import ImageSettings from '../image-settings';
import {getSiteTheme, getSiteThemeLabel, hasSiteTheme, resetSiteTheme, setScopedTheme} from '../theme-scope';
import type {AppearanceScope} from '../theme-scope';

export function Adjustment(props: {
    label: string;
    value: number;
    min: number;
    max: number;
    defaultValue: number;
    onChange: (value: number) => void;
}) {
    const context = getContext();
    // Render previews through Malevic so its percentage text node stays owned.
    const store = context.store as {value?: number; sourceValue?: number};
    if (store.sourceValue !== props.value) {
        store.sourceValue = props.value;
        store.value = props.value;
    }
    const value = store.value ?? props.value;
    function preview(value: number) {
        store.value = value;
        context.refresh();
    }
    return (
        <div class="appearance-adjustment">
            <div class="appearance-adjustment__label">
                <label for={`adjustment-${props.label.toLowerCase()}`}>{props.label}</label>
                <button
                    type="button"
                    title={`Reset ${props.label.toLowerCase()} to ${props.defaultValue}%`}
                    aria-label={`Reset ${props.label.toLowerCase()}`}
                    onclick={() => {
                        preview(props.defaultValue);
                        props.onChange(props.defaultValue);
                    }}
                >{`${value}%`}</button>
            </div>
            <input
                id={`adjustment-${props.label.toLowerCase()}`}
                type="range"
                min={props.min}
                max={props.max}
                step="1"
                aria-label={props.label}
                onrender={(node: HTMLInputElement) => (node.value = String(value))}
                oninput={(event: Event) => preview(Number((event.target as HTMLInputElement).value))}
                onchange={(event: Event) => {
                    const value = Number((event.target as HTMLInputElement).value);
                    preview(value);
                    props.onChange(value);
                }}
            />
        </div>
    );
}

export default function FilterSettings(props: ExtWrapper & { scope: AppearanceScope; fonts: string[] }) {
    const {data, actions, scope, fonts} = props;
    const theme = scope === 'site' ? getSiteTheme(data) : data.settings.theme;
    const setConfig = (config: Parameters<typeof setScopedTheme>[2]) => setScopedTheme(props, scope, config);
    const custom = hasSiteTheme(data);
    return (
        <section class="filter-settings">
            <div class="appearance-scope">
                <span>
                    {scope === 'defaults' ? 'Starting point for every website' : getSiteThemeLabel(data)}
                </span>
                {scope === 'site' && custom ? (
                    <button class="popup-text-button" onclick={() => resetSiteTheme(props)}>
                        Reset
                    </button>
                ) : null}
            </div>
            <fieldset class="appearance-fields" disabled={scope === 'site' && data.activeTab.isProtected}>
                <div class="appearance-section">
                    <h2>Theme</h2>
                    <ChoiceGroup
                        label="Appearance"
                        value={theme.mode}
                        options={[
                            {value: 1, label: 'Dark'},
                            {value: 0, label: 'Light'},
                        ]}
                        onChange={(mode) => setConfig({mode})}
                    />
                    <label class="appearance-choice">
                        <span>Color palette</span>
                        <select
                            aria-label="Color palette"
                            onrender={(node: HTMLSelectElement) => (node.value = theme.colorProfile ?? 'balanced')}
                            onchange={(event: Event) =>
                                setConfig({colorProfile: (event.target as HTMLSelectElement).value as 'balanced' | 'classic'})
                            }
                        >
                            <option value="balanced">Balanced</option>
                            <option value="classic">Original</option>
                        </select>
                    </label>
                </div>
                <div class="appearance-section appearance-sliders">
                    <Adjustment
                        label="Brightness"
                        value={theme.brightness}
                        min={50}
                        max={150}
                        defaultValue={100}
                        onChange={(brightness) => setConfig({brightness})}
                    />
                    <Adjustment
                        label="Contrast"
                        value={theme.contrast}
                        min={50}
                        max={150}
                        defaultValue={100}
                        onChange={(contrast) => setConfig({contrast})}
                    />
                </div>
                <ImageSettings data={data} actions={actions} scope={scope} />
                <details class="appearance-details">
                    <summary>Fine-tune appearance</summary>
                    <div class="appearance-details__content">
                        <Adjustment
                            label="Sepia"
                            value={theme.sepia}
                            min={0}
                            max={100}
                            defaultValue={0}
                            onChange={(sepia) => setConfig({sepia})}
                        />
                        <Adjustment
                            label="Grayscale"
                            value={theme.grayscale}
                            min={0}
                            max={100}
                            defaultValue={0}
                            onChange={(grayscale) => setConfig({grayscale})}
                        />
                        <label class="appearance-choice">
                            <span>Font</span>
                            <select
                                aria-label="Font"
                                onrender={(node: HTMLSelectElement) => (node.value = theme.useFont ? theme.fontFamily : '')}
                                onchange={(event: Event) => {
                                    const font = (event.target as HTMLSelectElement).value;
                                    setConfig({useFont: Boolean(font), ...(font ? {fontFamily: font} : {})});
                                }}
                            >
                                <option value="">Website default</option>
                                {[...new Set([theme.fontFamily, ...fonts])].map((font) => (
                                    <option value={font}>{font}</option>
                                ))}
                            </select>
                        </label>
                        <label class="appearance-choice">
                            <span>Text stroke</span>
                            <select
                                aria-label="Text stroke"
                                onrender={(node: HTMLSelectElement) => (node.value = String(theme.textStroke))}
                                onchange={(event: Event) => setConfig({textStroke: Number((event.target as HTMLSelectElement).value)})}
                            >
                                {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map((stroke) => (
                                    <option value={stroke}>{stroke === 0 ? 'Off' : String(stroke)}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </details>
            </fieldset>
        </section>
    );
}
