export interface MacroAttr {
    type: 'attr';
    params: string[];
    body: string;
}

export interface MacroBlock {
    type: 'block';
    params: string[];
    body: string;
}

export type Macro = MacroAttr | MacroBlock;

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

declare global {
    interface MacroAttr extends _MacroAttr {}
    interface MacroBlock extends _MacroBlock {}
    type Macro = _Macro;
    interface ParsedHead extends _ParsedHead {}
}

type _MacroAttr = MacroAttr;
type _MacroBlock = MacroBlock;
type _Macro = Macro;
type _ParsedHead = ParsedHead;

/* From tools\head-parser.d.ts */
/**
 * Parses a string that may contain a name, attributes, and a trailing comment.
 * Format: `[name] [attr1=value1 attr2] ... [// comment]`
 * @param {string} str - The input string.
 * @returns {ParsedHead}
 */
export function parseHead(str: string): ParsedHead;
/**
 * Converts a name, attributes map, and description into a string representation.
 * Attributes are output as `key="value"` (value JSON-escaped) or `key` if value is empty.
 * Description is escaped with `escapeComment` and prefixed with `//`.
 * @param {string} name - The name (record full name, section name, or empty for fields).
 * @param {Map<string, string>} attributes - Map of attributes.
 * @param {string|null} description - Optional description.
 * @returns {string} The formatted string.
 */
export function stringifyHead(name: string, attributes: Map<string, string>, description: string | null): string;
/**
 * Parses a string containing only attributes and an optional comment.
 * Used for field attribute strings where there is no leading name.
 * @param {string} str
 * @returns {{ attributes: Map<string, string>, description: string|null }}
 */
/**
 * Parses a string containing only attributes and an optional comment.
 * @param {string} str
 * @returns {{ attributes: Map<string, string>, description: string|null }}
 */
export function parseAttributesAndComment(str: string): {
    attributes: Map<string, string>;
    description: string | null;
};

/* From tools\macro-preprocessor.d.ts */
/**
 * Compatibility wrapper for macro preprocessing.
 * @param {string} dslString
 * @param {Object<string, any>} [implicitMacros]
 * @returns {string}
 */
export function preprocessMacros(dslString: string, implicitMacros?: {
    [x: string]: any;
}): string;
/**
 * Main class for DSL macro preprocessing.
 * Handles both attribute and block macros with recursion protection.
 * Supports implicit (built-in) macros that are available without definition.
 */
export class MacroPreprocessor {
    /**
     * @param {Object<string, any>} [implicitMacros] - Built-in macros available by default.
     * @param {number} [maxAttrDepth=10] - Maximum recursion depth for attribute macros.
     */
    constructor(implicitMacros?: {
        [x: string]: any;
    }, maxAttrDepth?: number);
    /** @type {Object<string, any>} */
    macros: {
        [x: string]: any;
    };
    /** @type {Object<string, any>} */
    implicitMacros: {
        [x: string]: any;
    };
    maxAttrDepth: number;
    /** @type {string[]} */
    traceStack: string[];
    /**
     * Preprocesses the DSL string.
     * @param {string} dslString - The raw DSL input.
     * @returns {string} - The expanded DSL output.
     */
    preprocess(dslString: string): string;
    /**
     * Retrieves a macro by name, first from user-defined, then from implicit.
     * @param {string} name
     * @returns {any | undefined}
     * @private
     */
    private _getMacro;
    /**
     * Extracts macro definitions and returns only content lines.
     * @param {string[]} lines
     * @returns {string[]}
     * @private
     */
    private _extractMacros;
    /**
     * Expands block macros in lines, recursively.
     * Expands block and attribute macros with full context tracking.
     * Context includes: Record, Section, Field, and Macro Call Stack.
     * @param {string[]} lines - Lines to process.
     * @param {Set<string>} callStack - Set of macro names to prevent recursion.
     * @param {number} offset - The starting line index in the original/parent context.
     * @returns {string[]}
     * @private
     */
    private _expandMacrosInLines;
    /**
     * Expands inline attribute macros.
     * @param {string} line
     * @param {number} [depth=0]
     * @returns {string}
     * @private
     */
    private _expandLineAttributes;
    /**
     * Replaces placeholders {{param}} with argument values.
     * @param {string} body
     * @param {string[]} params
     * @param {string[]} args
     * @returns {string}
     * @private
     */
    private _replaceParams;
    /**
     * Parses macro arguments respecting quotes and preserving escape slashes for DSL.
     * @param {string} argsStr
     * @returns {string[]}
     * @private
     */
    private _parseMacroArgs;
    /**
     * Trims and removes outer quotes from a parsed argument.
     * @param {string} arg
     * @returns {string}
     * @private
     */
    private _finalizeArg;
    /**
     * Parses a #define-attr directive.
     * @param {string} trimmedLine
     * @private
     */
    private _parseAttrDef;
    /**
     * Parses a #define-block ... #end block.
     * @param {string[]} lines
     * @param {number} startIndex
     * @returns {number} The index after #end.
     * @private
     */
    private _parseBlockDef;
}

