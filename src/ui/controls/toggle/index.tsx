import type {Child} from 'malevic';
import {m} from 'malevic';

interface ToggleProps {
    checked: boolean;
    class?: string;
    labelOn: Child;
    labelOff: Child;
    onChange: (checked: boolean) => void;
}

export default function Toggle(props: ToggleProps) {
    const {checked, onChange} = props;

    const cls = [
        'toggle',
        checked ? 'toggle--checked' : null,
        props.class,
    ];

    const clsOn = {
        'toggle__btn': true,
        'toggle__on': true,
        'toggle__btn--active': checked,
    };

    const clsOff = {
        'toggle__btn': true,
        'toggle__off': true,
        'toggle__btn--active': !checked,
    };

    return (
        <span class={cls}>
            <button
                type="button"
                class={clsOn}
                aria-pressed={checked}
                onclick={onChange ? () => !checked && onChange(true) : undefined}
            >
                {props.labelOn}
            </button>
            <button
                type="button"
                class={clsOff}
                aria-pressed={!checked}
                onclick={onChange ? () => checked && onChange(false) : undefined}
            >
                {props.labelOff}
            </button>
        </span>
    );
}
