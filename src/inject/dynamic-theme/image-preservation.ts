import {parseColorWithCache} from '../../utils/color';
import {formatParsedCSS} from '../../utils/css-text/format-css';
import {isParsedStyleRule, parseCSS} from '../../utils/css-text/parse-css';
import type {ParsedCSS} from '../../utils/css-text/parse-css';

export function isUIIconSelector(selector: string): boolean {
    return /icon|glyph|checkbox|radiobutton|chevron|caret/i.test(selector) &&
        !/img|image|canvas|photo|avatar|logo|thumbnail|poster|video|background|cover/i.test(selector);
}

export function getImagePreservingIconSelector(selector: string): string {
    // A known icon container can also wrap a user image. Do not filter that
    // subtree. Insert the guard before pseudo-elements such as ::before.
    return selector.replace(/(::[\w-]+(?:\([^)]*\))?|:(?:before|after))?$/, ':not(:has(img, image, canvas, video))$1');
}

// Site fixes are extension-generated CSS, separate from authored page styles
// and the user's explicit theme stylesheet. Retain their color/layout fixes
// while omitting declarations that would override image preservation.
export function preserveImagesInSiteFixes(css: string): string {
    const parsed = parseCSS(css);
    const visit = (rules: ParsedCSS) => {
        rules.forEach((rule) => {
            if (!isParsedStyleRule(rule)) {
                visit(rule.rules);
                return;
            }
            rule.declarations = rule.declarations.filter((declaration) => {
                const property = declaration.property.toLowerCase();
                if (property === 'filter' || property === '-webkit-filter') {
                    return rule.selectors.every(isUIIconSelector);
                }
                if (property === 'background-image') {
                    return false;
                }
                if (property === 'background') {
                    if (!parseColorWithCache(declaration.value)) {
                        return false;
                    }
                    declaration.property = 'background-color';
                }
                return true;
            });
            if (rule.declarations.some(({property}) => property === 'filter' || property === '-webkit-filter')) {
                rule.selectors = rule.selectors.map(getImagePreservingIconSelector);
            }
        });
    };
    visit(parsed);
    return formatParsedCSS(parsed);
}
