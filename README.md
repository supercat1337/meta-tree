# Structured Data Tree Library

A JavaScript library for creating, managing, and serializing hierarchical data structures with fields, sections, and records.

## Installation

```bash
npm install @supercat1337/meta-tree
```

## 🤖 AI-Ready DSL

Meta-Tree DSL is specifically designed to be easily "understood" by Large Language Models (LLMs) like Claude, GPT, or Gemini. This makes it an ideal choice for automated code generation workflows.

### AI Documentation

We provide a specialized guide: [**AI-DOCS.md**](./ai-docs.md).  
You can feed this file directly into an AI's context window. It contains:

- Strict hierarchical rules and naming conventions.
- Explicit lexical guidelines for indentation and symbols.
- A "Complete Example" that acts as a reference for the AI to generate consistent DSL code.

**Benefits:**

- **Zero Hallucinations:** Strict syntax reduces AI errors.
- **Contract-First Development:** Describe your API once, then ask AI to generate SDKs for any language using the DSL as a source of truth.

## Usage

### Importing the Library

```javascript
import {
    Field,
    Record,
    Section,
    Tree,
    treeFromString,
    treeFromStringWithMacros,
    preprocessMacros,
    MacroPreprocessor,
    expandMacros,
} from '@supercat1337/meta-tree';
```

### Core Classes

#### Field

```javascript
const field = new Field('username', false, null, 'Display name');
field.setAttribute('maxLength', '32');
console.log(field.stringify()); // username    maxLength="32" // Display name
```

#### Section

```javascript
const section = new Section('userDetails', { scope: 'public' }, 'User details');
section.addField(new Field('email'));
console.log(section.stringify());
//     @userDetails scope="public" // User details
//         email
```

#### Record

```javascript
const record = new Record('user', 'profile', 'update', 'Updates user profile', { version: '2.0' });
record.addField(new Field('username'));
console.log(record.stringify());
// Output:
// user.profile.update version="2.0" // Updates user profile
//     username
```

> **Note on `verb`:** The `verb` property of a record is automatically derived from the action name (e.g., `get`, `set`, `add`, `delete`, `list`, `check`). If the action name does not match any known pattern, `verb` will be `'other'`. For records without an action name (single‑segment names like `user`), `verb` is `null`. You can override the `verb` by providing a `verb` attribute in the record header.

#### Tree

```javascript
const tree = new Tree();
tree.addRecord('product', 'price', 'update');
const serialized = tree.stringify();
const parsed = treeFromString(serialized);
```

## DSL Format (Version 2.0)

The DSL supports records, sections, fields, attributes, comments, and macros.

### Record Uniqueness

Within a single Tree, each record must have a **unique full name** (`entity[.property][.action]`). Duplicate names cause a parse error. This ensures that each API method or entity is defined only once.

### Record Verb Classification

Each record's `verb` is automatically determined by its action name:

- Known CRUD-like prefixes: `get`, `set`, `add`, `delete`, `list`, `check` → corresponding verb.
- Any other action name → `'other'`.
- No action name (e.g., `user` – single‑segment record) → `null`.

You can **override** the verb by adding a `verb` attribute in the record header. The attribute value must be one of: `get`, `set`, `add`, `delete`, `list`, `check`, `other`. Example:

```
user.profile verb="get"   // force verb='get', even though action name is 'profile'
```

For operations where `verb` is `'other'` (or even for CRUD verbs), you can provide additional semantics using the **`kind`** attribute (or any custom attribute) to help code generators decide how to handle the operation (e.g., file download, realtime subscription).

Example:

```
document.download kind="file"
    doc_id    type="string"

events.longPoll kind="realtime" timeout="60"
    [cursor] type="string"
```

Code generators may use `kind` to choose HTTP methods, content types, or protocols (WebSocket, SSE, etc.). The `kind` attribute is optional and free‑form.

### Macros

Macros are expanded in a **preprocessing step** before the main parser. The preprocessor detects circular dependencies and provides clear error messages.

