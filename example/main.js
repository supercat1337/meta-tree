// @ts-check
import { Tree, treeFromString } from "../dist/meta-tree.esm.js";

const treeString = document.getElementById("tree-string");
const parseButton = document.getElementById("parse-button");
const beautifyButton = document.getElementById("beautify-button");
const output = document.getElementById("output");
const errorDiv = document.getElementById("error");

function parseAndDisplay() {
    try {
        const tree = treeFromString(treeString.value);
        output.innerText = JSON.stringify(tree, null, 2);
        errorDiv.innerText = "";
    } catch (err) {
        errorDiv.innerText = `Parse error: ${err.message}`;
        output.innerText = "";
    }
}

function beautify() {
    try {
        const tree = treeFromString(treeString.value);
        treeString.value = tree.stringify();
        parseAndDisplay(); 
    } catch (err) {
        errorDiv.innerText = `Cannot beautify: ${err.message}`;
    }
}

parseButton.addEventListener("click", parseAndDisplay);
beautifyButton.addEventListener("click", beautify);