/* From tools\tools.d.ts */
/**
 * Attempts to determine the verb of an action from its name.
 * @param {string|null} actionName - The name of the action.
 * @returns {"get"|"set"|"add"|"delete"|"list"|"check"|"other"|null} The verb of the action, or null if it could not be determined.
 */
export function getVerbFromActionName(actionName: string | null): "get" | "set" | "add" | "delete" | "list" | "check" | "other" | null;
/**
 * Formats a location string.
 * @param {Object} data
 * @param {string} data.recordName
 * @param {string} [data.sectionName='']
 * @param {string} [data.fieldName='']
 * @returns {string} e.g., "users.add@main.user_id"
 */
export function formatLocationInTree({ recordName, sectionName, fieldName }: {
    recordName: string;
    sectionName?: string;
    fieldName?: string;
}): string;
/**
 *
 * @param {*} e
 * @returns {Error}
 */
export function getError(e: any): Error;

/* From tools\treeFromString.d.ts */
/**
 * Parses a tree string into a Tree object.
 * @param {string} treeString - The DSL string.
 * @returns {MetaTree}
 */
export function treeFromString(treeString: string): MetaTree;
/**
 * Parses a tree string with macro preprocessing.
 * @param {string} treeString
 * @param {Object<string, Macro>} [implicitMacros]
 * @returns {MetaTree}
 */
export function treeFromStringWithMacros(treeString: string, implicitMacros?: {
    [x: string]: Macro;
}): MetaTree;

/* From tree\meta-field.d.ts */
export class MetaField {
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
     * @returns {MetaField}
     */
    clone(): MetaField;
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

/* From tree\meta-record.d.ts */
export class MetaRecord {
    /**
     * Attempts to determine the verb of an action from its name.
     * @param {string|null} actionName - The name of the action.
     * @returns {"get"|"set"|"add"|"delete"|"list"|"check"|"other"|null} The verb of the action, or null if it could not be determined.
     */
    static getVerbFromActionName(actionName: string | null): "get" | "set" | "add" | "delete" | "list" | "check" | "other" | null;
    /**
     * Parses a full record name into its components.
     *
     * The name format is `entity`, `entity.property`, or `entity.property.action`.
     * The last segment is always treated as the action name when present.
     *
     * @static
     * @param {string} name - The full record name (e.g., "user", "user.profile", "user.profile.update").
     * @returns {{entityName: string, propertyName: string|null, actionName: string|null}} An object containing:
     *   - `entityName`: The entity (first segment)
     *   - `propertyName`: The optional property (middle segments, or null if none)
     *   - `actionName`: The optional action (last segment, or null if none)
     *
     * @example
     * MetaRecord.parseName('user.profile.update');
     * // returns { entityName: 'user', propertyName: 'profile', actionName: 'update' }
     *
     * @example
     * MetaRecord.parseName('user.profile');
     * // returns { entityName: 'user', propertyName: null, actionName: 'profile' }
     *
     * @example
     * MetaRecord.parseName('user');
     * // returns { entityName: 'user', propertyName: null, actionName: null }
     */
    static parseName(name: string): {
        entityName: string;
        propertyName: string | null;
        actionName: string | null;
    };
    /**
     * Creates a new Record.
     * @param {string} entityName - Entity name (letters, digits, underscore, hyphen).
     * @param {string|null} [propertyName] - Property name (optional, may contain dots).
     * @param {string|null} [actionName] - Action name (optional).
     * @param {string|null} [description] - Record description.
     * @param {Object<string, string>} [attributes] - Record attributes.
     * @throws {Error} When any name is invalid.
     */
    constructor(entityName: string, propertyName?: string | null, actionName?: string | null, description?: string | null, attributes?: {
        [x: string]: string;
    });
    /** @type {string} */
    entityName: string;
    /** @type {string|null} */
    propertyName: string | null;
    /** @type {string|null} */
    actionName: string | null;
    /** @type {"get"|"set"|"add"|"delete"|"list"|"check"|"other"|null} */
    verb: "get" | "set" | "add" | "delete" | "list" | "check" | "other" | null;
    /** @type {Map<string, MetaSection>} */
    sections: Map<string, MetaSection>;
    /** @type {MetaSection} */
    mainSection: MetaSection;
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
     * @returns {MetaSection} The newly created section.
     * @throws {Error} When section already exists.
     */
    addSection(name: string, attributes?: {
        [x: string]: string;
    }, description?: string | null): MetaSection;
    /**
     * Retrieves a section by name.
     * @param {string} name
     * @returns {MetaSection|null}
     */
    getSection(name: string): MetaSection | null;
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
     * @param {MetaSection} section
     */
    setSection(section: MetaSection): void;
    /**
     * Returns all sections.
     * @returns {MetaSection[]}
     */
    getSections(): MetaSection[];
    /**
     * Returns the main section.
     * @returns {MetaSection}
     */
    getMainSection(): MetaSection;
    /**
     * Adds a field to a section (creates the section if it does not exist).
     * @param {MetaField} field
     * @param {string} [sectionName='main']
     */
    addField(field: MetaField, sectionName?: string): void;
    /**
     * Retrieves a field from a section.
     * @param {string} name
     * @param {string} [sectionName='main']
     * @returns {MetaField|null}
     */
    getField(name: string, sectionName?: string): MetaField | null;
    /**
     * Checks if a field exists in a section.
     * @param {string} name
     * @param {string} [sectionName='main']
     * @returns {boolean}
     */
    hasField(name: string, sectionName?: string): boolean;
    /**
     * Sets a field in a section (creates section if needed, overwrites existing field).
     * @param {MetaField} field
     * @param {string} [sectionName='main']
     */
    setField(field: MetaField, sectionName?: string): void;
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
     * @returns {MetaField[]}
     */
    getFields(sectionName?: string): MetaField[];
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
     *   sections: Array<ReturnType<MetaSection['toJSON']>>
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
        sections: Array<ReturnType<MetaSection["toJSON"]>>;
    };
    /**
     * Creates a deep copy of the record.
     * @returns {MetaRecord}
     */
    clone(): MetaRecord;
}

