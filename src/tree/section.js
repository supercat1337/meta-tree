// @ts-check

import { Field } from './field.js';
import { stringifyHead, parseHead } from '../tools/head-parser.js';

export class Section {
    /** @type {string} */
    name;
    /** @type {Map<string, Field>} */
    fields = new Map();
    /** @type {Map<string, string>} */
    attributes = new Map();
    /** @type {string|null} */
    description = null;

    /**
     * Creates a new Section.
     * @param {string} name - Section name (no spaces, allowed: letters, digits, underscore, dot, hyphen).
     * @param {Object<string, string>} [attributes] - Section attributes.
     * @param {string|null} [description] - Section description.
     * @throws {Error} When name is invalid.
     */
    constructor(name, attributes = {}, description = null) {
        if (typeof name !== 'string') {
            throw new Error(`Section name must be a string, got ${typeof name}`);
        }
        if (name.length === 0) {
            throw new Error('Section name cannot be empty');
        }
        if (/\s/.test(name)) {
            throw new Error(`Section name cannot contain spaces: "${name}"`);
        }
        if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
            throw new Error(
                `Invalid section name: "${name}" – allowed characters: a-z, A-Z, 0-9, _, ., -`
            );
        }
        this.name = name;
        this.description = description;
        for (const [k, v] of Object.entries(attributes)) this.setAttribute(k, v);
    }

    /**
     * Adds a field. Throws if a field with the same name already exists.
     * @param {Field} field
     * @throws {Error} When field name already exists.
     */
    addField(field) {
        if (this.hasField(field.name)) throw new Error(`Field already exists: ${field.name}`);
        this.setField(field);
    }

    /**
     * Checks if a field exists.
     * @param {string} name
     * @returns {boolean}
     */
    hasField(name) {
        return this.fields.has(name);
    }

    /**
     * Retrieves a field by name.
     * @param {string} name
     * @returns {Field|null}
     */
    getField(name) {
        return this.fields.get(name) || null;
    }

    /**
     * Sets a field (overwrites if exists).
     * @param {Field} field
     */
    setField(field) {
        this.fields.set(field.name, field);
    }

    /**
     * Deletes a field.
     * @param {string} name
     */
    deleteField(name) {
        this.fields.delete(name);
    }

    /**
     * Returns all fields in the section.
     * @returns {Field[]}
     */
    getFields() {
        return Array.from(this.fields.values());
    }

    /**
     * Returns all field names.
     * @returns {string[]}
     */
    getFieldNames() {
        return Array.from(this.fields.keys());
    }

    /**
     * Checks if an attribute exists.
     * @param {string} name
     * @returns {boolean}
     */
    hasAttribute(name) {
        return this.attributes.has(name);
    }

    /**
     * Gets an attribute value.
     * @param {string} name
     * @returns {string|null}
     */
    getAttribute(name) {
        return this.attributes.get(name) ?? null;
    }

    /**
     * Deletes an attribute.
     * @param {string} name
     */
    deleteAttribute(name) {
        this.attributes.delete(name);
    }

    /**
     * Sets an attribute.
     * @param {string} name
     * @param {string} value
     */
    setAttribute(name, value) {
        this.attributes.set(name, value);
    }

    /**
     * Returns the DSL string representation of the section.
     * @param {string} [padding='    '] - Indentation string.
     * @returns {string}
     */
    stringify(padding = '    ') {
        const fieldsArray = this.getFields().map(f => f.stringify());
        if (fieldsArray.length === 0 && this.name === 'main') return '';
        const fieldsStr = fieldsArray.map(f => padding + f).join('\n');
        if (this.name === 'main') return fieldsStr;

        // For named sections, add padding before the header
        const header = stringifyHead(`@${this.name}`, this.attributes, this.description);
        const indentedHeader = padding + header;
        if (fieldsStr) return `${indentedHeader}\n${fieldsStr}`;
        return indentedHeader;
    }

    /**
     * Returns a JSON-compatible object.
     * @returns {{
     *   name: string,
     *   description: string|null,
     *   attributes: Array<[string, string]>,
     *   fields: Array<ReturnType<Field['toJSON']>>
     * }}
     */
    toJSON() {
        return {
            name: this.name,
            description: this.description,
            attributes: Array.from(this.attributes.entries()),
            fields: this.getFields().map(f => f.toJSON()),
        };
    }

    /**
     * Creates a deep copy of the section.
     * @returns {Section}
     */
    clone() {
        const section = new Section(
            this.name,
            Object.fromEntries(this.attributes),
            this.description
        );
        for (const f of this.getFields()) section.addField(f.clone());
        return section;
    }

    /**
     * Renames the section.
     * @param {string} newName
     * @throws {Error} When name is invalid.
     */
    setName(newName) {
        if (newName.length === 0) throw new Error('Section name cannot be empty');
        if (/\s/.test(newName)) throw new Error(`Section name cannot contain spaces: ${newName}`);
        if (!/^[a-zA-Z0-9_.-]+$/.test(newName)) throw new Error(`Invalid section name: ${newName}`);
        this.name = newName;
    }

    /**
     * Returns the section name.
     * @returns {string}
     */
    getName() {
        return this.name;
    }
}
