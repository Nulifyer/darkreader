import {m} from 'malevic';

export function PopupSwitch(props: { label: string; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void }) {
    return (
        <label class="popup-switch" title={props.label}>
            <input
                type="checkbox"
                role="switch"
                aria-label={props.label}
                disabled={props.disabled}
                onrender={(node: HTMLInputElement) => (node.checked = props.checked)}
                onchange={(event: Event) => props.onChange((event.target as HTMLInputElement).checked)}
            />
            <span class="popup-switch__track" aria-hidden="true">
                <span />
            </span>
        </label>
    );
}

export function ChoiceGroup<T extends string | number>(props: {
    label: string;
    value: T;
    options: Array<{ value: T; label: string }>;
    onChange: (value: T) => void;
}) {
    return (
        <div class="popup-choice" role="group" aria-label={props.label}>
            {props.options.map((option) => (
                <button type="button" aria-pressed={String(props.value === option.value)} onclick={() => props.onChange(option.value)}>
                    {option.label}
                </button>
            ))}
        </div>
    );
}
