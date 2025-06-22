export class Field {
    /**
     * @param {string} name
     * @param {boolean} [isOptional=false]
     * @param {string|null} [defaultValue=null]
     * @param {string|null} [description=null]
     */
    constructor(name: string, isOptional?: boolean, defaultValue?: string | null, description?: string | null);
    /** @type {string} */
    name: string;
    /** @type {Map<string, string>} */
    attributes: Map<string, string>;
    /** @type {boolean} */
    isOptional: boolean;
    /** @type {string|null} */
    defaultValue: string | null;
    /** @type {string|null} */
    description: string | null;
    /**
     * @param {string} name
     * @return {boolean}
     */
    hasAttribute(name: string): boolean;
    /**
     * @param {string} name
     * @return {string|null}
     */
    getAttribute(name: string): string | null;
    /**
     * Deletes an attribute from the field.
     * @param {string} name The name of the attribute to delete.
     */
    deleteAttribute(name: string): void;
    /**
     * Sets an attribute for the field.
     * @param {string} name
     * @param {number|string} [value=null]
     */
    setAttribute(name: string, value?: number | string): void;
    stringify(): string;
    /**
     * Converts the field to a JSON-compatible object.
     * @returns {object} A JSON-compatible object with "name", "isOptional", "defaultValue",
     *                   "description", and "attributes" properties. The "attributes" property
     *                   is an array of key-value pairs representing the field's attributes.
     */
    toJSON(): object;
    #private;
}
export class Record {
    /**
     * Creates a new Record.
     * @param {string} entityName
     * @param {string|null} propertyName
     * @param {string|null} actionName
     * @param {string|null} description
     */
    constructor(entityName: string, propertyName: string | null, actionName?: string | null, description?: string | null);
    /** @type {string} */
    entityName: string;
    /** @type {string|null} */
    propertyName: string | null;
    /** @type {string|null} */
    actionName: string | null;
    /** @type {"get"|"set"|"add"|"delete"|"list"|"check"|null} */
    verb: "get" | "set" | "add" | "delete" | "list" | "check" | null;
    /** @type {Map<string, Section>} */
    sections: Map<string, Section>;
    /** @type {Section} */
    mainSection: Section;
    /** @type {string|null} */
    description: string | null;
    /**
     * Constructs the full name of the record by concatenating the entity name,
     * property name, and verb, if they exist.
     * @return {string} The full name of the record.
     */
    getFullName(): string;
    /**
     * Adds a new section to the record.
     * @param {string} name The name of the section to add. Must be unique and cannot contain spaces.
     * @throws Will throw an error if the section already exists.
     * @return {Section} The newly created section.
     */
    addSection(name: string): Section;
    /**
     * Retrieves a section from the record by its name.
     * @param {string} name The name of the section to retrieve.
     * @return {Section|null} The section if found, otherwise null.
     */
    getSection(name: string): Section | null;
    /**
     * Deletes a section from the record.
     * @param {string} name The name of the section to delete.
     */
    deleteSection(name: string): void;
    /**
     * Checks if a section exists in the record.
     * @param {string} name The name of the section to check.
     * @return {boolean} True if the section exists, false otherwise.
     */
    hasSection(name: string): boolean;
    /**
     * Sets a section in the record.
     * @param {Section} section The section to set.
     */
    setSection(section: Section): void;
    /**
     * Retrieves all sections in the record.
     * @return {Section[]} An array of all sections in the record.
     */
    getSections(): Section[];
    /**
     * Adds a field to a section in the record.
     * @param {Field} field The field to add.
     * @param {string} [sectionName="main"] The name of the section to add the field to. If the section does not exist, it will be created.
     */
    addField(field: Field, sectionName?: string): void;
    /**
     * Retrieves a field from the record by its name and section.
     * @param {string} name The name of the field to retrieve.
     * @param {string} [sectionName="main"] The name of the section to retrieve the field from. Defaults to "main" if not specified.
     * @return {Field|null} The field if found, otherwise null.
     */
    getField(name: string, sectionName?: string): Field | null;
    /**
     * Checks if a field exists in a specified section of the record.
     * @param {string} name The name of the field to check.
     * @param {string} [sectionName="main"] The name of the section to check within. Defaults to "main" if not specified.
     * @return {boolean} True if the field exists in the specified section, false otherwise.
     */
    hasField(name: string, sectionName?: string): boolean;
    /**
     * Sets a field in a specified section of the record.
     * @param {Field} field The field to set.
     * @param {string} [sectionName="main"] The name of the section to set the field in. Defaults to "main" if not specified.
     */
    setField(field: Field, sectionName?: string): void;
    /**
     * Deletes a field from a specified section of the record.
     * @param {string} name The name of the field to delete.
     * @param {string} [sectionName="main"] The name of the section to delete the field from. Defaults to "main" if not specified.
     */
    deleteField(name: string, sectionName?: string): any;
    /**
     * Retrieves all fields in the specified section of the record.
     * @param {string} [sectionName="main"] The name of the section to retrieve the fields from. Defaults to "main" if not specified.
     * @return {Field[]|null} The fields in the specified section, or null if the section does not exist.
     */
    getFields(sectionName?: string): Field[] | null;
    /**
     * Converts the record to a string representation.
     * @return {string} The string representation of the record.
     */
    stringify(): string;
    /**
     * Converts the record to a JSON-compatible object.
     * @returns {object} A JSON-compatible object with "name", "description", and "sections" properties.
     *                   The "sections" property is an array of JSON-compatible sections.
     */
    toJSON(): object;
    #private;
}
export class Section {
    /**
     * @param {string} name
     */
    constructor(name: string);
    /** @type {string} */
    name: string;
    /** @type {Map<string, Field>} */
    fields: Map<string, Field>;
    /**
     * Adds a field to the section.
     * @param {Field} field The field to add.
     */
    addField(field: Field): void;
    /**
     * Checks if a field exists in the section.
     * @param {string} name The name of the field to check.
     * @return {boolean} True if the field exists, false if not.
     */
    hasField(name: string): boolean;
    /**
     * Retrieves a field from the section by its name.
     * @param {string} name The name of the field to retrieve.
     * @return {Field|null} The field if found, otherwise null.
     */
    getField(name: string): Field | null;
    /**
     * Sets a field in the section by its name.
     * @param {Field} field The field to set.
     * @throws Will throw an error if the field already exists.
     */
    setField(field: Field): void;
    /**
     * Deletes a field from the section by its name.
     * @param {string} name The name of the field to delete.
     */
    deleteField(name: string): void;
    /**
     * Retrieves all fields in the section.
     * @return {Field[]} An array of all fields in the section.
     */
    getFields(): Field[];
    /**
     * @return {string} The string representation of the section.
     */
    stringify(padding?: string): string;
    /**
     * Converts the section to a JSON-compatible object.
     * @returns {object} A JSON-compatible object with "name" and "fields" properties.
     *                   The "fields" property is an array of JSON-compatible fields.
     */
    toJSON(): object;
}
export class Tree {
    /** @type {Map<string, Record>} */
    records: Map<string, Record>;
    /**
     * Adds a new record to the tree.
     * @param {string} entityName - The name of the entity for the record.
     * @param {string|null} propertyName - The name of the property for the record, or null if not applicable.
     * @param {string|null} actionName - The actionName associated with the record, or null if not applicable.
     * @param {string|null} description - The description of the record, or null if not applicable.
     * @returns {Record} The newly created record.
     */
    addRecord(entityName: string, propertyName?: string | null, actionName?: string | null, description?: string | null): Record;
    /**
     * Checks if a record exists in the tree by its full name.
     * @param {string} recordFullName - The full name of the record to check.
     * @returns {boolean} True if the record exists, false otherwise.
     */
    hasRecord(recordFullName: string): boolean;
    /**
     * Retrieves a record from the tree by its full name.
     * @param {string} recordFullName - The full name of the record to retrieve.
     * @returns {Record|null} The record if found, otherwise null.
     */
    getRecord(recordFullName: string): Record | null;
    /**
     * Deletes a record from the tree by its full name.
     * @param {string} recordFullName - The full name of the record to delete.
     */
    deleteRecord(recordFullName: string): void;
    /**
     * Retrieves all records in the tree.
     * @returns {Record[]} An array of all records in the tree.
     */
    getRecords(): Record[];
    /**
     * Sets a record in the tree, overwriting any existing record with the same full name.
     * @param {Record} record - The record to set.
     */
    setRecord(record: Record): void;
    /**
     * Retrieves all record names in the tree.
     * @returns {string[]} An array of all record names in the tree.
     */
    getRecordNames(): string[];
    /**
     * Converts all records in the tree to their string representations and joins them.
     * @returns {string} A string representation of all records, separated by two newlines.
     */
    stringify(): string;
    /**
     * Converts the tree to a JSON-compatible object.
     * @returns {object} A JSON-compatible object with a "records" property that is an array of JSON-compatible records.
     */
    toJSON(): object;
}
/**
 * Parses a tree string into a tree object.
 * @param {string} treeString A string describing a tree, with each record on a new line and fields separated by pipes.
 * @returns {Tree} The parsed tree object.
 */
export function treeFromString(treeString: string): Tree;
