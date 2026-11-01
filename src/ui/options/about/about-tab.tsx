import {m} from 'malevic';

import type {ViewProps} from '../../../definitions';
import {AppVersion} from './version';

export function AboutTab(_props: ViewProps & {plus?: boolean}): Malevic.Child {
    return <div class="settings-tab about-tab">
        <AppVersion />
        <p>Personal fork of Dark Reader. Original work by Alexander Shutau and contributors, under the MIT license.</p>
        <div><a href="https://github.com/Nulifyer/darkreader" target="_blank" rel="noopener noreferrer">Fork source</a></div>
        <div><a href="https://github.com/darkreader/darkreader" target="_blank" rel="noopener noreferrer">Upstream source</a></div>
        <div><a href="https://github.com/darkreader/darkreader/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">MIT license</a></div>
    </div>;
}
