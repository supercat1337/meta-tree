# Roadmap

### Macros (Preprocessor)

Introduce a macro system to reduce duplication and allow reuse of attribute sets and DSL blocks.  
Macros are expanded in a preprocessing step before the main parser.

#### Syntax

- **Attribute macro** (single‑line, may contain placeholders):

```
#define-attr NAME value1="..." value2 ...
#define-attr NAME(param1, param2) value1="{{param1}}" value2="{{param2}}"

```

- **Block macro** (multi‑line, may contain any valid DSL: fields, sections, even multiple records):

```
#define-block NAME
... any DSL content ...
#end
```

- **Macro invocation** (with `#`, never conflicts with sections which use `@`):
- Attribute macro: inside a field line, e.g. `fieldname    #UInt32 extra_attr="value"`
- Block macro: on a separate line (with proper indentation), e.g. `#LinkFields`

#### Preprocessing behaviour

- All `#define-attr` and `#define-block ... #end` directives are removed from the source.
- Recursive expansion of macro invocations (`#NAME`) is performed (with cycle detection).
- Placeholders in attribute macros (e.g. `{{param}}`) are replaced by the arguments given at the call site.
- The resulting string is fed into the standard `treeFromString` parser.

#### Examples

```
#define-attr UInt32 type="integer" min="0" max="4294967295"
#define-attr String(min,max) type="string" length_min="{{min}}" length_max="{{max}}"

#define-block LinkFields
    link_id #UInt32 is_primary
    user_id #UInt32
    link_name #String(1,64)
#end

links.add
    #LinkFields
    active_mode_require_auth #UInt32 min="0" max="255"
```

After preprocessing:

```
links.add
    link_id type="integer" min="0" max="4294967295" is_primary
    user_id type="integer" min="0" max="4294967295"
    link_name type="string" length_min="1" length_max="64"
    active_mode_require_auth type="integer" min="0" max="255"
```

#### Implementation notes

- Macro preprocessor will be a separate module (`macro-preprocessor.js`) called before `treeFromString`.
- No changes to the core parser are required – the preprocessor outputs plain DSL.
- Optional: provide a combined function `treeFromStringWithMacros`.

## Future considerations (beyond 3.0.0)

- **Improved error messages** with line/column numbers for DSL parsing.
- **Caching** of `getFullName()` for performance on large trees.
- **Validation utilities** (e.g., `tree.validate()`) to check for missing references, cycles, etc.
- **Syntax highlighting** extension for VS Code.
- **Migration tool** to convert DSL from version 1.x to 2.0.0.

## Completed in 2.0.0

- Unified `head-parser` for attributes and comments.
- Support for attributes and descriptions on sections and records.
- JSON escaping for attribute values, minimal escaping for comments.
- Fixed field parsing (optional/default syntax).
- Comprehensive test suite (AVA + c8).
- Improved example UI (beautify, error display, copy).

## External schemas (recommendation for code generators)

The library itself does not provide built‑in support for importing external type definitions (e.g., JSON/JSON5 files).  
However, **code generators built on top of this library** are encouraged to implement such a feature using custom attributes.

- Use an attribute like `ref="User"` or `import="types.json5"` at the record or section level.
- The code generator is responsible for loading the external file, resolving references, and generating the target code (TypeScript interfaces, OpenAPI schemas, etc.).

This keeps the core parser lean and focused on the DSL, while offering unlimited extensibility for higher‑level tools.

### Example (code‑generator level)

DSL:

```
links.list
    @returns array="true" ref="Link"
```

Code generator:

- Reads `ref="Link"`, looks up the definition of `Link` (either from a predefined internal schema or from an external `schemas.json5` file).
- Generates `Array<Link>` accordingly.
