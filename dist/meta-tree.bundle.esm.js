// src/tools/head-parser.js
function escapeComment(str) {
  return str.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\r/g, "\\r");
}
function unescapeComment(str) {
  return str.replace(/\\([nrt\\])/g, (match, p1) => {
    switch (p1) {
      case "n":
        return "\n";
      case "r":
        return "\r";
      case "t":
        return "	";
      case "\\":
        return "\\";
      default:
        return match;
    }
  });
}
function parseAttributes(str) {
  const attrs = /* @__PURE__ */ new Map();
  const trimmed = str.trim();
  if (!trimmed) return attrs;
  let i = 0;
  const n = trimmed.length;
  while (i < n) {
    while (i < n && /\s/.test(trimmed[i])) i++;
    if (i >= n) break;
    let nameStart = i;
    while (i < n && /[\w$-]/.test(trimmed[i])) i++;
    if (nameStart === i) break;
    const name = trimmed.slice(nameStart, i);
    while (i < n && /\s/.test(trimmed[i])) i++;
    if (i >= n || trimmed[i] !== "=") {
      attrs.set(name, "");
      continue;
    }
    i++;
    while (i < n && /\s/.test(trimmed[i])) i++;
    if (i >= n) {
      attrs.set(name, "");
      break;
    }
    let value = "";
    const ch = trimmed[i];
    if (ch === '"' || ch === "'") {
      const quote = ch;
      i++;
      let valueStart = i;
      while (i < n && trimmed[i] !== quote) {
        if (trimmed[i] === "\\" && i + 1 < n) {
          i++;
        }
        i++;
      }
      value = trimmed.slice(valueStart, i);
      value = value.replace(/\\(["'])/g, "$1");
      i++;
    } else {
      let valueStart = i;
      while (i < n && !/\s/.test(trimmed[i])) i++;
      value = trimmed.slice(valueStart, i);
    }
    attrs.set(name, value);
  }
  return attrs;
}
function parseHead(str) {
  const trimmed = str.trim();
  if (trimmed === "") {
    return { name: "", attributes: /* @__PURE__ */ new Map(), description: null };
  }
  const nameMatch = trimmed.match(/^(\S+)/);
  const name = nameMatch ? nameMatch[1] : "";
  let rest = trimmed.slice(name.length).trim();
  let description = null;
  const commentIndex = rest.indexOf("//");
  if (commentIndex !== -1) {
    const rawDesc = rest.slice(commentIndex + 2).trim();
    if (rawDesc) description = unescapeComment(rawDesc);
    rest = rest.slice(0, commentIndex).trim();
  }
  const attributes = parseAttributes(rest);
  return { name, attributes, description };
}
function stringifyHead(name, attributes, description) {
  const parts = name ? [name] : [];
  const attrStrings = [];
  for (const [key, val] of attributes) {
    if (val === "") {
      attrStrings.push(key);
    } else {
      const escaped = JSON.stringify(val).slice(1, -1);
      attrStrings.push(`${key}="${escaped}"`);
    }
  }
  if (attrStrings.length) parts.push(attrStrings.join(" "));
  if (description) parts.push(`// ${escapeComment(description)}`);
  return parts.join(" ");
}
function parseAttributesAndComment(str) {
  const trimmed = str.trim();
  let description = null;
  let attrsStr = trimmed;
  const commentIndex = trimmed.indexOf("//");
  if (commentIndex !== -1) {
    const rawDesc = trimmed.slice(commentIndex + 2).trim();
    if (rawDesc) description = unescapeComment(rawDesc);
    attrsStr = trimmed.slice(0, commentIndex).trim();
  }
  const attributes = parseAttributes(attrsStr);
  return { attributes, description };
}

// src/tree/field.js
var Field = class _Field {
  /** @type {string} */
  name;
  /** @type {Map<string, string>} */
  attributes = /* @__PURE__ */ new Map();
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
    if (typeof name !== "string" || !/^[a-zA-Z0-9_\.]+$/.test(name)) {
      throw new Error(`Invalid field name: ${name}`);
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
  setAttribute(name, value = "") {
    if (typeof value !== "string") value = String(value);
    this.attributes.set(name, value);
  }
  /**
   * Converts the field to its DSL string representation.
   * @returns {string}
   */
  stringify() {
    let namePart = this.name;
    if (this.isOptional) {
      if (this.defaultValue !== null && this.defaultValue !== "") {
        const escaped = JSON.stringify(this.defaultValue).slice(1, -1);
        namePart = `[${this.name}="${escaped}"]`;
      } else {
        namePart = `[${this.name}]`;
      }
    }
    const attrsDesc = stringifyHead("", this.attributes, this.description);
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
      attributes: Array.from(this.attributes.entries())
    };
  }
  /**
   * Creates a deep copy of the field.
   * @returns {Field}
   */
  clone() {
    const f = new _Field(this.name, this.isOptional, this.defaultValue, this.description);
    for (const [k, v] of this.attributes) f.setAttribute(k, v);
    return f;
  }
  /**
   * Renames the field.
   * @param {string} name - New name (validated).
   * @throws {Error} When name is invalid.
   */
  setName(name) {
    if (typeof name !== "string" || !/^[a-zA-Z0-9_\.]+$/.test(name)) {
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
};

// src/tree/section.js
var Section = class _Section {
  /** @type {string} */
  name;
  /** @type {Map<string, Field>} */
  fields = /* @__PURE__ */ new Map();
  /** @type {Map<string, string>} */
  attributes = /* @__PURE__ */ new Map();
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
    if (name.length === 0) throw new Error("Section name cannot be empty");
    if (/\s/.test(name)) throw new Error(`Section name cannot contain spaces: ${name}`);
    if (!/^[a-zA-Z0-9_.-]+$/.test(name)) throw new Error(`Invalid section name: ${name}`);
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
  stringify(padding = "    ") {
    const fieldsArray = this.getFields().map((f) => f.stringify());
    if (fieldsArray.length === 0 && this.name === "main") return "";
    const fieldsStr = fieldsArray.map((f) => padding + f).join("\n");
    if (this.name === "main") return fieldsStr;
    const header = stringifyHead(`@${this.name}`, this.attributes, this.description);
    const indentedHeader = padding + header;
    if (fieldsStr) return `${indentedHeader}
${fieldsStr}`;
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
      fields: this.getFields().map((f) => f.toJSON())
    };
  }
  /**
   * Creates a deep copy of the section.
   * @returns {Section}
   */
  clone() {
    const section = new _Section(
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
    if (newName.length === 0) throw new Error("Section name cannot be empty");
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
};

// src/tools/tools.js
function getVerbFromActionName(actionName) {
  if (!actionName) return null;
  const lower = actionName.trim().toLowerCase();
  if (lower.startsWith("get") || lower.startsWith("fetch") || lower.startsWith("retrieve") || lower.startsWith("find"))
    return "get";
  if (lower.startsWith("set") || lower.startsWith("update") || lower.startsWith("put") || lower.startsWith("patch") || lower.startsWith("replace"))
    return "set";
  if (lower.startsWith("add") || lower.startsWith("create") || lower.startsWith("post") || lower.startsWith("insert") || lower.startsWith("new"))
    return "add";
  if (lower.startsWith("delete") || lower.startsWith("remove") || lower.startsWith("del") || lower.startsWith("erase"))
    return "delete";
  if (lower.includes("list") || lower.startsWith("search") || lower.startsWith("query") || lower.startsWith("findall") || lower.startsWith("getall"))
    return "list";
  if (lower.startsWith("check") || lower.startsWith("validate") || lower.startsWith("verify") || lower.startsWith("test"))
    return "check";
  return "check";
}

// src/tree/record.js
var Record = class _Record {
  /** @type {string} */
  entityName;
  /** @type {string|null} */
  propertyName;
  /** @type {string|null} */
  actionName;
  /** @type {"get"|"set"|"add"|"delete"|"list"|"check"|null} */
  verb;
  /** @type {Map<string, Section>} */
  sections;
  /** @type {Section} */
  mainSection;
  /** @type {string|null} */
  description;
  /** @type {Map<string, string>} */
  attributes = /* @__PURE__ */ new Map();
  /**
   * Creates a new Record.
   * @param {string} entityName - Entity name (letters, digits, underscore, hyphen).
   * @param {string|null} propertyName - Property name (optional, may contain dots).
   * @param {string|null} actionName - Action name (optional).
   * @param {string|null} [description] - Record description.
   * @param {Object<string, string>} [attributes] - Record attributes.
   * @throws {Error} When any name is invalid.
   */
  constructor(entityName, propertyName, actionName = null, description = null, attributes = {}) {
    if (!/^[a-zA-Z0-9_-]+$/.test(entityName))
      throw new Error(`Invalid entity name: ${entityName}`);
    if (propertyName !== null && !/^[a-zA-Z0-9_.-]+$/.test(propertyName))
      throw new Error(`Invalid property name: ${propertyName}`);
    if (actionName !== null && !/^[a-zA-Z0-9_-]+$/.test(actionName))
      throw new Error(`Invalid action name: ${actionName}`);
    this.entityName = entityName;
    this.propertyName = propertyName;
    this.actionName = actionName;
    this.verb = getVerbFromActionName(actionName);
    this.description = description;
    this.sections = /* @__PURE__ */ new Map();
    this.mainSection = new Section("main");
    this.sections.set("main", this.mainSection);
    for (const [k, v] of Object.entries(attributes)) this.setAttribute(k, v);
  }
  /**
   * Constructs full record name: entity.property.action.
   * @returns {string}
   */
  getFullName() {
    let name = this.entityName;
    if (this.propertyName) name += "." + this.propertyName;
    if (this.actionName) name += "." + this.actionName;
    return name;
  }
  /**
   * Adds a new section.
   * @param {string} name - Section name (unique).
   * @param {Object<string, string>} [attributes] - Section attributes.
   * @param {string|null} [description] - Section description.
   * @returns {Section} The newly created section.
   * @throws {Error} When section already exists.
   */
  addSection(name, attributes = {}, description = null) {
    if (this.sections.has(name)) throw new Error(`Section already exists: ${name}`);
    const section = new Section(name, attributes, description);
    this.sections.set(name, section);
    if (name === "main") this.mainSection = section;
    return section;
  }
  /**
   * Retrieves a section by name.
   * @param {string} name
   * @returns {Section|null}
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
    if (name === "main") throw new Error("Cannot delete the main section");
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
   * @param {Section} section
   */
  setSection(section) {
    this.sections.set(section.name, section);
    if (section.name === "main") this.mainSection = section;
  }
  /**
   * Returns all sections.
   * @returns {Section[]}
   */
  getSections() {
    return Array.from(this.sections.values());
  }
  /**
   * Returns the main section.
   * @returns {Section}
   */
  getMainSection() {
    return this.mainSection;
  }
  /**
   * Adds a field to a section (creates the section if it does not exist).
   * @param {Field} field
   * @param {string} [sectionName='main']
   */
  addField(field, sectionName = "main") {
    let section = this.sections.get(sectionName);
    if (!section) section = this.addSection(sectionName);
    section.addField(field);
  }
  /**
   * Retrieves a field from a section.
   * @param {string} name
   * @param {string} [sectionName='main']
   * @returns {Field|null}
   */
  getField(name, sectionName = "main") {
    const section = this.sections.get(sectionName);
    return section ? section.getField(name) : null;
  }
  /**
   * Checks if a field exists in a section.
   * @param {string} name
   * @param {string} [sectionName='main']
   * @returns {boolean}
   */
  hasField(name, sectionName = "main") {
    const section = this.sections.get(sectionName);
    return section ? section.hasField(name) : false;
  }
  /**
   * Sets a field in a section (creates section if needed, overwrites existing field).
   * @param {Field} field
   * @param {string} [sectionName='main']
   */
  setField(field, sectionName = "main") {
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
  deleteField(name, sectionName = "main") {
    const section = this.sections.get(sectionName);
    if (!section) return false;
    const existed = section.hasField(name);
    section.deleteField(name);
    return existed;
  }
  /**
   * Returns all fields in a section.
   * @param {string} [sectionName='main']
   * @returns {Field[]}
   */
  getFields(sectionName = "main") {
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
    return parts.join("\n");
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
   *   sections: Array<ReturnType<Section['toJSON']>>
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
      sections: this.getSections().map((s) => s.toJSON())
    };
  }
  /**
   * Creates a deep copy of the record.
   * @returns {Record}
   */
  clone() {
    const record = new _Record(
      this.entityName,
      this.propertyName,
      this.actionName,
      this.description,
      Object.fromEntries(this.attributes)
    );
    for (const [name, section] of this.sections) {
      if (name === "main") {
        for (const f of section.getFields()) record.mainSection.setField(f.clone());
      } else {
        record.setSection(section.clone());
      }
    }
    return record;
  }
};

// src/tree/tree.js
var Tree = class {
  /** @type {Map<string, Record>} */
  records = /* @__PURE__ */ new Map();
  constructor() {
  }
  /**
   * Adds a new record to the tree.
   * @param {string} entityName
   * @param {string|null} [propertyName=null]
   * @param {string|null} [actionName=null]
   * @param {string|null} [description=null]
   * @returns {Record}
   * @throws {Error} When a record with the same full name already exists.
   */
  addRecord(entityName, propertyName = null, actionName = null, description = null) {
    const record = new Record(entityName, propertyName, actionName, description);
    const fullName = record.getFullName();
    if (this.records.has(fullName)) throw new Error(`Record already exists: ${fullName}`);
    this.records.set(fullName, record);
    return record;
  }
  /**
   * Checks if a record exists by its full name.
   * @param {string} recordFullName
   * @returns {boolean}
   */
  hasRecord(recordFullName) {
    return this.records.has(recordFullName);
  }
  /**
   * Retrieves a record by its full name.
   * @param {string} recordFullName
   * @returns {Record|null}
   */
  getRecord(recordFullName) {
    return this.records.get(recordFullName) || null;
  }
  /**
   * Deletes a record.
   * @param {string} recordFullName
   */
  deleteRecord(recordFullName) {
    this.records.delete(recordFullName);
  }
  /**
   * Returns all records in the tree.
   * @returns {Record[]}
   */
  getRecords() {
    return Array.from(this.records.values());
  }
  /**
   * Sets a record (overwrites if exists).
   * @param {Record} record
   */
  setRecord(record) {
    this.records.set(record.getFullName(), record);
  }
  /**
   * Returns all record full names.
   * @returns {string[]}
   */
  getRecordNames() {
    return Array.from(this.records.keys());
  }
  /**
   * Serializes the entire tree to a DSL string.
   * @returns {string}
   */
  stringify() {
    return Array.from(this.records.values()).map((record) => record.stringify()).join("\n\n");
  }
  /**
   * Returns a JSON-compatible object.
   * @returns {{ records: Array<ReturnType<Record['toJSON']>> }}
   */
  toJSON() {
    return {
      records: Array.from(this.records.values()).map((r) => r.toJSON())
    };
  }
};

// src/tools/macro-preprocessor.js
function extractMacros(lines) {
  const macros = {};
  const remainingLines = [];
  let i = 0;
  const n = lines.length;
  while (i < n) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("//")) {
      remainingLines.push(line);
      i++;
      continue;
    }
    if (trimmed.startsWith("#define-attr")) {
      const rest = trimmed.slice("#define-attr".length).trim();
      const match = rest.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(?:\(([^)]*)\))?\s+(.*)$/);
      if (!match) {
        throw new Error(`Invalid #define-attr syntax: ${line}`);
      }
      const name = match[1];
      if (macros[name]) throw new Error(`Macro already defined: ${name}`);
      const paramsStr = match[2] || "";
      const body = match[3].trim();
      const params = paramsStr ? paramsStr.split(",").map((p) => p.trim()).filter((p) => p) : [];
      macros[name] = { type: "attr", params, body };
      i++;
      continue;
    }
    if (trimmed.startsWith("#define-block")) {
      const match = trimmed.match(
        /^#define-block\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\(([^)]*)\))?/
      );
      if (!match) {
        throw new Error(`Invalid #define-block syntax: ${line}`);
      }
      const name = match[1];
      if (macros[name]) throw new Error(`Macro already defined: ${name}`);
      const paramsStr = match[2] || "";
      const params = paramsStr ? paramsStr.split(",").map((p) => p.trim()).filter((p) => p) : [];
      let bodyLines = [];
      i++;
      let foundEnd = false;
      while (i < n) {
        const currentLine = lines[i];
        const currentTrimmed = currentLine.trim();
        if (currentTrimmed === "#end") {
          foundEnd = true;
          i++;
          break;
        }
        bodyLines.push(currentLine);
        i++;
      }
      if (!foundEnd) throw new Error(`Missing #end for macro block: ${name}`);
      macros[name] = { type: "block", params, body: bodyLines.join("\n") };
      continue;
    }
    remainingLines.push(line);
    i++;
  }
  return { macros, remainingLines };
}
function expandLine(line, macros, depth = 0) {
  if (depth > 10) throw new Error("Macro expansion depth exceeded (possible circular reference)");
  const macroCallRegex = /#([a-zA-Z_][a-zA-Z0-9_]*(?:\([^)]*\))?)/g;
  let result = line;
  let match;
  while ((match = macroCallRegex.exec(result)) !== null) {
    const fullMatch = match[0];
    const namePart = match[1];
    let macroName;
    let args = [];
    if (namePart.includes("(")) {
      const openParen = namePart.indexOf("(");
      macroName = namePart.slice(0, openParen);
      const argsStr = namePart.slice(openParen + 1, -1);
      if (argsStr.trim()) {
        args = argsStr.split(",").map((a) => a.trim());
      }
    } else {
      macroName = namePart;
    }
    const macro = macros[macroName];
    if (!macro) continue;
    if (macro.type === "attr") {
      let expandedBody = macro.body;
      if (macro.params.length > 0) {
        if (args.length !== macro.params.length) {
          throw new Error(
            `Macro ${macroName} expects ${macro.params.length} arguments, got ${args.length}`
          );
        }
        for (let i = 0; i < macro.params.length; i++) {
          const paramName = macro.params[i];
          const argValue = args[i];
          expandedBody = expandedBody.replace(
            new RegExp(`{{${paramName}}}`, "g"),
            argValue
          );
        }
      } else if (args.length > 0) {
        throw new Error(`Macro ${macroName} does not accept arguments`);
      }
      const expanded = expandLine(expandedBody, macros, depth + 1);
      result = result.replace(fullMatch, expanded);
      macroCallRegex.lastIndex = 0;
    } else {
      throw new Error(`Block macro ${macroName} cannot be used inline`);
    }
  }
  return result;
}
function expandMacrosInLines(lines, macros) {
  const result = [];
  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      const callMatch = trimmed.match(/^#([a-zA-Z_][a-zA-Z0-9_]*)(?:\(([^)]*)\))?/);
      if (callMatch) {
        const macroName = callMatch[1];
        const argsStr = callMatch[2] || "";
        const args = argsStr ? argsStr.split(",").map((a) => a.trim()) : [];
        const macro = macros[macroName];
        if (macro && macro.type === "block") {
          if (args.length !== macro.params.length) {
            throw new Error(
              `Block macro ${macroName} expects ${macro.params.length} arguments, got ${args.length}`
            );
          }
          let body = macro.body;
          for (let i = 0; i < macro.params.length; i++) {
            const param = macro.params[i];
            const arg = args[i];
            body = body.replace(new RegExp(`{{${param}}}`, "g"), arg);
          }
          const bodyLines = body.split("\n");
          const leadingSpaces = line.match(/^\s*/)[0];
          for (let bline of bodyLines) {
            const trimmedBody = bline.trim();
            if (trimmedBody === "") {
              result.push("");
            } else {
              const indentedLine = leadingSpaces + trimmedBody;
              const expandedLine2 = expandLine(indentedLine, macros);
              result.push(expandedLine2);
            }
          }
          continue;
        }
      }
    }
    const expandedLine = expandLine(line, macros);
    result.push(expandedLine);
  }
  return result;
}
function preprocessMacros(dslString) {
  const lines = dslString.split(/\r?\n/);
  const { macros, remainingLines } = extractMacros(lines);
  const expandedLines = expandMacrosInLines(remainingLines, macros);
  return expandedLines.join("\n");
}

// src/tools/treeFromString.js
function isRecordDeclaration(line) {
  return !/^\s/.test(line) && !isSectionDeclaration(line);
}
function isSectionDeclaration(line) {
  return line.trim().startsWith("@");
}
function parseSectionLine(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("@")) return null;
  const withoutAt = trimmed.slice(1);
  const { name, attributes, description } = parseHead(withoutAt);
  return { name, attributes, description };
}
function parseField(line) {
  const trimmed = line.trim();
  if (trimmed === "") throw new Error("Empty field line");
  let fieldName = "";
  let isOptional = false;
  let defaultValue = null;
  let rest = "";
  if (trimmed.startsWith("[")) {
    const endBracket = trimmed.indexOf("]");
    if (endBracket === -1) throw new Error(`Invalid field (missing closing bracket): ${line}`);
    const bracketContent = trimmed.slice(1, endBracket);
    const eqPos = bracketContent.indexOf("=");
    if (eqPos !== -1) {
      fieldName = bracketContent.slice(0, eqPos).trim();
      let valuePart = bracketContent.slice(eqPos + 1).trim();
      if (valuePart.startsWith('"') && valuePart.endsWith('"') || valuePart.startsWith("'") && valuePart.endsWith("'")) {
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
      fieldName = bracketContent.trim();
      isOptional = true;
      defaultValue = null;
    }
    rest = trimmed.slice(endBracket + 1).trim();
  } else {
    const nameMatch = trimmed.match(/^[a-zA-Z0-9_\.]+/);
    if (!nameMatch) throw new Error(`Invalid field name: ${line}`);
    fieldName = nameMatch[0];
    let afterName = trimmed.slice(fieldName.length);
    if (afterName.startsWith("?")) {
      isOptional = true;
      afterName = afterName.slice(1);
    } else {
      isOptional = false;
    }
    rest = afterName.trim();
  }
  const field = new Field(fieldName, isOptional, defaultValue);
  if (rest) {
    const { attributes, description } = parseAttributesAndComment(rest);
    for (const [k, v] of attributes) field.setAttribute(k, v);
    if (description) field.description = description;
  }
  return field;
}
function treeFromString(treeString) {
  const tree = new Tree();
  const lines = treeString.split("\n");
  let currentRecord = null;
  let currentSectionName = "main";
  for (let line of lines) {
    if (line.trim() === "") continue;
    if (isRecordDeclaration(line)) {
      const { name, attributes, description } = parseHead(line);
      const parts = name.split(".");
      const entityName = parts[0];
      let propertyName = null;
      let actionName = null;
      if (parts.length > 1) {
        actionName = parts[parts.length - 1];
        if (parts.length > 2) {
          propertyName = parts.slice(1, -1).join(".");
        } else {
          propertyName = null;
        }
      }
      currentRecord = tree.addRecord(entityName, propertyName, actionName, description);
      for (const [k, v] of attributes) currentRecord.setAttribute(k, v);
      currentSectionName = "main";
      continue;
    }
    if (currentRecord === null) continue;
    line = line.trim();
    if (line === "") continue;
    if (isSectionDeclaration(line)) {
      const parsed = parseSectionLine(line);
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
    const field = parseField(line);
    currentRecord.addField(field, currentSectionName);
  }
  return tree;
}
function treeFromStringWithMacros(treeString) {
  const expanded = preprocessMacros(treeString);
  return treeFromString(expanded);
}
export {
  Field,
  Record,
  Section,
  Tree,
  preprocessMacros,
  treeFromString,
  treeFromStringWithMacros
};
