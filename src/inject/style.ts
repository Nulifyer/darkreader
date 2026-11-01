import {createNodeAsap, removeNode} from './utils/dom';

export function createOrUpdateStyle(css: string, type: string): void {
    createNodeAsap({
        selectNode: () => document.getElementById('dark-reader-style')!,
        createNode: (target) => {
            document.documentElement.setAttribute('data-darkreader-mode', type);
            const style = document.createElement('style');
            style.id = 'dark-reader-style';
            style.classList.add('darkreader');
            style.type = 'text/css';
            style.textContent = css;
            target.appendChild(style);
        },
        updateNode: (existing) => {
            if (css.replace(/^\s+/gm, '') !== existing.textContent!.replace(/^\s+/gm, '')) {
                existing.textContent = css;
            }
        },
        selectTarget: () => document.head,
        createTarget: () => {
            const head = document.createElement('head');
            document.documentElement.insertBefore(head, document.documentElement.firstElementChild);
            return head;
        },
        isTargetMutation: (mutation) => mutation.target.nodeName.toLowerCase() === 'head',
    });
}

export function removeStyle(): void {
    removeNode(document.getElementById('dark-reader-style'));
    // Clearing an obsolete Filter/Static stylesheet also runs before Dynamic
    // updates. Its color-only fast path keeps the existing Dynamic styles.
    if (document.documentElement.getAttribute('data-darkreader-mode') !== 'dynamic') {
        document.documentElement.removeAttribute('data-darkreader-mode');
    }
}