#### Attribute Macros

Define reusable sets of attributes. Can have parameters.

```
#define-attr UInt32 type="integer" min="0" max="4294967295"
#define-attr String(min,max) type="string" length_min="{{min}}" length_max="{{max}}"
```

Use them inside field lines:

```
links.add
    link_id    #UInt32 is_primary
    link_name  #String(1,64)
```

After preprocessing:

```
links.add
    link_id    type="integer" min="0" max="4294967295" is_primary
    link_name  type="string" length_min="1" length_max="64"
```

#### Block Macros

Define reusable blocks of DSL (fields, sections, even whole records). Can also have parameters.

```
#define-block Pagination
    [page="1"]    type="int" // Page number
    [limit="20"]  type="int" // Items per page
#end

#define-block BaseMeta
    request_id    type="uuid"
    timestamp     type="datetime"
#end
```

Invoke them on a separate line (with proper indentation). Parentheses are optional for macros without parameters.

```
listOrders method="GET" // Method to list orders
    #BaseMeta
    #Pagination()       // parentheses allowed
    filter        type="string"

    @returns
        items     array="true" ref="Order"
```

After preprocessing, the block macros are expanded in place, and any nested attribute macros are expanded recursively.

#### Important Notes

- Macro names must start with a letter or underscore, followed by letters, digits, or underscores.
- Definitions (`#define-attr`, `#define-block`) must appear **before** any usage.
- A macro cannot be redefined (duplicate names cause an error).
- Block macros are terminated by `#end` on its own line.
- Placeholders in macros use `{{param}}` syntax.
- Macros can be nested (attribute macros inside block macros, or block macros calling other block macros – with cycle detection).
- Invocations use `#` (not `@`) to avoid confusion with sections.

### Complete Example

```c
#define-attr UInt32 type="integer" min="0" max="4294967295"
#define-attr String(min,max) type="string" length_min="{{min}}" length_max="{{max}}"

#define-block LinkFields
    link_id    #UInt32 is_primary
    user_id    #UInt32
    link_name  #String(1,64)
#end

links.add version="1.0" // Create a new link
    #LinkFields
    active_mode_require_auth    #UInt32 min="0" max="255"

    @returns
        link_id    #UInt32
```

### Serialization and Parsing

- `tree.stringify()` – produces DSL without macro definitions (expanded form).
- `treeFromString(dsl)` – parses DSL without macro preprocessing.
- `treeFromStringWithMacros(dsl)` – preprocesses macros, then parses. **The `verb` of each record is computed after macro expansion.**
- `preprocessMacros(dsl)` – standalone macro expansion (returns expanded DSL string).
- `MacroPreprocessor` – class for advanced usage (custom depth limits, etc.).
- `expandMacros(dsl)` – parses DSL with macro definitions and calls, then serializes the resulting tree back to DSL, producing a fully expanded string without any macro calls or definitions. Equivalent to `treeFromStringWithMacros(dsl).stringify()`. Useful for debugging, generating canonical DSL, or preparing input for tools that do not support macros.

    **Difference from `preprocessMacros`:**  
     `preprocessMacros` performs only string‑based macro substitution without syntax validation, while `expandMacros` fully parses the DSL, validates its structure, and then outputs a clean, macro‑free DSL.

## Recommendations for Code Generators

The library itself does not provide built‑in support for importing external type definitions (e.g., from JSON/JSON5 files). However, code generators built on top of this library are encouraged to implement such features using custom attributes like `ref` or `import`.

- Use `ref="TypeName"` on a field or section to reference an external type definition.
- Use `import="file.json5"` at the record or section level to load external schemas.
- **For records with `verb === 'other'`, inspect the `kind` attribute (or a custom attribute of your choice) to determine the operation type. Suggested `kind` values: `'file'`, `'realtime'`, `'execute'`, `'system'`, `'custom'`.**
- **If `kind` is absent, fall back to the `actionName` or other attributes to infer behaviour.**
- The code generator is responsible for loading the external file, resolving references, and generating the target code (TypeScript interfaces, OpenAPI schemas, etc.).

