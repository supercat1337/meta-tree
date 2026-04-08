## Future considerations

- **Improved error messages** with line/column numbers for DSL parsing.
- **Caching** of `getFullName()` for performance on large trees.
- **Validation utilities** (e.g., `tree.validate()`) to check for missing references, cycles, etc.
- **Syntax highlighting** extension for VS Code.

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
