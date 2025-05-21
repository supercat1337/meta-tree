// @ts-check

import { Field } from "./field.js";

export class Section {
    /** @type {string} */
    name;
    /** @type {Map<string, Field>} */
    fields = new Map();

    /**
     * @param {string} name
     */
    constructor(name) {
        if (/\s/.test(name))
            throw new Error(`Section name cannot contain spaces: ${name}`);

        if (name.length === 0) throw new Error("Section name cannot be empty");

        this.name = name;
    }

    /**
     * Adds a field to the section.
     * @param {Field} field The field to add.
     */
    addField(field) {
        if (this.hasField(field.name))
            throw new Error(`Field already exists: ${field.name}`);

        this.fields.set(field.name, field);
    }

    /**
     * Checks if a field exists in the section.
     * @param {string} name The name of the field to check.
     * @return {boolean} True if the field exists, false if not.
     */
    hasField(name) {
        return this.fields.has(name);
    }

    /**
     * Retrieves a field from the section by its name.
     * @param {string} name The name of the field to retrieve.
     * @return {Field|null} The field if found, otherwise null.
     */
    getField(name) {
        let field = this.fields.get(name);
        if (!field) return null;

        return field;
    }

    /**
     * Sets a field in the section by its name.
     * @param {Field} field The field to set.
     * @throws Will throw an error if the field already exists.
     */
    setField(field) {
        this.fields.set(field.name, field);
    }

    /**
     * Deletes a field from the section by its name.
     * @param {string} name The name of the field to delete.
     */
    deleteField(name) {
        this.fields.delete(name);
    }

    /**
     * Retrieves all fields in the section.
     * @return {Field[]} An array of all fields in the section.
     */
    getFields() {
        return Array.from(this.fields.values());
    }

    /**
     * @return {string} The string representation of the section.
     */
    stringify(padding = "    ") {
        let fieldsArray = [];
        this.fields.forEach((field) => {
            fieldsArray.push(field.stringify());
        });

        let fields = fieldsArray.map((field) => padding + field).join("\n");

        if (this.name == "main") {
            return `${fields}\n`;
        } else {
            return `${padding + "@" + this.name}\n${fields}\n`;
        }
    }

    /**
     * Converts the section to a JSON-compatible object.
     * @returns {object} A JSON-compatible object with "name" and "fields" properties.
     *                   The "fields" property is an array of JSON-compatible fields.
     */
    toJSON() {
        return {
            name: this.name,
            fields: Array.from(this.fields.values()).map((field) =>
                field.toJSON()
            ),
        };
    }
}
