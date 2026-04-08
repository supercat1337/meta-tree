# Structured Data Tree Library

A JavaScript library for creating, managing, and serializing hierarchical data structures with fields, sections, and records.

**Version 2.0.0** introduces a unified parsing and serialization system, support for attributes and descriptions on sections and records, improved escaping, and a cleaner DSL format.

## Installation

```bash
npm install @supercat1337/meta-tree
```

## Usage

### Importing the Library

```javascript
import { Field, Record, Section, Tree, treeFromString } from '@supercat1337/meta-tree';
```

### Core Examples

#### Field

```javascript
const field = new Field(
    'username', // name
    false, // isOptional
    null, // defaultValue
    'User name' // description
);
field.setAttribute('maxLength', '32');
console.log(field.stringify());
// Output: username    maxLength="32" // User name
```

#### Section

```javascript
const section = new Section('userDetails', { scope: 'public' }, 'User details');
section.addField(new Field('email'));
console.log(section.stringify());
// Output:     @userDetails scope="public" // User details
//                 email
```

#### Record

```javascript
const record = new Record('User', 'Profile', 'Update', 'Updates user profile', { version: '2.0' });
record.addField(new Field('username'));
const addr = record.addSection('address');
addr.addField(new Field('city'));
console.log(record.stringify());
```

#### Tree

```javascript
const tree = new Tree();
tree.addRecord('Product', 'Price', 'Update');
const serialized = tree.stringify();
const parsed = treeFromString(serialized);
```

## DSL Format (Version 2.0)

The library uses a custom text format for serialization. Key features:

- **Records**: `entity[.property][.verb] [attributes] // description`
- **Sections**: `@sectionName [attributes] // description`
- **Fields**: `fieldName[?] [attributes] // description` or `[fieldName[="default"]] [attributes] // description`

Attribute values use JSON escaping. Descriptions support minimal escaping (`\n`, `\r`, `\\`).

### Example

```
user.profile.update version="2.0" // Updates user profile
    username    maxLength="32" // The display name
    password    minLength="8"

    @returns array="true"
        result    boolean // Operation result
```

## API Reference

### Field

| Method            | Parameters                                                                                          | Return Type      | Description                                     |
| ----------------- | --------------------------------------------------------------------------------------------------- | ---------------- | ----------------------------------------------- |
| `constructor`     | `name: string`, `isOptional?: boolean`, `defaultValue?: string\|null`, `description?: string\|null` | -                | Creates a new field.                            |
| `hasAttribute`    | `name: string`                                                                                      | `boolean`        | Checks if an attribute exists.                  |
| `getAttribute`    | `name: string`                                                                                      | `string \| null` | Returns attribute value or null.                |
| `deleteAttribute` | `name: string`                                                                                      | `void`           | Deletes an attribute.                           |
| `setAttribute`    | `name: string`, `value?: string`                                                                    | `void`           | Sets an attribute (empty string for valueless). |
| `stringify`       | -                                                                                                   | `string`         | Returns DSL string representation.              |
| `toJSON`          | -                                                                                                   | `object`         | Returns JSON‑compatible object.                 |
| `clone`           | -                                                                                                   | `Field`          | Creates a deep copy.                            |
| `setName`         | `name: string`                                                                                      | `void`           | Renames the field.                              |
| `getName`         | -                                                                                                   | `string`         | Returns field name.                             |

### Section

| Method            | Parameters                                                          | Return Type      | Description                              |
| ----------------- | ------------------------------------------------------------------- | ---------------- | ---------------------------------------- |
| `constructor`     | `name: string`, `attributes?: object`, `description?: string\|null` | -                | Creates a new section.                   |
| `addField`        | `field: Field`                                                      | `void`           | Adds a field (throws if duplicate name). |
| `hasField`        | `name: string`                                                      | `boolean`        | Checks if a field exists.                |
| `getField`        | `name: string`                                                      | `Field \| null`  | Retrieves a field by name.               |
| `setField`        | `field: Field`                                                      | `void`           | Sets a field (overwrites if exists).     |
| `deleteField`     | `name: string`                                                      | `void`           | Deletes a field.                         |
| `getFields`       | -                                                                   | `Field[]`        | Returns all fields.                      |
| `getFieldNames`   | -                                                                   | `string[]`       | Returns all field names.                 |
| `hasAttribute`    | `name: string`                                                      | `boolean`        | Checks if an attribute exists.           |
| `getAttribute`    | `name: string`                                                      | `string \| null` | Returns attribute value or null.         |
| `deleteAttribute` | `name: string`                                                      | `void`           | Deletes an attribute.                    |
| `setAttribute`    | `name: string`, `value: string`                                     | `void`           | Sets an attribute.                       |
| `stringify`       | `padding?: string`                                                  | `string`         | Returns DSL string representation.       |
| `toJSON`          | -                                                                   | `object`         | Returns JSON‑compatible object.          |
| `clone`           | -                                                                   | `Section`        | Creates a deep copy.                     |
| `setName`         | `newName: string`                                                   | `void`           | Renames the section.                     |
| `getName`         | -                                                                   | `string`         | Returns section name.                    |

