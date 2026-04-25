// @ts-check

import { MetaField } from './meta-field.js';
import { MetaSection } from './meta-section.js';
import { getVerbFromActionName } from '../tools/tools.js';
import { stringifyHead } from '../tools/head-parser.js';

export class MetaRecord {
    /** @type {string} */
    entityName;
    /** @type {string|null} */
    propertyName;
    /** @type {string|null} */
    actionName;
    /** @type {"get"|"set"|"add"|"delete"|"list"|"check"|"other"|null} */
    verb;
    /** @type {Map<string, MetaSection>} */
    sections;
    /** @type {MetaSection} */
    mainSection;
    /** @type {string|null} */
    description;
    /** @type {Map<string, string>} */
    attributes = new Map();

    /**
     * Creates a new Record.
     * @param {string} entityName - Entity name (letters, digits, underscore, hyphen).
     * @param {string|null} [propertyName] - Property name (optional, may contain dots).
     * @param {string|null} [actionName] - Action name (optional).
     * @param {string|null} [description] - Record description.
     * @param {Object<string, string>} [attributes] - Record attributes.
     * @throws {Error} When any name is invalid.
     */
    constructor(entityName, propertyName = null, actionName = null, description = null, attributes = {}) {
        if (typeof entityName !== 'string' || entityName.length === 0) {
            throw new Error(`Entity name must be a non-empty string, got "${entityName}"`);
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(entityName)) {
            throw new Error(
                `Invalid entity name: "${entityName}" – allowed characters: a-z, A-Z, 0-9, _, -`
            );
        }
        if (propertyName !== null) {
            if (typeof propertyName !== 'string' || propertyName.length === 0) {
                throw new Error(
                    `Property name must be a non-empty string or null, got "${propertyName}"`
                );
            }
            if (!/^[a-zA-Z0-9_.-]+$/.test(propertyName)) {
                throw new Error(
                    `Invalid property name: "${propertyName}" – allowed characters: a-z, A-Z, 0-9, _, ., -`
                );
            }
        }
        if (actionName !== null) {
            if (typeof actionName !== 'string' || actionName.length === 0) {
                throw new Error(
                    `Action name must be a non-empty string or null, got "${actionName}"`
                );
            }
            if (!/^[a-zA-Z0-9_-]+$/.test(actionName)) {
                throw new Error(
                    `Invalid action name: "${actionName}" – allowed characters: a-z, A-Z, 0-9, _, -`
                );
            }
        }

        this.entityName = entityName;
        this.propertyName = propertyName;
        this.actionName = actionName;
        this.verb = getVerbFromActionName(actionName);
        this.description = description;

        this.sections = new Map();
        this.mainSection = new MetaSection('main');
        this.sections.set('main', this.mainSection);

        for (const [k, v] of Object.entries(attributes)) this.setAttribute(k, v);
    }

    /**
     * Constructs full record name: entity.property.action.
     * @returns {string}
     */
    getFullName() {
        let name = this.entityName;
        if (this.propertyName) name += '.' + this.propertyName;
        if (this.actionName) name += '.' + this.actionName;
        return name;
    }

    /**
     * Adds a new section.
     * @param {string} name - Section name (unique).
     * @param {Object<string, string>} [attributes] - Section attributes.
     * @param {string|null} [description] - Section description.
     * @returns {MetaSection} The newly created section.
     * @throws {Error} When section already exists.
     */
    addSection(name, attributes = {}, description = null) {
        if (this.sections.has(name)) throw new Error(`Section already exists: ${name}`);
        const section = new MetaSection(name, attributes, description);
        this.sections.set(name, section);
        if (name === 'main') this.mainSection = section;
        return section;
    }

    /**
     * Retrieves a section by name.
     * @param {string} name
     * @returns {MetaSection|null}
     */
    getSection(name) {
        return this.sections.get(name) || null;
    }

    /**
     * Deletes a section (cannot delete 'main').
     * @param {string} name
     * @throws {Error} When trying to delete 'main' section.
     */
    deleteSection(name) {
        if (name === 'main') throw new Error('Cannot delete the main section');
        this.sections.delete(name);
    }

    /**
     * Checks if a section exists.
     * @param {string} name
     * @returns {boolean}
     */
    hasSection(name) {
        return this.sections.has(name);
    }

