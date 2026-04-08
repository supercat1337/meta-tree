// @ts-check
import { treeFromString } from '../dist/meta-tree.esm.js';

const treeString = document.getElementById('tree-string');
const parseButton = document.getElementById('parse-button');
const beautifyButton = document.getElementById('beautify-button');
const loadExampleButton = document.getElementById('load-example');
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
beautifyButton.addEventListener('click', beautify);
loadExampleButton.addEventListener('click', loadExample);
copyButton.addEventListener('click', copyToClipboard);

// Load example on startup
loadExample();
