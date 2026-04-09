# AI-DOCS: Meta-Tree DSL Guide

This document provides structured guidelines for writing and understanding Meta-Tree DSL, aimed at both human developers and AI assistants. Follow these rules to ensure consistent, parseable, and maintainable tree definitions.

## 0. Fundamental Syntax Rules

### 0.1. The `@` Symbol

- `@` is **only allowed** at the beginning of a line to denote a **section** (e.g., `@returns`, `@request`).
- **Never** use `@` inside attribute names, record headers, field names, or macro invocations.

❌ **Incorrect:** `ListOrders @method="GET"`  
✅ **Correct:** `ListOrders method="GET"`

### 0.2. Macro Invocation

- **Macros without parameters** are called **without parentheses**: `#BaseMeta`
- **Macros with parameters** are called with parentheses and arguments: `#String(1,64)`

### 0.3. Allowed Characters in Names

- Entity, property, action, field, section, macro, and attribute names must match regex: `[a-zA-Z0-9_.-]+`
- **Forbidden**: spaces, `@`, `#`, `[`, `]`, `=`, `/`, `\` (dot and hyphen are allowed).

### 0.4. Record Uniqueness

- The full name of a record (`entity[.property][.verb]`) must be unique within a single Tree.
- Duplicate names cause a parse error (thrown by `treeFromString` or `treeFromStringWithMacros`).
- This ensures each API method or entity can be unambiguously referenced.

### 0.5. Comments

Two types of comments are supported:

- **Inline comments** – appear after DSL code on the same line, e.g., `field    type="string" // description`. They are preserved in the object model (as `description` property of the corresponding element).
- **Standalone comments** – lines that contain only `// ...` (with optional leading spaces). They are **ignored** by the parser and do not appear in the tree. They serve only for human readability.

No multi-line comments; use multiple standalone comment lines if needed.

## 1. Hierarchical Overview

The Meta-Tree DSL defines a strict hierarchy:

```
Tree (root)
  └── Record (e.g., "user.profile.update")
        ├── Section: main (implicit default section for input/primary fields)
        │     ├── Field
        │     └── Field
        └── Section: named sections (e.g., @returns, @request)
              ├── Field
              └── Field
```

- **Tree** – top-level container; represented by a sequence of records separated by blank lines.
- **Record** – a single API method or entity. Its header line starts without indentation.
- **Section** – a group of fields inside a record. The `main` section is implicit for fields without a section header. Named sections start with `@`.
- **Field** – a single parameter inside a section.

## 2. Basic Structure

A Meta-Tree DSL file consists of **records**. Each record has:

- A header line: `entity[.property][.verb] [attributes] // comment`
- Indented fields (parameters) under the header (automatically belong to the `main` section).
- Optional named sections (e.g., `@returns`) with their own fields.

### Example

```
user.profile.update version="2.0" // Updates user profile
    username    maxLength="32" // Display name
    password    minLength="8"

    @returns
        result    boolean // Operation result
```

## 3. Lexical Rules

### 3.1. Indentation

- Use **4 spaces** for indentation (no tabs).
- Indentation defines nesting: fields belong to the nearest preceding record or section.
- Empty lines are allowed and ignored.

### 3.2. Comments

- **Inline comments** start with `//` and continue to the end of the line. They are attached to the preceding element (record, section, or field) and are preserved in the parsed object (e.g., `field.description`).
- **Standalone comments** (lines that contain only `//` with optional leading spaces) are ignored by the parser and **not stored** in the resulting tree. They serve as human-readable annotations only.
- No multi-line comments; use multiple `//` lines if needed.

### Example

```
// This is a comment about the whole file

user.profile.update
    username    maxLength="32" // field comment
    // another comment inside the record
    password    minLength="8"
```

### 3.3. Names

