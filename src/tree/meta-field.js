// @ts-check

import { parseHead, stringifyHead } from '../tools/head-parser.js';

export class MetaField {
    /** @type {string} */
    name;
    /** @type {Map<string, string>} */
    attributes = new Map();
    /** @type {boolean} */
    isOptional;
    /** @type {string|null} */
    defaultValue;
    /** @type {string|null} */
    description;

    /**
     * Creates a new Field.
     * @param {string} name - Field name (allowed: letters, digits, underscore, dot).
     * @param {boolean} [isOptional=false] - Whether the field is optional.
     * @param {string|null} [defaultValue=null] - Default value for optional field.
     * @param {string|null} [description=null] - Description/comment.
     * @throws {Error} When name is invalid.
     */
    constructor(name, isOptional = false, defaultValue = null, description = null) {
        if (typeof name !== 'string') {
            throw new Error(`Field name must be a string, got ${typeof name}`);
        }
        if (name.length === 0) {
            throw new Error('Field name cannot be empty');
        }
        if (!/^[a-zA-Z0-9_\.]+$/.test(name)) {
            throw new Error(
                `Invalid field name: "${name}" – allowed characters: a-z, A-Z, 0-9, _, .`
            );
        }
        this.name = name;
        this.isOptional = isOptional;
        this.defaultValue = defaultValue;
        this.description = description;
    }

    /**
     * Checks if an attribute exists.
     * @param {string} name - Attribute name.
     * @returns {boolean}
     */
    hasAttribute(name) {
        return this.attributes.has(name);
    }

    /**
     * Gets an attribute value.
     * @param {string} name - Attribute name.
     * @returns {string|null} Value or null if not set.
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
     * @param {string} name - Attribute name.
     * @param {number|string} [value=''] - Attribute value (empty string for valueless).
     */
    setAttribute(name, value = '') {
        if (typeof value !== 'string') value = String(value);
        this.attributes.set(name, value);
    }

    /**
     * Converts the field to its DSL string representation.
     * @returns {string}
     */
    stringify() {
        let namePart = this.name;
        if (this.isOptional) {
            if (this.defaultValue !== null && this.defaultValue !== '') {
                const escaped = JSON.stringify(this.defaultValue).slice(1, -1);
                namePart = `[${this.name}="${escaped}"]`;
            } else {
                namePart = `[${this.name}]`;
            }
        }
        const attrsDesc = stringifyHead('', this.attributes, this.description);
        if (attrsDesc) {
            return `${namePart}    ${attrsDesc}`;
        }
        return namePart;
    }

    /**
     * Returns a JSON-compatible object.
     * @returns {{
     *   name: string,
     *   isOptional: boolean,
     *   defaultValue: string|null,
     *   description: string|null,
     *   attributes: Array<[string, string]>
     * }}
     */
    toJSON() {
        return {
            name: this.name,
            isOptional: this.isOptional,
            defaultValue: this.defaultValue,
            description: this.description,
            attributes: Array.from(this.attributes.entries()),
        };
    }

    /**
     * Creates a deep copy of the field.
     * @returns {MetaField}
     */
    clone() {
        const f = new MetaField(this.name, this.isOptional, this.defaultValue, this.description);
        for (const [k, v] of this.attributes) f.setAttribute(k, v);
        return f;
    }

    /**
     * Renames the field.
     * @param {string} name - New name (validated).
     * @throws {Error} When name is invalid.
     */
    setName(name) {
        if (typeof name !== 'string' || !/^[a-zA-Z0-9_\.]+$/.test(name)) {
            throw new Error(`Invalid field name: ${name}`);
        }
        this.name = name;
    }

    /**
     * Returns the field name.
     * @returns {string}
     */
    getName() {
        return this.name;
    }
}
