// @ts-check
import { treeFromString, treeFromStringWithMacros } from '../dist/meta-tree.esm.js';

const treeString = document.getElementById('tree-string');
const parseButton = document.getElementById('parse-button');
const parseMacrosButton = document.getElementById('parse-macros-button');
const beautifyButton = document.getElementById('beautify-button');
const beautifyMacrosButton = document.getElementById('beautify-macros-button');
const loadExampleButton = document.getElementById('load-example');
const loadMacroExampleButton = document.getElementById('load-macro-example');
const copyButton = document.getElementById('copy-output');
const output = document.getElementById('output');
const errorDiv = document.getElementById('error');

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

function loadExample() {
    const example = `user.profile.update
    username    maxLength="32" // Display name
    password    minLength="8"

    @returns
    result    boolean

links.add
    user_id    type="integer" min="0" max="4294967295"
    link_name  type="string" length_min="1" length_max="64"

    @returns
    link_id    type="integer"`;
    treeString.value = example;
    parseAndDisplay();
}

function loadMacroExample() {
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

links.add
    #LinkFields
    active_mode_require_auth    #UInt32 min="0" max="255"

    @returns
        link_id    #UInt32

links.get
    #LinkFieldsWithPrefix(link)
    extra_field    type="string"`;
    treeString.value = macroExample;
    parseAndDisplayWithMacros();
}

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

parseButton.addEventListener('click', parseAndDisplay);
parseMacrosButton.addEventListener('click', parseAndDisplayWithMacros);
beautifyButton.addEventListener('click', beautify);
beautifyMacrosButton.addEventListener('click', beautifyWithMacros);
loadExampleButton.addEventListener('click', loadExample);
loadMacroExampleButton.addEventListener('click', loadMacroExample);
copyButton.addEventListener('click', copyToClipboard);

// Load macro example on startup (or regular example, choose one)
loadMacroExample();
