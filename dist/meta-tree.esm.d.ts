export type ParsedHead = {
    /**
     * - The extracted name (record full name, section name, etc.)
     */
    name: string;
    /**
     * - Map of attribute names to values (empty string for valueless)
     */
    attributes: Map<string, string>;
    /**
     * - The comment after "//", or null
     */
    description: string | null;
};
export type MacroAttr = {
    type: "attr";
    params: string[];
    body: string;
};
export type MacroBlock = {
    type: "block";
    params: string[];
    body: string;
};
export class Field {
    /**
     * Creates a new Field.
     * @param {string} name - Field name (allowed: letters, digits, underscore, dot).
     * @param {boolean} [isOptional=false] - Whether the field is optional.
     * @param {string|null} [defaultValue=null] - Default value for optional field.
     * @param {string|null} [description=null] - Description/comment.
     * @throws {Error} When name is invalid.
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
     * Checks if an attribute exists.
     * @param {string} name - Attribute name.
     * @returns {boolean}
     */
    hasAttribute(name: string): boolean;
    /**
     * Gets an attribute value.
     * @param {string} name - Attribute name.
     * @returns {string|null} Value or null if not set.
     */
    getAttribute(name: string): string | null;
    /**
     * Deletes an attribute.
     * @param {string} name
     */
    deleteAttribute(name: string): void;
    /**
     * Sets an attribute.
     * @param {string} name - Attribute name.
     * @param {number|string} [value=''] - Attribute value (empty string for valueless).
     */
    setAttribute(name: string, value?: number | string): void;
    /**
     * Converts the field to its DSL string representation.
     * @returns {string}
     */
    stringify(): string;
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
    toJSON(): {
        name: string;
        isOptional: boolean;
        defaultValue: string | null;
        description: string | null;
        attributes: Array<[string, string]>;
    };
    /**
     * Creates a deep copy of the field.
     * @returns {Field}
     */
    clone(): Field;
    /**
     * Renames the field.
     * @param {string} name - New name (validated).
     * @throws {Error} When name is invalid.
     */
    setName(name: string): void;
    /**
     * Returns the field name.
     * @returns {string}
     */
    getName(): string;
}
export class Record {
    /**
     * Creates a new Record.
     * @param {string} entityName - Entity name (letters, digits, underscore, hyphen).
     * @param {string|null} propertyName - Property name (optional, may contain dots).
     * @param {string|null} actionName - Action name (optional).
     * @param {string|null} [description] - Record description.
     * @param {Object<string, string>} [attributes] - Record attributes.
     * @throws {Error} When any name is invalid.
     */
    constructor(entityName: string, propertyName: string | null, actionName?: string | null, description?: string | null, attributes?: {
        [x: string]: string;
    });
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
    /** @type {Map<string, string>} */
    attributes: Map<string, string>;
    /**
     * Constructs full record name: entity.property.action.
     * @returns {string}
     */
    getFullName(): string;
    /**
     * Adds a new section.
     * @param {string} name - Section name (unique).
     * @param {Object<string, string>} [attributes] - Section attributes.
     * @param {string|null} [description] - Section description.
     * @returns {Section} The newly created section.
     * @throws {Error} When section already exists.
     */
    addSection(name: string, attributes?: {
        [x: string]: string;
    }, description?: string | null): Section;
    /**
     * Retrieves a section by name.
     * @param {string} name
     * @returns {Section|null}
     */
    getSection(name: string): Section | null;
    /**
     * Deletes a section (cannot delete 'main').
     * @param {string} name
     * @throws {Error} When trying to delete 'main' section.
     */
    deleteSection(name: string): void;
    /**
     * Checks if a section exists.
     * @param {string} name
     * @returns {boolean}
     */
    hasSection(name: string): boolean;
    /**
     * Sets a section (overwrites if exists). Updates mainSection reference if name is 'main'.
     * @param {Section} section
     */
    setSection(section: Section): void;
    /**
     * Returns all sections.
     * @returns {Section[]}
     */
    getSections(): Section[];
    /**
     * Returns the main section.
     * @returns {Section}
     */
    getMainSection(): Section;
    /**
     * Adds a field to a section (creates the section if it does not exist).
     * @param {Field} field
     * @param {string} [sectionName='main']
     */
    addField(field: Field, sectionName?: string): void;
    /**
     * Retrieves a field from a section.
     * @param {string} name
     * @param {string} [sectionName='main']
     * @returns {Field|null}
     */
    getField(name: string, sectionName?: string): Field | null;
    /**
     * Checks if a field exists in a section.
     * @param {string} name
     * @param {string} [sectionName='main']
     * @returns {boolean}
     */
    hasField(name: string, sectionName?: string): boolean;
    /**
     * Sets a field in a section (creates section if needed, overwrites existing field).
     * @param {Field} field
     * @param {string} [sectionName='main']
     */
    setField(field: Field, sectionName?: string): void;
    /**
     * Deletes a field from a section.
     * @param {string} name
     * @param {string} [sectionName='main']
     * @returns {boolean} True if the field existed and was deleted.
     */
    deleteField(name: string, sectionName?: string): boolean;
    /**
     * Returns all fields in a section.
     * @param {string} [sectionName='main']
     * @returns {Field[]}
     */
    getFields(sectionName?: string): Field[];
    /**
     * Checks if an attribute exists on the record.
     * @param {string} name
     * @returns {boolean}
     */
    hasAttribute(name: string): boolean;
    /**
     * Gets an attribute value.
     * @param {string} name
     * @returns {string|null}
     */
    getAttribute(name: string): string | null;
    /**
     * Deletes an attribute.
     * @param {string} name
     */
    deleteAttribute(name: string): void;
    /**
     * Sets an attribute on the record.
     * @param {string} name
     * @param {string} value
     */
    setAttribute(name: string, value: string): void;
    /**
     * Returns the DSL string representation of the record.
     * @returns {string}
     */
    stringify(): string;
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
     *   sections: Array<ReturnType<Section['toJSON']>>
     * }}
     */
    toJSON(): {
        name: string;
        entityName: string;
        propertyName: string | null;
        actionName: string | null;
        verb: string | null;
        description: string | null;
        attributes: Array<[string, string]>;
        sections: Array<ReturnType<Section["toJSON"]>>;
    };
    /**
     * Creates a deep copy of the record.
     * @returns {Record}
     */
    clone(): Record;
}
export class Section {
    /**
     * Creates a new Section.
     * @param {string} name - Section name (no spaces, allowed: letters, digits, underscore, dot, hyphen).
     * @param {Object<string, string>} [attributes] - Section attributes.
     * @param {string|null} [description] - Section description.
     * @throws {Error} When name is invalid.
     */
    constructor(name: string, attributes?: {
        [x: string]: string;
    }, description?: string | null);
    /** @type {string} */
    name: string;
    /** @type {Map<string, Field>} */
    fields: Map<string, Field>;
    /** @type {Map<string, string>} */
    attributes: Map<string, string>;
    /** @type {string|null} */
    description: string | null;
    /**
     * Adds a field. Throws if a field with the same name already exists.
     * @param {Field} field
     * @throws {Error} When field name already exists.
     */
    addField(field: Field): void;
    /**
     * Checks if a field exists.
     * @param {string} name
     * @returns {boolean}
     */
    hasField(name: string): boolean;
    /**
     * Retrieves a field by name.
     * @param {string} name
     * @returns {Field|null}
     */
    getField(name: string): Field | null;
    /**
     * Sets a field (overwrites if exists).
     * @param {Field} field
     */
    setField(field: Field): void;
    /**
     * Deletes a field.
     * @param {string} name
     */
    deleteField(name: string): void;
    /**
     * Returns all fields in the section.
     * @returns {Field[]}
     */
    getFields(): Field[];
    /**
     * Returns all field names.
     * @returns {string[]}
     */
    getFieldNames(): string[];
    /**
     * Checks if an attribute exists.
     * @param {string} name
     * @returns {boolean}
     */
    hasAttribute(name: string): boolean;
    /**
     * Gets an attribute value.
     * @param {string} name
     * @returns {string|null}
     */
    getAttribute(name: string): string | null;
    /**
     * Deletes an attribute.
     * @param {string} name
     */
    deleteAttribute(name: string): void;
    /**
     * Sets an attribute.
     * @param {string} name
     * @param {string} value
     */
    setAttribute(name: string, value: string): void;
    /**
     * Returns the DSL string representation of the section.
     * @param {string} [padding='    '] - Indentation string.
     * @returns {string}
     */
    stringify(padding?: string): string;
    /**
     * Returns a JSON-compatible object.
     * @returns {{
     *   name: string,
     *   description: string|null,
     *   attributes: Array<[string, string]>,
     *   fields: Array<ReturnType<Field['toJSON']>>
     * }}
     */
    toJSON(): {
        name: string;
        description: string | null;
        attributes: Array<[string, string]>;
        fields: Array<ReturnType<Field["toJSON"]>>;
    };
    /**
     * Creates a deep copy of the section.
     * @returns {Section}
     */
    clone(): Section;
    /**
     * Renames the section.
     * @param {string} newName
     * @throws {Error} When name is invalid.
     */
    setName(newName: string): void;
    /**
     * Returns the section name.
     * @returns {string}
     */
    getName(): string;
}
export class Tree {
    /** @type {Map<string, Record>} */
    records: Map<string, Record>;
    /**
     * Adds a new record to the tree.
     * @param {string} entityName
     * @param {string|null} [propertyName=null]
     * @param {string|null} [actionName=null]
     * @param {string|null} [description=null]
     * @returns {Record}
     * @throws {Error} When a record with the same full name already exists.
     */
    addRecord(entityName: string, propertyName?: string | null, actionName?: string | null, description?: string | null): Record;
    /**
     * Checks if a record exists by its full name.
     * @param {string} recordFullName
     * @returns {boolean}
     */
    hasRecord(recordFullName: string): boolean;
    /**
     * Retrieves a record by its full name.
     * @param {string} recordFullName
     * @returns {Record|null}
     */
    getRecord(recordFullName: string): Record | null;
    /**
     * Deletes a record.
     * @param {string} recordFullName
     */
    deleteRecord(recordFullName: string): void;
    /**
     * Returns all records in the tree.
     * @returns {Record[]}
     */
    getRecords(): Record[];
    /**
     * Sets a record (overwrites if exists).
     * @param {Record} record
     */
    setRecord(record: Record): void;
    /**
     * Returns all record full names.
     * @returns {string[]}
     */
    getRecordNames(): string[];
    /**
     * Serializes the entire tree to a DSL string.
     * @returns {string}
     */
    stringify(): string;
    /**
     * Returns a JSON-compatible object.
     * @returns {{ records: Array<ReturnType<Record['toJSON']>> }}
     */
    toJSON(): {
        records: Array<ReturnType<Record["toJSON"]>>;
    };
}
/**
 * Compatibility wrapper to match the existing API.
 * @param {string} dslString
 * @returns {string}
 */
export function preprocessMacros(dslString: string): string;
/**
 * Parses a tree string into a Tree object.
 * @param {string} treeString - The DSL string.
 * @returns {Tree}
 */
export function treeFromString(treeString: string): Tree;
/**
 * Parses a tree string with macro preprocessing.
 * @param {string} treeString
 * @returns {Tree}
 */
export function treeFromStringWithMacros(treeString: string): Tree;
