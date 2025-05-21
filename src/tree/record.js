// @ts-check

import { Field } from "./field.js";
import { Section } from "./section.js";

export class Record {
    /** @type {string} */
    entityName;
    /** @type {string|null} */
    propertyName;
    /** @type {string|null} */
    verb;

    /** @type {Map<string, Section>} */
    sections;
    /** @type {Section} */
    mainSection;

    /** @type {string|null} */
    description;

    /**
     * Creates a new Record.
     * @param {string} entityName
     * @param {string|null} propertyName
     * @param {string|null} verb
     * @param {string|null} description
     */
    constructor(entityName, propertyName, verb, description = null) {
        this.entityName = entityName;
        this.propertyName = propertyName;
        this.verb = verb;

        if (/\s/.test(entityName))
            throw new Error(`Entity name cannot contain spaces: ${entityName}`);

        if (entityName.length === 0)
            throw new Error("Entity name cannot be empty");

        if (propertyName && /\s/.test(propertyName))
            throw new Error(
                `Property name cannot contain spaces: ${propertyName}`
            );

        if (propertyName && propertyName.length === 0)
            throw new Error("Property name cannot be empty");

        if (verb && /\s/.test(verb))
            throw new Error(`Verb cannot contain spaces: ${verb}`);

        if (verb && verb.length === 0) throw new Error("Verb cannot be empty");

        this.sections = new Map();

        this.mainSection = new Section("main");
        this.sections.set("main", this.mainSection);

        this.description = description;
    }

    /**
     * Constructs the full name of the record by concatenating the entity name,
     * property name, and verb, if they exist.
     * @return {string} The full name of the record.
     */
    getFullName() {
        let name = this.entityName;
        if (this.propertyName) name += "." + this.propertyName;
        if (this.verb) name += "." + this.verb;
        return name;
    }

    /**
     * Adds a new section to the record.
     * @param {string} name The name of the section to add. Must be unique and cannot contain spaces.
     * @throws Will throw an error if the section already exists.
     * @return {Section} The newly created section.
     */
    addSection(name) {
        if (this.sections.has(name))
            throw new Error(`Section already exists: ${name}`);

        let section = new Section(name);
        this.sections.set(name, section);
        return section;
    }

    /**
     * Retrieves a section from the record by its name.
     * @param {string} name The name of the section to retrieve.
     * @return {Section|null} The section if found, otherwise null.
     */
    getSection(name) {
        return this.sections.get(name) || null;
    }

    /**
     * Deletes a section from the record.
     * @param {string} name The name of the section to delete.
     */
    deleteSection(name) {
        this.sections.delete(name);
    }

    /**
     * Checks if a section exists in the record.
     * @param {string} name The name of the section to check.
     * @return {boolean} True if the section exists, false otherwise.
     */
    hasSection(name) {
        return this.sections.has(name);
    }

    /**
     * Sets a section in the record.
     * @param {Section} section The section to set.
     */
    setSection(section) {
        this.sections.set(section.name, section);
    }

    /**
     * Retrieves all sections in the record.
     * @return {Section[]} An array of all sections in the record.
     */
    getSections() {
        return Array.from(this.sections.values());
    }

    /**
     * Adds a field to a section in the record.
     * @param {Field} field The field to add.
     * @param {string} [sectionName="main"] The name of the section to add the field to. If the section does not exist, it will be created.
     */
    addField(field, sectionName = "main") {
        let section = this.sections.get(sectionName);
        if (!section) {
            section = this.addSection(sectionName);
        }
        section.addField(field);
    }

    /**
     * Retrieves a field from the record by its name and section.
     * @param {string} name The name of the field to retrieve.
     * @param {string} [sectionName="main"] The name of the section to retrieve the field from. Defaults to "main" if not specified.
     * @return {Field|null} The field if found, otherwise null.
     */
    getField(name, sectionName = "main") {
        let section = this.sections.get(sectionName);
        if (!section) return null;

        return section.getField(name);
    }

    /**
     * Checks if a field exists in a specified section of the record.
     * @param {string} name The name of the field to check.
     * @param {string} [sectionName="main"] The name of the section to check within. Defaults to "main" if not specified.
     * @return {boolean} True if the field exists in the specified section, false otherwise.
     */

    hasField(name, sectionName = "main") {
        let section = this.sections.get(sectionName);
        if (!section) return false;

        return section.hasField(name);
    }

    /**
     * Sets a field in a specified section of the record.
     * @param {Field} field The field to set.
     * @param {string} [sectionName="main"] The name of the section to set the field in. Defaults to "main" if not specified.
     */
    setField(field, sectionName = "main") {
        let section = this.sections.get(sectionName);
        if (!section) {
            section = this.addSection(sectionName);
        }
        section.setField(field);
    }

    /**
     * Deletes a field from a specified section of the record.
     * @param {string} name The name of the field to delete.
     * @param {string} [sectionName="main"] The name of the section to delete the field from. Defaults to "main" if not specified.
     */
    deleteField(name, sectionName = "main") {
        let section = this.sections.get(sectionName);
        if (!section) return null;

        section.deleteField(name);
    }

    /**
     * Retrieves all fields in the specified section of the record.
     * @param {string} [sectionName="main"] The name of the section to retrieve the fields from. Defaults to "main" if not specified.
     * @return {Field[]|null} The fields in the specified section, or null if the section does not exist.
     */
    getFields(sectionName = "main") {
        let section = this.sections.get(sectionName);
        if (!section) return null;

        return section.getFields();
    }

    #descriptionToString() {
        if (!this.description) {
            return "";
        }

        return (
            "// " +
            this.description.replace(/"/g, "&quot;").replace(/\r?\n/g, "\\n")
        ).trim();
    }

    /**
     * Converts the record to a string representation.
     * @return {string} The string representation of the record.
     */
    stringify() {
        let result = [];

        let name = this.getFullName();
        let desc = this.#descriptionToString();
        result.push(`${name}    ${desc}`.trim());

        for (let section of this.sections.values())
            result.push(section.stringify());
        return result.join("\n");
    }

    /**
     * Converts the record to a JSON-compatible object.
     * @returns {object} A JSON-compatible object with "name", "description", and "sections" properties.
     *                   The "sections" property is an array of JSON-compatible sections.
     */
    toJSON() {
        return {
            name: this.getFullName(),
            entityName: this.entityName,
            propertyName: this.propertyName,
            verb: this.verb,
            description: this.description,
            sections: Array.from(this.sections.values()).map((section) =>
                section.toJSON()
            ),
        };
    }
}
