// @ts-check
import { treeFromString, treeFromStringWithMacros } from '../dist/meta-tree.esm.js';

/** @type {HTMLTextAreaElement} */
// @ts-ignore
const treeString = document.getElementById('tree-string');
/** @type {HTMLButtonElement} */
// @ts-ignore
const parseButton = document.getElementById('parse-button');
/** @type {HTMLButtonElement} */
// @ts-ignore
const parseMacrosButton = document.getElementById('parse-macros-button');
/** @type {HTMLButtonElement} */
// @ts-ignore
const beautifyButton = document.getElementById('beautify-button');
/** @type {HTMLButtonElement} */
// @ts-ignore
const beautifyMacrosButton = document.getElementById('beautify-macros-button');
/** @type {HTMLButtonElement} */
// @ts-ignore
const loadExampleButton = document.getElementById('load-example');
/** @type {HTMLButtonElement} */
// @ts-ignore
const loadMacroExampleButton = document.getElementById('load-macro-example');
/** @type {HTMLButtonElement} */
// @ts-ignore
const copyButton = document.getElementById('copy-output');
/** @type {HTMLElement} */
// @ts-ignore
const output = document.getElementById('output');
/** @type {HTMLElement} */
// @ts-ignore
const errorDiv = document.getElementById('error');

/**
 * Parses the DSL string without macro preprocessing and displays JSON output.
 * @returns {void}
 */
function parseAndDisplay() {
    try {
        const tree = treeFromString(treeString.value);
        output.innerText = JSON.stringify(tree, null, 2);
        errorDiv.innerText = '';
    } catch (err) {
        errorDiv.innerText = `Parse error: ${err.message}`;
        output.innerText = '';
    }
}

/**
 * Preprocesses macros, parses the resulting DSL, and displays JSON output.
 * @returns {void}
 */
function parseAndDisplayWithMacros() {
    try {
        const tree = treeFromStringWithMacros(treeString.value);
        output.innerText = JSON.stringify(tree, null, 2);
        errorDiv.innerText = '';
    } catch (err) {
        errorDiv.innerText = `Parse error (with macros): ${err.message}`;
        output.innerText = '';
    }
}

/**
 * Beautifies the DSL input by round-tripping through the parser (no macros).
 * @returns {void}
 */
function beautify() {
    try {
        const tree = treeFromString(treeString.value);
        const beautified = tree.stringify();
        treeString.value = beautified;
        parseAndDisplay();
    } catch (err) {
        errorDiv.innerText = `Cannot beautify: ${err.message}`;
    }
}

/**
 * Beautifies the DSL input after expanding all macros.
 * @returns {void}
 */
function beautifyWithMacros() {
    try {
        const tree = treeFromStringWithMacros(treeString.value);
        const beautified = tree.stringify();
        treeString.value = beautified;
        parseAndDisplayWithMacros();
    } catch (err) {
        errorDiv.innerText = `Cannot beautify (with macros): ${err.message}`;
    }
}

/**
 * Loads a standard DSL example without macros into the input area.
 * @returns {void}
 */
function loadExample() {
    // Note: Attributes in the record header are written without the '@' symbol per AI-DOCS v2.1
    const example = `user.profile.update version="2.0" // Updates user profile
    username    maxLength="32" // Display name
    password    minLength="8"

    @returns
        result    boolean

links.add method="POST"
    user_id    type="integer" min="0" max="4294967295"
    link_name  type="string" length_min="1" length_max="64"

    @returns
        link_id    type="integer"`;
    treeString.value = example;
    parseAndDisplay();
}

/**
 * Loads a complex DSL example demonstrating the macro system.
 * @returns {void}
 */
function loadMacroExample() {
    // Strictly follows AI-DOCS v2.1 rules:
    // 1. No '@' for record attributes.
    // 2. 4-space indentation.
    // 3. Proper macro invocation syntax.
    const macroExample = `#define-attr UInt32 type="integer" min="0" max="4294967295"
#define-attr String(min,max) type="string" length_min="{{min}}" length_max="{{max}}"

#define-block LinkFields
    link_id    #UInt32 is_primary
    user_id    #UInt32
    link_name  #String(1,64)
#end

#define-block LinkFieldsWithPrefix(prefix)
    {{prefix}}_id    #UInt32 is_primary
    {{prefix}}_name  #String(1,64)
#end

links.add method="POST" // No '@' symbol here
    #LinkFields
    active_mode_require_auth    #UInt32 min="0" max="255"

    @returns
        link_id    #UInt32

links.get method="GET" version="1.2"
    #LinkFieldsWithPrefix(link)
    extra_field    type="string"`;
    treeString.value = macroExample;
    parseAndDisplayWithMacros();
}

/**
 * Copies the current JSON output to the system clipboard.
 * @returns {void}
 */
function copyToClipboard() {
    const text = output.innerText;
    if (!text || text.includes('Click Parse')) return;
    navigator.clipboard
        .writeText(text)
        .then(() => {
            const originalText = copyButton.innerText;
            copyButton.innerText = 'Copied!';
            setTimeout(() => {
                copyButton.innerText = originalText;
            }, 1500);
        })
        .catch(() => {
            errorDiv.innerText = 'Failed to copy';
        });
}

// Event Listeners setup
parseButton.addEventListener('click', parseAndDisplay);
parseMacrosButton.addEventListener('click', parseAndDisplayWithMacros);
beautifyButton.addEventListener('click', beautify);
beautifyMacrosButton.addEventListener('click', beautifyWithMacros);
loadExampleButton.addEventListener('click', loadExample);
loadMacroExampleButton.addEventListener('click', loadMacroExample);
copyButton.addEventListener('click', copyToClipboard);

// Initialize with the macro example on startup
loadMacroExample();