/* From tree\meta-section.d.ts */
export class MetaSection {
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
    /** @type {Map<string, MetaField>} */
    fields: Map<string, MetaField>;
    /** @type {Map<string, string>} */
    attributes: Map<string, string>;
    /** @type {string|null} */
    description: string | null;
    /**
     * Adds a field. Throws if a field with the same name already exists.
     * @param {MetaField} field
     * @throws {Error} When field name already exists.
     */
    addField(field: MetaField): void;
    /**
     * Checks if a field exists.
     * @param {string} name
     * @returns {boolean}
     */
    hasField(name: string): boolean;
    /**
     * Retrieves a field by name.
     * @param {string} name
     * @returns {MetaField|null}
     */
    getField(name: string): MetaField | null;
    /**
     * Sets a field (overwrites if exists).
     * @param {MetaField} field
     */
    setField(field: MetaField): void;
    /**
     * Deletes a field.
     * @param {string} name
     */
    deleteField(name: string): void;
    /**
     * Returns all fields in the section.
     * @returns {MetaField[]}
     */
    getFields(): MetaField[];
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
     *   fields: Array<ReturnType<MetaField['toJSON']>>
     * }}
     */
    toJSON(): {
        name: string;
        description: string | null;
        attributes: Array<[string, string]>;
        fields: Array<ReturnType<MetaField["toJSON"]>>;
    };
    /**
     * Creates a deep copy of the section.
     * @returns {MetaSection}
     */
    clone(): MetaSection;
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

/* From tree\meta-tree.d.ts */
export class MetaTree {
    /** @type {Map<string, MetaRecord>} */
    records: Map<string, MetaRecord>;
    /**
     * Adds a new record to the tree.
     * @param {string} entityName
     * @param {string|null} [propertyName=null]
     * @param {string|null} [actionName=null]
     * @param {string|null} [description=null]
     * @returns {MetaRecord}
     * @throws {Error} When a record with the same full name already exists.
     */
    addRecord(entityName: string, propertyName?: string | null, actionName?: string | null, description?: string | null): MetaRecord;
    /**
     * Checks if a record exists by its full name.
     * @param {string} recordFullName
     * @returns {boolean}
     */
    hasRecord(recordFullName: string): boolean;
    /**
     * Retrieves a record by its full name.
     * @param {string} recordFullName
     * @returns {MetaRecord|null}
     */
    getRecord(recordFullName: string): MetaRecord | null;
    /**
     * Deletes a record.
     * @param {string} recordFullName
     */
    deleteRecord(recordFullName: string): void;
    /**
     * Returns all records in the tree.
     * @returns {MetaRecord[]}
     */
    getRecords(): MetaRecord[];
    /**
     * Sets a record (overwrites if exists).
     * @param {MetaRecord} record
     */
    setRecord(record: MetaRecord): void;
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
     * @returns {{ records: Array<ReturnType<MetaRecord['toJSON']>> }}
     */
    toJSON(): {
        records: Array<ReturnType<MetaRecord["toJSON"]>>;
    };
    /**
     * Clones tree
     * @returns {MetaTree}
     */
    cloneTree(): MetaTree;
    /**
     * Finds records in the tree by entity name and verb.
     * @param {string|RegExp} entityName
     * @param {string|null} [verb]
     * @returns {MetaRecord[]}
     */
    findRecords(entityName: string | RegExp, verb?: string | null): MetaRecord[];
}
