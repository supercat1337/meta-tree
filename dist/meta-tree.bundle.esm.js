// src/tree/field.js
var Field = class {
  /** @type {string} */
  name;
  /** @type {Map<string, string|null>} */
  attributes = /* @__PURE__ */ new Map();
  /** @type {boolean} */
  isOptional = false;
  /** @type {string|null} */
  defaultValue;
  /** @type {string|null} */
  description;
  /**
   * @param {string} name
   * @param {boolean} [isOptional=false]
   * @param {string|null} [defaultValue=null]
   * @param {string|null} [description=null]
   */
  constructor(name, isOptional = false, defaultValue = null, description = null) {
    this.name = name;
    this.isOptional = isOptional;
    this.defaultValue = defaultValue;
    this.description = description;
  }
  /**
   * @param {string} name
   * @return {boolean}
   */
  hasAttribute(name) {
    return this.attributes.has(name);
  }
  /**
   * @param {string} name
   * @return {string|null}
   */
  getAttribute(name) {
    return this.attributes.get(name) || null;
  }
  /**
   * Deletes an attribute from the field.
   * @param {string} name The name of the attribute to delete.
   */
  deleteAttribute(name) {
    this.attributes.delete(name);
  }
  /**
   * Sets an attribute for the field.
   * @param {string} name
   * @param {number|string|null} [value=null]
   */
  setAttribute(name, value = null) {
    if (typeof value === "number") {
      value = value.toString();
    }
    this.attributes.set(name, value);
  }
  #attrsToString() {
    return Array.from(this.attributes.entries()).map(([name, value]) => {
      if (value) {
        let v = value.replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\r?\n/g, "\\n");
        return `${name}="${v}"`;
      }
      return name;
    }).join(" ");
  }
  #descriptionToString() {
    if (!this.description) {
      return "";
    }
    return ("// " + this.description.replace(/"/g, "&quot;").replace(/\r?\n/g, "\\n")).trim();
  }
  stringify() {
    let nameStr = this.isOptional ? `[${this.name}="${this.defaultValue}"]` : this.name;
    let attrs = this.#attrsToString();
    let desc = this.#descriptionToString();
    return `${nameStr}    ${attrs} ${desc}`.trim();
  }
  /**
   * Converts the field to a JSON-compatible object.
   * @returns {object} A JSON-compatible object with "name", "isOptional", "defaultValue",
   *                   "description", and "attributes" properties. The "attributes" property
   *                   is an array of key-value pairs representing the field's attributes.
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
};

// src/tree/section.js
var Section = class {
  /** @type {string} */
  name;
  /** @type {Map<string, Field>} */
  fields = /* @__PURE__ */ new Map();
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
      return `${fields}
`;
    } else {
      return `${padding + "@" + this.name}
${fields}
`;
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
      fields: Array.from(this.fields.values()).map(
        (field) => field.toJSON()
      )
    };
  }
};

// src/tools/tools.js
function getVerbFromActionName(actionName) {
  if (actionName === null) return null;
  if (!actionName) return null;
  actionName = actionName.trim();
  if (actionName.startsWith("get")) return "get";
  else if (actionName.startsWith("set")) return "set";
  else if (actionName.startsWith("add")) return "add";
  else if (actionName.startsWith("delete")) return "delete";
  else if (actionName.startsWith("list")) return "list";
  else if (actionName.startsWith("check")) return "check";
  else return "check";
}