- Entity, property, action, field, and section names must match regex: `[a-zA-Z0-9_.-]+`
- Avoid spaces, `@`, `#`, `[`, `]`, `=`, `/`, `\` in names.

## 4. Record Header

Format: `entity[.property][.verb] [attributes] [// comment]`

- `entity` – required, e.g., `user`, `product`.
- `property` – optional, e.g., `profile`, `price`.
- `verb` – optional, but recommended for actions: `get`, `set`, `add`, `delete`, `list`, `check`.
- Attributes – key-value pairs (see Section 6).
- Comment – describes the record purpose.

**Examples:**

- `user.create`
- `product.price.update`
- `health.check // Ping service`

## 5. Fields

### 5.1. Required Field

```
fieldName [attributes] [// comment]
```

Example:

```
user_id    type="integer" min="0" // User identifier
```

### 5.2. Optional Field (no default)

```
[fieldName] [attributes] [// comment]
```

Example:

```
[page]    type="integer" min="1" // Page number (defaults to 1 in code)
```

### 5.3. Optional Field with Default Value

```
[fieldName="defaultValue"] [attributes] [// comment]
```

Example:

```
[per_page="20"]    type="integer" min="1" max="100" // Items per page
```

Default values are strings; code generator may parse them as numbers if needed.

## 6. Attributes

Attributes are key-value pairs placed after the field name (or record/section header).

### 6.1. Syntax

- `key="value"` – value is a string (JSON‑escaped).
- `key` – boolean‑like flag (value considered empty string).
- Values may contain spaces if quoted.

### 6.2. Common Attributes (suggested for code generators)

| Attribute                  | Purpose                        | Example                           |
| -------------------------- | ------------------------------ | --------------------------------- |
| `type`                     | Data type                      | `type="integer"`, `type="string"` |
| `min`, `max`               | Numeric bounds                 | `min="0" max="100"`               |
| `length_min`, `length_max` | String length limits           | `length_min="1" length_max="64"`  |
| `format`                   | Additional format hint         | `format="email"`, `format="uuid"` |
| `array`                    | Marks field as array           | `array="true"`                    |
| `ref`                      | Reference to a type definition | `ref="User"`                      |
| `is_id`, `is_primary`      | Special flags for identifiers  | `is_id is_primary`                |

### 6.3. Escaping

- Attribute values use JSON escaping: `\"`, `\\`, `\n`, etc.
- In comments, only backslashes, newlines, and carriage returns are escaped: `\\n`, `\\r`, `\\\\`.

## 7. Sections

Sections group fields under a named category. They are introduced by a line starting with `@` followed by the section name.

```
@sectionName [attributes] [// comment]
    field1
    field2
```

- The `main` section is implicit; fields without a section header belong to `main`.
- Example: `@returns` – commonly used for response structure.

### 7.1. Implicit `main` Section

All fields written directly after a record header (without an intervening `@main`) automatically go into the `main` section. This keeps the DSL compact.

**Example (implicit `main`):**

```
user.profile.update
    username    maxLength="32"
    password    minLength="8"
```

### 7.2. Explicit `main` Section

If you need to add attributes or a description to the main section, write `@main` explicitly:

```
user.profile.update
    @main scope="public" // Input parameters
        username    maxLength="32"
        password    minLength="8"
    @returns
        result    boolean
```

### 7.3. Section Attributes

Sections can have attributes, e.g.:

```
@returns array="true" ref="User" // Returns a list of users
    user_id    type="integer"
    name       type="string"
```

## 8. Macros (Preprocessor)

Macros help avoid repetition. They are expanded **before** parsing.

### 8.1. Attribute Macros

Define reusable attribute sets:

```
#define-attr UInt32 type="integer" min="0" max="4294967295"
#define-attr String(min,max) type="string" length_min="{{min}}" length_max="{{max}}"
```

Use:

```
user_id    #UInt32 is_primary
name       #String(1,64)
```

### 8.2. Block Macros

Define reusable blocks of fields or sections:

```
#define-block LinkFields
    link_id    type="integer" is_primary
    user_id    type="integer"
#end
```

Use on a separate line:

```
links.add
    #LinkFields
```

Block macros can have parameters:

```
#define-block PrefixedFields(prefix)
    {{prefix}}_id    type="integer"
    {{prefix}}_name  type="string"
#end

links.get
    #PrefixedFields(link)
```

### 8.3. Macro Rules

- Definitions must appear before any usage.
- Macro names must start with a letter or underscore, followed by letters/digits/underscores.
- Redefinition is an error.
- Recursion protection: max depth 10 for attribute macros, cycle detection for block macros.
- Invoke with `#`, never `@`.

## 9. Complete Example (with Macros, Correct Syntax)

```
#define-block Pagination
    [page="1"]    type="int" // Page number
    [limit="20"]  type="int" // Items per page
#end

#define-block BaseMeta
    request_id    type="uuid"
    timestamp     type="datetime"
#end

ListOrders method="GET" // Method to list orders
    #BaseMeta
    #Pagination()
    filter        type="string"

    @returns
        items     array="true" ref="Order"
```

**Key points in this example:**

- **Record Header:** Attributes like `method="GET"` are written directly in the header without the `@` symbol.
- **Macro Invocations:** - `#BaseMeta` demonstrates a call without parentheses.
    - `#Pagination()` demonstrates a call with parentheses. Both styles are valid for macros without parameters.
- **Implicit Section:** All fields before the `@returns` marker automatically belong to the `main` section.
- **Optional Fields:** `page` and `limit` (inside the macro) use the `[name="value"]` syntax for default values.
- **Sections:** The `@returns` section is explicitly named and contains its own set of fields.

## 10. Code Generation Hints

When writing a code generator from Meta-Tree DSL, follow these conventions:

- **Input parameters** – take from `record.mainSection` (the implicit default section).
- **Output parameters** – take from a named section like `@returns` (configurable).
- **Arrays** – use `array="true"` attribute on the field or section.
- **Type references** – use `ref="TypeName"`; resolve from external schemas (JSON/JSON5) in the generator.
- **Nested objects** – use dot notation, e.g., `address.city`. The generator can flatten or rebuild objects.
- **Error handling** – treat missing required fields as validation errors; provide clear messages.

## 11. Summary of Symbols

| Symbol | Meaning                                      |
| ------ | -------------------------------------------- |
| `//`   | Comment                                      |
| `@`    | Section header                               |
| `#`    | Macro invocation (after preprocessor)        |
| `[ ]`  | Optional field (with optional default value) |
| `=`    | Attribute value assignment                   |
| `"`    | Quoted attribute value (JSON‑escaped)        |

## 12. Style Recommendations

- Use 4 spaces for indentation.
- Align field names, attributes, and comments vertically for readability.
- Keep lines under 120 characters.
- Use comments to document non‑obvious attributes.
- Prefer explicit types (`type="integer"`) over implicit ones.

By following this guide, both humans and AI can reliably create and interpret Meta-Tree DSL files for API specifications, data schemas, or any hierarchical structure.