For detailed examples and best practices, see [**AI-DOCS.md**](./ai-docs.md).

## API Reference

### Field

| Method            | Parameters                                                                                          | Return Type      | Description                 |
| ----------------- | --------------------------------------------------------------------------------------------------- | ---------------- | --------------------------- |
| `constructor`     | `name: string`, `isOptional?: boolean`, `defaultValue?: string\|null`, `description?: string\|null` | -                | Creates a field.            |
| `hasAttribute`    | `name: string`                                                                                      | `boolean`        | Checks attribute existence. |
| `getAttribute`    | `name: string`                                                                                      | `string \| null` | Gets attribute value.       |
| `deleteAttribute` | `name: string`                                                                                      | `void`           | Deletes attribute.          |
| `setAttribute`    | `name: string`, `value?: string`                                                                    | `void`           | Sets attribute.             |
| `stringify`       | -                                                                                                   | `string`         | Returns DSL string.         |
| `toJSON`          | -                                                                                                   | `object`         | Returns JSON object.        |
| `clone`           | -                                                                                                   | `Field`          | Deep copy.                  |
| `setName`         | `name: string`                                                                                      | `void`           | Renames field.              |
| `getName`         | -                                                                                                   | `string`         | Returns name.               |

### Section

| Method            | Parameters                                                          | Return Type      | Description                       |
| ----------------- | ------------------------------------------------------------------- | ---------------- | --------------------------------- |
| `constructor`     | `name: string`, `attributes?: object`, `description?: string\|null` | -                | Creates section.                  |
| `addField`        | `field: Field`                                                      | `void`           | Adds field (throws if duplicate). |
| `hasField`        | `name: string`                                                      | `boolean`        | Checks field existence.           |
| `getField`        | `name: string`                                                      | `Field \| null`  | Gets field.                       |
| `setField`        | `field: Field`                                                      | `void`           | Sets field (overwrites).          |
| `deleteField`     | `name: string`                                                      | `void`           | Deletes field.                    |
| `getFields`       | -                                                                   | `Field[]`        | Returns all fields.               |
| `getFieldNames`   | -                                                                   | `string[]`       | Returns field names.              |
| `hasAttribute`    | `name: string`                                                      | `boolean`        | Checks attribute.                 |
| `getAttribute`    | `name: string`                                                      | `string \| null` | Gets attribute.                   |
| `deleteAttribute` | `name: string`                                                      | `void`           | Deletes attribute.                |
| `setAttribute`    | `name: string`, `value: string`                                     | `void`           | Sets attribute.                   |
| `stringify`       | `padding?: string`                                                  | `string`         | Returns DSL string.               |
| `toJSON`          | -                                                                   | `object`         | Returns JSON.                     |
| `clone`           | -                                                                   | `Section`        | Deep copy.                        |
| `setName`         | `newName: string`                                                   | `void`           | Renames section.                  |
| `getName`         | -                                                                   | `string`         | Returns name.                     |

### Record

