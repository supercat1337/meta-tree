// @ts-check

import { formatLocationInTree } from './tools/tools.js';
import { treeFromStringWithMacros } from './tools/treeFromString.js';

export { Tree } from './tree/tree.js';
export { Record } from './tree/record.js';
export { Section } from './tree/section.js';
export { Field } from './tree/field.js';
export { treeFromString, treeFromStringWithMacros } from './tools/treeFromString.js';
export { preprocessMacros } from './tools/macro-preprocessor.js';

/**
 * Expands all macros in a DSL string, returning a full DSL string without macro calls.
 * @param {string} dslString - DSL string containing macro definitions and calls.
 * @returns {string} DSL string with all macros expanded to their full attribute sets.
 * @throws {Error} If the DSL string contains syntax errors or unresolved macros.
 */
export function expandMacros(dslString) {
    const tree = treeFromStringWithMacros(dslString);
    return tree.stringify();
}

export { formatLocationInTree };