// src/tree/record.js
var Record = class {
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
  /**
   * Creates a new Record.
   * @param {string} entityName
   * @param {string|null} propertyName
   * @param {string|null} actionName
   * @param {string|null} description
   */
  constructor(entityName, propertyName, actionName = null, description = null) {
    this.entityName = entityName;
    this.propertyName = propertyName;
    this.actionName = actionName;
    this.verb = getVerbFromActionName(actionName);
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
    this.sections = /* @__PURE__ */ new Map();
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
    if (this.actionName) name += "." + this.actionName;
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
    return ("// " + this.description.replace(/"/g, "&quot;").replace(/\r?\n/g, "\\n")).trim();
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
      actionName: this.actionName,
      verb: this.verb,
      description: this.description,
      sections: Array.from(this.sections.values()).map(
        (section) => section.toJSON()
      )
    };
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
   * @param {string} entityName - The name of the entity for the record.
   * @param {string|null} propertyName - The name of the property for the record, or null if not applicable.
   * @param {string|null} actionName - The actionName associated with the record, or null if not applicable.
   * @param {string|null} description - The description of the record, or null if not applicable.
   * @returns {Record} The newly created record.
   */
  addRecord(entityName, propertyName = null, actionName = null, description = null) {
    let record = new Record(
      entityName,
      propertyName,
      actionName,
      description
    );
    let fullName = record.getFullName();
    if (this.records.has(fullName))
      throw new Error(`Record already exists: ${fullName}`);
    this.records.set(fullName, record);
    return record;
  }
  /**
   * Checks if a record exists in the tree by its full name.
   * @param {string} recordFullName - The full name of the record to check.
   * @returns {boolean} True if the record exists, false otherwise.
   */
  hasRecord(recordFullName) {
    return this.records.has(recordFullName);
  }
  /**
   * Retrieves a record from the tree by its full name.
   * @param {string} recordFullName - The full name of the record to retrieve.
   * @returns {Record|null} The record if found, otherwise null.
   */
  getRecord(recordFullName) {
    return this.records.get(recordFullName) || null;
  }
  /**
   * Deletes a record from the tree by its full name.
   * @param {string} recordFullName - The full name of the record to delete.
   */
  deleteRecord(recordFullName) {
    this.records.delete(recordFullName);
  }
  /**
   * Retrieves all records in the tree.
   * @returns {Record[]} An array of all records in the tree.
   */
  getRecords() {
    return Array.from(this.records.values());
  }
  /**
   * Sets a record in the tree, overwriting any existing record with the same full name.
   * @param {Record} record - The record to set.
   */
  setRecord(record) {
    this.records.set(record.getFullName(), record);
  }
  /**
   * Retrieves all record names in the tree.
   * @returns {string[]} An array of all record names in the tree.
   */
  getRecordNames() {
    return Array.from(this.records.keys());
  }
  /**
   * Converts all records in the tree to their string representations and joins them.
   * @returns {string} A string representation of all records, separated by two newlines.
   */
  stringify() {
    return Array.from(this.records.values()).map((record) => record.stringify()).join("\n\n");
  }
  /**
   * Converts the tree to a JSON-compatible object.
   * @returns {object} A JSON-compatible object with a "records" property that is an array of JSON-compatible records.
   */
  toJSON() {
    return {
      records: Array.from(this.records.values()).map(
        (record) => record.toJSON()
      )
    };
  }
};

// src/tools/treeFromString.js
function isRecordDeclaration(line) {
  return !/^\s/.test(line) && !isSectionDeclaration(line);
}
function isSectionDeclaration(line) {
  return line.startsWith("@");
}
function parseRecordDeclaration(line) {
  line = line.trim();
  let fullName = line.split(/\s+/)[0];
  let d = line.split(/\/\//)[1]?.trim();
  let description = typeof d === "undefined" ? null : d;
  let nameParts = fullName.split(".");
  let entityName = nameParts[0];
  let propertyName = null;
  let actionName = null;
  nameParts.shift();
  if (nameParts.length > 0) {
    actionName = nameParts[nameParts.length - 1];
    nameParts.pop();
  }
  if (nameParts.length > 0) {
    propertyName = nameParts.join(".");
  }
  return { entityName, propertyName, actionName, description };
}
function parseSectionDeclaration(line) {
  let m = line.match(/^@([\w_\.]+)/);
  return m ? m[1] : null;
}
function parseHtmlAttributes(inputString) {
  const attributes = {};
  let comment = null;
  const attrRegex = /(\$?[^\s=]+)(?:\s*=\s*("(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\$?[^\s]*)|$)?/g;
  let match;
  while ((match = attrRegex.exec(inputString)) !== null) {
    const name = match[1];
    if (name.startsWith("//")) {
      comment = match.input.slice(match.index + 2).trim();
      if (comment == "") comment = null;
      break;
    }
    let rawValue = match[2];
    let value = null;
    if (rawValue) {
      if (rawValue.startsWith('"') && rawValue.endsWith('"') || rawValue.startsWith("'") && rawValue.endsWith("'")) {
        value = rawValue.slice(1, -1).replace(/\\(["'])/g, "$1");
      } else {
        value = rawValue;
      }
    }
    attributes[name] = value;
  }
  return { attributes, comment };
}
function parseField(line) {
  let fieldName = null;
  let isOptional = false;
  let defaultValue = null;
  let attrsStr = "";
  let description = null;
  if (line.startsWith("[")) {
    let end = line.indexOf("]");
    if (end === -1) throw new Error(`Invalid field: ${line}`);
    let f = line.slice(1, end);
    let { attributes: attrs2 } = parseHtmlAttributes(f);
    let [name, value] = Object.entries(attrs2)[0];
    fieldName = name;
    isOptional = true;
    defaultValue = value;
    attrsStr = line.slice(end + 1).trim();
  } else {
    let m = line.match(/^([a-zA-Z0-9_\.]+)/);
    fieldName = m ? m[1] : null;
    if (!fieldName) throw new Error(`Invalid field: ${line}`);
    isOptional = line[fieldName.length] === "?";
    attrsStr = line.slice(fieldName.length + (isOptional ? 1 : 0)).trim();
  }
  let field = new Field(fieldName, isOptional, defaultValue);
  let { attributes: attrs, comment } = parseHtmlAttributes(attrsStr);
  for (let [name, value] of Object.entries(attrs)) {
    field.setAttribute(name, value);
  }
  field.description = comment;
  return field;
}
function treeFromString(treeString) {
  let tree = new Tree();
  let lines = treeString.split("\n");
  let currentRecord = null;
  let currentSectionName = "main";
  for (let line of lines) {
    if (line.trim() === "") continue;
    if (isRecordDeclaration(line)) {
      let { entityName, propertyName, actionName, description } = parseRecordDeclaration(line);
      currentRecord = tree.addRecord(
        entityName,
        propertyName,
        actionName,
        description
      );
      currentSectionName = "main";
      continue;
    }
    if (currentRecord === null) continue;
    line = line.trim();
    if (isSectionDeclaration(line)) {
      let sectionName = parseSectionDeclaration(line);
      if (!sectionName) continue;
      currentRecord.addSection(sectionName);
      currentSectionName = sectionName;
      continue;
    }
    if (line === "") continue;
    let field = parseField(line);
    currentRecord.addField(field, currentSectionName);
  }
  return tree;
}
export {
  Field,
  Record,
  Section,
  Tree,
  treeFromString
};
