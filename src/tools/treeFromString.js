// @ts-check

import { MetaField, formatLocationInTree, MetaRecord, MetaTree } from '../index.js';
import { parseHead, parseAttributesAndComment } from './head-parser.js';
import { preprocessMacros } from './macro-preprocessor.js';

/**
 * Checks if a line is a record declaration (no leading whitespace and not a section).
 * @param {string} line
 * @returns {boolean}
 */
function isRecordDeclaration(line) {
    return !/^\s/.test(line) && !isSectionDeclaration(line);
}

/**
 * Checks if a line is a section declaration (starts with '@' after optional whitespace).
 * @param {string} line
 * @returns {boolean}
 */
function isSectionDeclaration(line) {
    return line.trim().startsWith('@');
}

/**
 * Parses a section line (e.g., "@returns array=true // comment").
 * @param {string} line
 * @returns {{name: string, attributes: Map<string, string>, description: string|null} | null}
 */
function parseSectionLine(line) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('@')) return null;
    const withoutAt = trimmed.slice(1);
    const { name, attributes, description } = parseHead(withoutAt);
    return { name, attributes, description };
}

/**
 * Parses a field line (including optional/default bracket syntax).
 * @param {string} line
 * @returns {MetaField}
 * @throws {Error} When field syntax is invalid.
 */
function parseField(line) {
    const trimmed = line.trim();
    if (trimmed === '') throw new Error('Empty field line');

    let fieldName = '';
    let isOptional = false;
    let defaultValue = null;
    let rest = '';

    // Check for optional/default syntax: [name] or [name="value"]
    if (trimmed.startsWith('[')) {
        const endBracket = trimmed.indexOf(']');
        if (endBracket === -1) throw new Error(`Invalid field (missing closing bracket): ${line}`);
        const bracketContent = trimmed.slice(1, endBracket);
        const eqPos = bracketContent.indexOf('=');
        if (eqPos !== -1) {
            // [name="value"]
            fieldName = bracketContent.slice(0, eqPos).trim();
            let valuePart = bracketContent.slice(eqPos + 1).trim();
            // Remove surrounding quotes if present
            if (
                (valuePart.startsWith('"') && valuePart.endsWith('"')) ||
                (valuePart.startsWith("'") && valuePart.endsWith("'"))
            ) {
                valuePart = valuePart.slice(1, -1);
                try {
                    defaultValue = JSON.parse('"' + valuePart + '"');
                } catch (e) {
                    defaultValue = valuePart;
                }
            } else {
                defaultValue = valuePart;
            }
            isOptional = true;
        } else {
            // [name]
            fieldName = bracketContent.trim();
            isOptional = true;
            defaultValue = null;
        }
        rest = trimmed.slice(endBracket + 1).trim();
    } else {
        // Regular field: name? attrs...
        const nameMatch = trimmed.match(/^[a-zA-Z0-9_\.]+/);
        if (!nameMatch) throw new Error(`Invalid field name: ${line}`);
        fieldName = nameMatch[0];
        let afterName = trimmed.slice(fieldName.length);
        if (afterName.startsWith('?')) {
            isOptional = true;
            afterName = afterName.slice(1);
        } else {
            isOptional = false;
        }
        rest = afterName.trim();
    }

    const field = new MetaField(fieldName, isOptional, defaultValue);
    if (rest) {
        const { attributes, description } = parseAttributesAndComment(rest);
        for (const [k, v] of attributes) field.setAttribute(k, v);
        if (description) field.description = description;
    }
    return field;
}

/**
 * Parses a tree string into a Tree object.
 * @param {string} treeString - The DSL string.
 * @returns {MetaTree}
 */
export function treeFromString(treeString) {
    const tree = new MetaTree();
    const lines = treeString.split('\n');
    /** @type {null|MetaRecord} */
    let currentRecord = null;
    let currentSectionName = 'main';

    /** @returns {string} */
    function getCurrentPosition() {
        let recordName = currentRecord?.getFullName() || '';
        let pos = formatLocationInTree({ recordName, sectionName: currentSectionName });
        return pos;
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        const lineNumber = i + 1;
        if (trimmed === '' || trimmed.startsWith('//')) continue;

        try {
            if (isRecordDeclaration(line)) {
                const { name, attributes, description } = parseHead(line);
                // name is like "entity.property.action" or "entity.property" or "entity"
                const parts = name.split('.');
                const entityName = parts[0];
                let propertyName = null;
                let actionName = null;
                if (parts.length > 1) {
                    actionName = parts[parts.length - 1];
                    if (parts.length > 2) {
                        propertyName = parts.slice(1, -1).join('.');
                    } else {
                        propertyName = null;
                    }
                }
                currentRecord = tree.addRecord(entityName, propertyName, actionName, description);
                for (const [k, v] of attributes) currentRecord.setAttribute(k, v);

                const explicitVerb = currentRecord.getAttribute('verb');
                if (explicitVerb !== null) {
                    const allowed = ['get', 'set', 'add', 'delete', 'list', 'check', 'other'];
                    if (!allowed.includes(explicitVerb)) {
                        throw new Error(
                            `Invalid verb value: "${explicitVerb}" at line ${lineNumber} (${getCurrentPosition()})`
                        );
                    }
                    // @ts-ignore
                    currentRecord.verb = explicitVerb;
                }

                currentSectionName = 'main';
                continue;
            }

            if (currentRecord === null) continue;

            if (trimmed === '') continue;

            if (isSectionDeclaration(trimmed)) {
                const parsed = parseSectionLine(trimmed);
                if (!parsed) continue;
                const { name, attributes, description } = parsed;
                let section = currentRecord.getSection(name);
                if (!section) {
                    section = currentRecord.addSection(
                        name,
                        Object.fromEntries(attributes),
                        description
                    );
                } else {
                    for (const [k, v] of attributes) section.setAttribute(k, v);
                    if (description) section.description = description;
                }
                currentSectionName = name;
                continue;
            }

            // Otherwise it's a field line
            const field = parseField(trimmed);
            currentRecord.addField(field, currentSectionName);
        } catch (e) {
            let err = e instanceof Error ? e : new Error(String(e));
            // @ts-ignore
            if (!err.line) {
                let position = getCurrentPosition();
                let postfix = position ? ` (${position})` : '';
                let message = `${err.message} (at line ${lineNumber})${postfix}`;

                err.message = message;
                // @ts-ignore
                err.lineNumber = lineNumber;
                // @ts-ignore
                err.line = line;
            }
            throw err;
        }
    }

    return tree;
}

/**
 * Parses a tree string with macro preprocessing.
 * @param {string} treeString
 * @param {Object<string, Macro>} [implicitMacros]
 * @returns {MetaTree}
 */
export function treeFromStringWithMacros(treeString, implicitMacros = {}) {
    const expanded = preprocessMacros(treeString, implicitMacros);
    return treeFromString(expanded);
}