### Record

| Method            | Parameters                                                                                                                          | Return Type       | Description                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------- |
| `constructor`     | `entityName: string`, `propertyName: string\|null`, `actionName: string\|null`, `description?: string\|null`, `attributes?: object` | -                 | Creates a new record.                       |
| `getFullName`     | -                                                                                                                                   | `string`          | Returns `entity.property.action`.           |
| `addSection`      | `name: string`, `attributes?: object`, `description?: string\|null`                                                                 | `Section`         | Adds a new section (throws if exists).      |
| `getSection`      | `name: string`                                                                                                                      | `Section \| null` | Retrieves a section by name.                |
| `deleteSection`   | `name: string`                                                                                                                      | `void`            | Deletes a section (cannot delete 'main').   |
| `hasSection`      | `name: string`                                                                                                                      | `boolean`         | Checks if a section exists.                 |
| `setSection`      | `section: Section`                                                                                                                  | `void`            | Sets a section (overwrites if exists).      |
| `getSections`     | -                                                                                                                                   | `Section[]`       | Returns all sections.                       |
| `getMainSection`  | -                                                                                                                                   | `Section`         | Returns the main section.                   |
| `addField`        | `field: Field`, `sectionName?: string`                                                                                              | `void`            | Adds a field (creates section if needed).   |
| `getField`        | `name: string`, `sectionName?: string`                                                                                              | `Field \| null`   | Retrieves a field.                          |
| `hasField`        | `name: string`, `sectionName?: string`                                                                                              | `boolean`         | Checks if a field exists.                   |
| `setField`        | `field: Field`, `sectionName?: string`                                                                                              | `void`            | Sets a field (creates section if needed).   |
| `deleteField`     | `name: string`, `sectionName?: string`                                                                                              | `boolean`         | Deletes a field; returns `true` if existed. |
| `getFields`       | `sectionName?: string`                                                                                                              | `Field[]`         | Returns all fields in a section.            |
| `hasAttribute`    | `name: string`                                                                                                                      | `boolean`         | Checks if a record attribute exists.        |
| `getAttribute`    | `name: string`                                                                                                                      | `string \| null`  | Returns record attribute value.             |
| `deleteAttribute` | `name: string`                                                                                                                      | `void`            | Deletes a record attribute.                 |
| `setAttribute`    | `name: string`, `value: string`                                                                                                     | `void`            | Sets a record attribute.                    |
| `stringify`       | -                                                                                                                                   | `string`          | Returns DSL string representation.          |
| `toJSON`          | -                                                                                                                                   | `object`          | Returns JSON‑compatible object.             |
| `clone`           | -                                                                                                                                   | `Record`          | Creates a deep copy.                        |

### Tree

| Method           | Parameters                                                                                                     | Return Type      | Description                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------- | ---------------- | -------------------------------------------------- |
| `addRecord`      | `entityName: string`, `propertyName?: string\|null`, `actionName?: string\|null`, `description?: string\|null` | `Record`         | Adds a new record (throws if duplicate full name). |
| `hasRecord`      | `recordFullName: string`                                                                                       | `boolean`        | Checks if a record exists.                         |
| `getRecord`      | `recordFullName: string`                                                                                       | `Record \| null` | Retrieves a record by full name.                   |
| `deleteRecord`   | `recordFullName: string`                                                                                       | `void`           | Deletes a record.                                  |
| `getRecords`     | -                                                                                                              | `Record[]`       | Returns all records.                               |
| `setRecord`      | `record: Record`                                                                                               | `void`           | Sets a record (overwrites if exists).              |
| `getRecordNames` | -                                                                                                              | `string[]`       | Returns all full names.                            |
| `stringify`      | -                                                                                                              | `string`         | Serializes the whole tree to DSL.                  |
| `toJSON`         | -                                                                                                              | `object`         | Returns JSON‑compatible object.                    |

### Utility Functions

| Function         | Parameters           | Return Type | Description                               |
| ---------------- | -------------------- | ----------- | ----------------------------------------- |
| `treeFromString` | `treeString: string` | `Tree`      | Parses a DSL string into a `Tree` object. |

## Breaking Changes from Version 1.x

- **Serialization format** no longer uses HTML entities (`&quot;`). Attribute values now use JSON escaping, and descriptions use minimal escaping (`\n`, `\r`, `\\`).
- **Record and Section** now support attributes and descriptions (previously only Field had them).
- **Parsing** is more strict: unquoted attribute values must not contain spaces.
- The `verb` detection now maps `create`→`add`, `update`→`set`, `remove`→`delete` for consistency.

If you have existing DSL strings from version 1.x, please migrate them by replacing `&quot;` with `"` and ensuring backslashes are properly escaped. A migration script is available upon request.

## License

MIT