| Method            | Parameters                                                                                                                          | Return Type       | Description                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------- | --------------------------------------- |
| `constructor`     | `entityName: string`, `propertyName: string\|null`, `actionName: string\|null`, `description?: string\|null`, `attributes?: object` | -                 | Creates record.                         |
| `getFullName`     | -                                                                                                                                   | `string`          | Returns `entity.property.action`.       |
| `addSection`      | `name: string`, `attributes?: object`, `description?: string\|null`                                                                 | `Section`         | Adds section.                           |
| `getSection`      | `name: string`                                                                                                                      | `Section \| null` | Gets section.                           |
| `deleteSection`   | `name: string`                                                                                                                      | `void`            | Deletes section (cannot delete 'main'). |
| `hasSection`      | `name: string`                                                                                                                      | `boolean`         | Checks existence.                       |
| `setSection`      | `section: Section`                                                                                                                  | `void`            | Sets section (overwrites).              |
| `getSections`     | -                                                                                                                                   | `Section[]`       | Returns all sections.                   |
| `getMainSection`  | -                                                                                                                                   | `Section`         | Returns main section.                   |
| `addField`        | `field: Field`, `sectionName?: string`                                                                                              | `void`            | Adds field (creates section if needed). |
| `getField`        | `name: string`, `sectionName?: string`                                                                                              | `Field \| null`   | Gets field.                             |
| `hasField`        | `name: string`, `sectionName?: string`                                                                                              | `boolean`         | Checks field.                           |
| `setField`        | `field: Field`, `sectionName?: string`                                                                                              | `void`            | Sets field (creates section if needed). |
| `deleteField`     | `name: string`, `sectionName?: string`                                                                                              | `boolean`         | Deletes field; returns true if existed. |
| `getFields`       | `sectionName?: string`                                                                                                              | `Field[]`         | Returns fields in section.              |
| `hasAttribute`    | `name: string`                                                                                                                      | `boolean`         | Checks record attribute.                |
| `getAttribute`    | `name: string`                                                                                                                      | `string \| null`  | Gets record attribute.                  |
| `deleteAttribute` | `name: string`                                                                                                                      | `void`            | Deletes record attribute.               |
| `setAttribute`    | `name: string`, `value: string`                                                                                                     | `void`            | Sets record attribute.                  |
| `stringify`       | -                                                                                                                                   | `string`          | Returns DSL string.                     |
| `toJSON`          | -                                                                                                                                   | `object`          | Returns JSON.                           |
| `clone`           | -                                                                                                                                   | `Record`          | Deep copy.                              |

**Record Properties** (not methods):

| Property | Type                                                            | Description                                                                    |
| -------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `verb`   | `"get"\|"set"\|"add"\|"delete"\|"list"\|"check"\|"other"\|null` | Auto‑derived from `actionName` (or overridden). `'other'` for unknown actions. |

### Tree

| Method           | Parameters                                                                                                     | Return Type      | Description               |
| ---------------- | -------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------- |
| `addRecord`      | `entityName: string`, `propertyName?: string\|null`, `actionName?: string\|null`, `description?: string\|null` | `Record`         | Adds record.              |
| `hasRecord`      | `recordFullName: string`                                                                                       | `boolean`        | Checks record.            |
| `getRecord`      | `recordFullName: string`                                                                                       | `Record \| null` | Gets record.              |
| `deleteRecord`   | `recordFullName: string`                                                                                       | `void`           | Deletes record.           |
| `getRecords`     | -                                                                                                              | `Record[]`       | Returns all records.      |
| `setRecord`      | `record: Record`                                                                                               | `void`           | Sets record (overwrites). |
| `getRecordNames` | -                                                                                                              | `string[]`       | Returns all full names.   |
| `stringify`      | -                                                                                                              | `string`         | Serializes tree to DSL.   |
| `toJSON`         | -                                                                                                              | `object`         | Returns JSON.             |

### Utility Functions

| Function                   | Parameters              | Return Type         | Description                                                                 |
| -------------------------- | ----------------------- | ------------------- | --------------------------------------------------------------------------- |
| `treeFromString`           | `treeString: string`    | `Tree`              | Parses DSL without macros.                                                  |
| `treeFromStringWithMacros` | `treeString: string`    | `Tree`              | Preprocesses macros and parses. **Verb is computed after macro expansion.** |
| `preprocessMacros`         | `dslString: string`     | `string`            | Expands macros only, returns DSL.                                           |
| `MacroPreprocessor`        | `maxAttrDepth?: number` | `MacroPreprocessor` | Class for advanced macro preprocessing (allows custom depth).               |
| `expandMacros`             | `dslString: string`     | `string`            | Fully expands macros and returns macro‑free DSL.                            |

## License

MIT
