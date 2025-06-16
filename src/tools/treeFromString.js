// @ts-check

import { Field, Record, Section, Tree } from "../index.js";

/**
 * Checks if a line is a record declaration.
 * A record declaration is a line that is not whitespace.
 * @param {string} line The line to check.
 * @returns {boolean} True if the line is a record declaration, false otherwise.
 */
function isRecordDeclaration(line) {
    return !/^\s/.test(line) && !isSectionDeclaration(line);
}

/**
 * Checks if a line is a section declaration.
 * A section declaration is a line that starts with "@", and is used to start a new section in the record.
 * @param {string} line The line to check.
 * @returns {boolean} True if the line is a section declaration, false otherwise.
 */
function isSectionDeclaration(line) {
    return line.startsWith("@");
}

/**
 * Parses a single record declaration line into a record object.
 * @param {string} line The record declaration line to parse.
 * @returns {{entityName: string, propertyName: string|null, actionName: string|null, description: string|null}} An object with the following properties:
 *     entityName: The name of the entity.
 *     propertyName: The name of the property, or null if not applicable.
 *     actionName: The actionName associated with the record, or null if not applicable.
 *     description: The description of the record, or null if not applicable.
 */
function parseRecordDeclaration(line) {
    line = line.trim();
    let fullName = line.split(/\s+/)[0];
    let d = line.split(/\/\//)[1]?.trim();
    /** @type {string|null} */
    let description = typeof d === "undefined" ? null : d;
    /** @type {string[]} */
    let nameParts = fullName.split(".");
    let entityName = nameParts[0];
    /** @type {string|null} */
    let propertyName = null;

    /** @type {string|null} */
    let actionName = null;

    nameParts.shift();

    if (nameParts.length > 0) {
        actionName = nameParts[nameParts.length - 1];
        nameParts.pop();
    }

    if (nameParts.length > 0) {
        propertyName = nameParts.join(".");
    }

    return { entityName, propertyName, actionName, description };
}

/**
 * Parses a section declaration line to extract the section name.
 * A section declaration line starts with "@" followed by the section name.
 * @param {string} line The section declaration line to parse.
 * @returns {string|null} The section name if matched, otherwise null.
 */
function parseSectionDeclaration(line) {
    let m = line.match(/^@([\w_\.]+)/);
    return m ? m[1] : null;
}

/**
 * Parses a string of HTML attributes into an object.
 * @param {string} inputString The string of HTML attributes to parse.
 * @returns {{attributes: Object.<string, string|null>, comment: string|null}} An object where each key is an attribute name and each value is the corresponding attribute value.
 */
function parseHtmlAttributes(inputString) {
    /** @type {Object.<string, string|null>} */
    const attributes = {};
    /** @type {string|null} */
    let comment = null;

    const attrRegex =
        /(\$?[^\s=]+)(?:\s*=\s*("(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\$?[^\s]*)|$)?/g;

    let match;
    while ((match = attrRegex.exec(inputString)) !== null) {
        const name = match[1];

        if (name.startsWith("//")) {
            comment = match.input.slice(match.index + 2).trim();
            if (comment == "") comment = null;
            break;
        }

        let rawValue = match[2];
        let value = null;

        if (rawValue) {
            // If the value is in quotes
            if (
                (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
                (rawValue.startsWith("'") && rawValue.endsWith("'"))
            ) {
                // Remove surrounding quotes and replace escaped quotes
                value = rawValue.slice(1, -1).replace(/\\(["'])/g, "$1");
            } else {
                // Value without quotes
                value = rawValue;
            }
        }

        attributes[name] = value;
    }

    return { attributes, comment };
}

/**
 * Parses a field declaration line into a field object.
 * A field declaration line is a line that defines a field in a record.
 * @param {string} line The field declaration line to parse.
 * @returns {Field} The parsed field object.
 */
function parseField(line) {
    /** @type {string|null} */
    let fieldName = null;

    /** @type {boolean} */
    let isOptional = false;
    /** @type {string|null} */
    let defaultValue = null;

    let attrsStr = "";
    /** @type {string|null} */
    let description = null;

    if (line.startsWith("[")) {
        let end = line.indexOf("]");
        if (end === -1) throw new Error(`Invalid field: ${line}`);
        let f = line.slice(1, end);
        let { attributes: attrs } = parseHtmlAttributes(f);
        let [name, value] = Object.entries(attrs)[0];
        fieldName = name;
        isOptional = true;
        defaultValue = value;

        attrsStr = line.slice(end + 1).trim();
    } else {
        let m = line.match(/^([a-zA-Z0-9_\.]+)/);
        fieldName = m ? m[1] : null;
        if (!fieldName) throw new Error(`Invalid field: ${line}`);

        isOptional = line[fieldName.length] === "?";
        attrsStr = line.slice(fieldName.length + (isOptional ? 1 : 0)).trim();
    }

    let field = new Field(fieldName, isOptional, defaultValue);

    let { attributes: attrs, comment } = parseHtmlAttributes(attrsStr);
    for (let [name, value] of Object.entries(attrs)) {
        field.setAttribute(name, value);
    }

    field.description = comment;

    return field;
}

/**
 * Parses a tree string into a tree object.
 * @param {string} treeString A string describing a tree, with each record on a new line and fields separated by pipes.
 * @returns {Tree} The parsed tree object.
 */
function treeFromString(treeString) {
    let tree = new Tree();
    let lines = treeString.split("\n");
    let currentRecord = null;
    let currentSectionName = "main";

    for (let line of lines) {
        if (line.trim() === "") continue;

        if (isRecordDeclaration(line)) {
            let { entityName, propertyName, actionName, description } =
                parseRecordDeclaration(line);
            currentRecord = tree.addRecord(
                entityName,
                propertyName,
                actionName,
                description
            );

            currentSectionName = "main";
            continue;
        }

        if (currentRecord === null) continue;
        line = line.trim();

        if (isSectionDeclaration(line)) {
            let sectionName = parseSectionDeclaration(line);
            if (!sectionName) continue;

            currentRecord.addSection(sectionName);
            currentSectionName = sectionName;
            continue;
        }

        if (line === "") continue;

        let field = parseField(line);
        currentRecord.addField(field, currentSectionName);
    }

    return tree;
}

export { treeFromString };
