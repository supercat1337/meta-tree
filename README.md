# Structured Data Tree Library

A JavaScript library for creating, managing, and serializing hierarchical data structures with fields, sections, and records.

## Installation

```bash
npm install @supercat1337/meta-tree
```

## Usage

### Importing the Library

```javascript
import {
    Field,
    Record,
    Section,
    Tree,
    treeFromString,
} from "@supercat1337/meta-tree";
```

### Core Classes

#### 1. Field

Represents a single data field with attributes and metadata.

```javascript
const field = new Field(
    "username", // name
    false, // isOptional
    "anonymous", // defaultValue
    "The user display name" // description
);

// Manage attributes
field.setAttribute("maxLength", "32");
field.setAttribute("validation", "alphanumeric");

console.log(field.stringify());
```

#### 2. Section

A container for related fields.

```javascript
const section = new Section("userDetails");
section.addField(new Field("email", false, null, "User email address"));
section.addField(new Field("age", true, null, "User age"));

console.log(section.getFields());
```

#### 3. Record

Represents a complete record with multiple sections.

```javascript
const userRecord = new Record(
    "User", // entityName
    "Profile", // propertyName
    "Update", // verb
    "User profile information" // description
);

// Add fields to main section
userRecord.addField(new Field("username"));

// Create and add to custom section
const addressSection = userRecord.addSection("address");
addressSection.addField(new Field("street"));
addressSection.addField(new Field("city"));

console.log(userRecord.stringify());
```

#### 4. Tree

A collection of records that can be serialized/deserialized.

```javascript
const tree = new Tree();

// Add records
tree.addRecord("Product", "Price", "Update");
tree.addRecord("Order", null, "Create");

// Convert to string
const treeString = tree.stringify();

// Parse from string
const parsedTree = treeFromString(treeString);
```

## API Reference

### Field

-   `constructor(name: string, isOptional?: boolean, defaultValue?: string | null, description?: string | null)`
-   Properties:
    -   `name: string`
    -   `attributes: Map<string, string|null>`
    -   `isOptional: boolean`
    -   `defaultValue: string|null`
    -   `description: string|null`
-   Methods:
    -   `hasAttribute(name: string): boolean`
    -   `getAttribute(name: string): string|null`
    -   `deleteAttribute(name: string): void`
    -   `setAttribute(name: string, value: string|null): void`
    -   `stringify(): string`
    -   `toJSON(): object`

### Record

-   `constructor(entityName: string, propertyName: string | null, verb: string | null, description?: string | null)`
-   Properties:
    -   `entityName: string`
    -   `propertyName: string|null`
    -   `verb: string|null`
    -   `sections: Map<string, Section>`
    -   `mainSection: Section`
    -   `description: string|null`
-   Methods:
    -   `getFullName(): string`
    -   `addSection(name: string): Section`
    -   `getSection(name: string): Section|null`
    -   `deleteSection(name: string): void`
    -   `hasSection(name: string): boolean`
    -   `setSection(section: Section): void`
    -   `getSections(): Section[]`
    -   `addField(field: Field, sectionName?: string): void`
    -   `getField(name: string, sectionName?: string): Field|null`
    -   `hasField(name: string, sectionName?: string): boolean`
    -   `setField(field: Field, sectionName?: string): void`
    -   `deleteField(name: string, sectionName?: string): void`
    -   `getFields(sectionName?: string): Field[]|null`
    -   `stringify(): string`
    -   `toJSON(): object`

### Section

-   `constructor(name: string)`
-   Properties:
    -   `name: string`
    -   `fields: Map<string, Field>`
-   Methods:
    -   `addField(field: Field): void`
    -   `hasField(name: string): boolean`
    -   `getField(name: string): Field|null`
    -   `setField(field: Field): void`
    -   `deleteField(name: string): void`
    -   `getFields(): Field[]`
    -   `stringify(padding?: string): string`
    -   `toJSON(): object`

### Tree

-   Properties:
    -   `records: Map<string, Record>`
-   Methods:
    -   `addRecord(entityName: string, propertyName?: string | null, verb?: string | null, description?: string | null): Record`
    -   `hasRecord(recordFullName: string): boolean`
    -   `getRecord(recordFullName: string): Record|null`
    -   `deleteRecord(recordFullName: string): void`
    -   `getRecords(): Record[]`
    -   `setRecord(record: Record): void`
    -   `getRecordNames(): string[]`
    -   `stringify(): string`
    -   `toJSON(): object`

### Utility Functions

-   `treeFromString(treeString: string): Tree` - Parses a string representation into a Tree object

## Serialization Format

The library supports string serialization with a custom format:

```
Entity[.Property][.Verb] [// description]
    Field [attribute] [attribute=value] ... [// description] // required
    Field? [attribute] [attribute=value] ... ... [// description] // optional
    [Field="defaultValue"] [attribute] [attribute=value] ... ... [// description] // optional with default value

...

@SectionName // use section name as the section header
    Field [attribute] [attribute=value] ... ... [// description] // required
    Field? [attribute] [attribute=value] ... ... [// description] // optional
    \[Field="defaultValue"\] [attribute] [attribute=value] ... ... [// description] // optional with default value
```

Example:

```
user.profile.update
    username    maxLength="32" // Sample description of the field
    password    minLength="8"

    @returns
    result    boolean // boolean is attribute


user.profile.create
    username    maxLength="32" // The display name
    password    minLength="8"

    @returns
    userId     // no attrs here
```

## License

MIT