    /**
     * Sets a section (overwrites if exists). Updates mainSection reference if name is 'main'.
     * @param {MetaSection} section
     */
    setSection(section) {
        this.sections.set(section.name, section);
        if (section.name === 'main') this.mainSection = section;
    }

    /**
     * Returns all sections.
     * @returns {MetaSection[]}
     */
    getSections() {
        return Array.from(this.sections.values());
    }

    /**
     * Returns the main section.
     * @returns {MetaSection}
     */
    getMainSection() {
        return this.mainSection;
    }

    /**
     * Adds a field to a section (creates the section if it does not exist).
     * @param {MetaField} field
     * @param {string} [sectionName='main']
     */
    addField(field, sectionName = 'main') {
        let section = this.sections.get(sectionName);
        if (!section) section = this.addSection(sectionName);
        section.addField(field);
    }

    /**
     * Retrieves a field from a section.
     * @param {string} name
     * @param {string} [sectionName='main']
     * @returns {MetaField|null}
     */
    getField(name, sectionName = 'main') {
        const section = this.sections.get(sectionName);
        return section ? section.getField(name) : null;
    }

    /**
     * Checks if a field exists in a section.
     * @param {string} name
     * @param {string} [sectionName='main']
     * @returns {boolean}
     */
    hasField(name, sectionName = 'main') {
        const section = this.sections.get(sectionName);
        return section ? section.hasField(name) : false;
    }

    /**
     * Sets a field in a section (creates section if needed, overwrites existing field).
     * @param {MetaField} field
     * @param {string} [sectionName='main']
     */
    setField(field, sectionName = 'main') {
        let section = this.sections.get(sectionName);
        if (!section) section = this.addSection(sectionName);
        section.setField(field);
    }

    /**
     * Deletes a field from a section.
     * @param {string} name
     * @param {string} [sectionName='main']
     * @returns {boolean} True if the field existed and was deleted.
     */
    deleteField(name, sectionName = 'main') {
        const section = this.sections.get(sectionName);
        if (!section) return false;
        const existed = section.hasField(name);
        section.deleteField(name);
        return existed;
    }

    /**
     * Returns all fields in a section.
     * @param {string} [sectionName='main']
     * @returns {MetaField[]}
     */
    getFields(sectionName = 'main') {
        const section = this.sections.get(sectionName);
        return section ? section.getFields() : [];
    }

    /**
     * Checks if an attribute exists on the record.
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
     * Sets an attribute on the record.
     * @param {string} name
     * @param {string} value
     */
    setAttribute(name, value) {
        this.attributes.set(name, value);
    }

    /**
     * Returns the DSL string representation of the record.
     * @returns {string}
     */
    stringify() {
        const fullName = this.getFullName();
        const header = stringifyHead(fullName, this.attributes, this.description);
        const parts = [header];
        for (const section of this.sections.values()) {
            const secStr = section.stringify();
            if (secStr) parts.push(secStr);
        }
        return parts.join('\n');
    }

    /**
     * Returns a JSON-compatible object.
     * @returns {{
     *   name: string,
     *   entityName: string,
     *   propertyName: string|null,
     *   actionName: string|null,
     *   verb: string|null,
     *   description: string|null,
     *   attributes: Array<[string, string]>,
     *   sections: Array<ReturnType<MetaSection['toJSON']>>
     * }}
     */
    toJSON() {
        return {
            name: this.getFullName(),
            entityName: this.entityName,
            propertyName: this.propertyName,
            actionName: this.actionName,
            verb: this.verb,
            description: this.description,
            attributes: Array.from(this.attributes.entries()),
            sections: this.getSections().map(s => s.toJSON()),
        };
    }

    /**
     * Creates a deep copy of the record.
     * @returns {MetaRecord}
     */
    clone() {
        const record = new MetaRecord(
            this.entityName,
            this.propertyName,
            this.actionName,
            this.description,
            Object.fromEntries(this.attributes)
        );
        for (const [name, section] of this.sections) {
            if (name === 'main') {
                for (const f of section.getFields()) record.mainSection.setField(f.clone());
            } else {
                record.setSection(section.clone());
            }
        }
        return record;
    }
}
