import {m} from 'malevic';
import {withForms} from 'malevic/forms';
import {withState, useState} from 'malevic/state';

import type {ExtensionData, ExtensionActions} from '../../../definitions';
import {compose} from '../../utils';

import FilterSettings from './filter-settings';
import {Header} from './header';
import Loader from './loader';
import MoreSettings from './more-settings';
import type {AppearanceScope} from './theme-scope';

interface BodyProps {
    data: ExtensionData;
    actions: ExtensionActions;
    fonts: string[];
    installation: { date: number; version: string };
}

type View = AppearanceScope | 'settings';
const views: Array<{ id: View; label: string }> = [
    {id: 'site', label: 'This site'},
    {id: 'defaults', label: 'Defaults'},
    {id: 'settings', label: 'Settings'},
];

function Body(props: BodyProps) {
    const {state, setState} = useState({activeTab: 'site' as View, scope: 'site' as AppearanceScope});
    if (!props.data.isReady) {
        return (
            <body>
                <Loader complete={false} />
            </body>
        );
    }
    const switchView = (activeTab: View) => setState({activeTab, scope: activeTab === 'settings' ? state.scope : activeTab});
    return (
        <body class={{'personal-popup': true, 'ext-disabled': !props.data.isEnabled}}>
            <Loader complete />
            <Header data={props.data} actions={props.actions} />
            <nav
                class="popup-tabs"
                role="tablist"
                aria-label="Settings scope"
                onkeydown={(event: KeyboardEvent) => {
                    const index = views.findIndex(({id}) => id === state.activeTab);
                    const next =
                        event.key === 'ArrowRight'
                            ? (index + 1) % views.length
                            : event.key === 'ArrowLeft'
                                ? (index + views.length - 1) % views.length
                                : event.key === 'Home'
                                    ? 0
                                    : event.key === 'End'
                                        ? views.length - 1
                                        : null;
                    if (next !== null) {
                        event.preventDefault();
                        const button = (event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>('[role="tab"]')[next];
                        button.focus();
                        switchView(views[next].id);
                    }
                }}
            >
                {views.map(({id, label}) => (
                    <button
                        type="button"
                        id={`tab-${id}`}
                        role="tab"
                        aria-selected={String(state.activeTab === id)}
                        aria-controls="popup-panel"
                        tabindex={state.activeTab === id ? 0 : -1}
                        onclick={() => switchView(id)}
                    >
                        {label}
                    </button>
                ))}
            </nav>
            <main
                class="popup-content"
                id="popup-panel"
                role="tabpanel"
                aria-labelledby={`tab-${state.activeTab}`}
                tabindex="0"
                key={state.activeTab}
            >
                {state.activeTab === 'settings' ? (
                    <MoreSettings data={props.data} actions={props.actions} scope={state.scope} />
                ) : (
                    <FilterSettings data={props.data} actions={props.actions} scope={state.activeTab} fonts={props.fonts} />
                )}
            </main>
            <footer class="popup-footer">
                <span>Changes save automatically</span>
                <span>
                    {state.activeTab === 'site' ? 'This website only' : state.activeTab === 'defaults' ? 'Global defaults' : 'Preferences'}
                </span>
            </footer>
        </body>
    );
}

export default compose(Body as any, withState, withForms);
