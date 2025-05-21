// @ts-check

import { Tree, treeFromString } from "../dist/meta-tree.esm.js";

const treeString = /** @type {HTMLTextAreaElement} */ (
    document.getElementById("tree-string")
);
const parseButton = /** @type {HTMLButtonElement} */ (
    document.getElementById("parse-button")
);
const output = /** @type {HTMLDivElement} */ (
    document.getElementById("output")
);

parseButton.addEventListener("click", () => {
    let tree = treeFromString(treeString.value);
    output.innerText = JSON.stringify(tree, null, 2);
    //tree.stringify();
    console.log(tree);
});
