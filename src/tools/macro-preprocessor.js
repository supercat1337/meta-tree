// @ts-check

/**
 * @typedef {Object} MacroAttr
 * @property {'attr'} type
 * @property {string[]} params
 * @property {string} body
 */

/**
 * @typedef {Object} MacroBlock
 * @property {'block'} type
 * @property {string[]} params
 * @property {string} body
 */

/** @typedef {MacroAttr | MacroBlock} Macro */

/**
 * Main class for DSL macro preprocessing.
 * Handles both attribute and block macros with recursion protection.
 * Supports implicit (built-in) macros that are available without definition.
 */
export class MacroPreprocessor {
    /**
     * @param {Object<string, Macro>} [implicitMacros] - Built-in macros available by default.
     * @param {number} [maxAttrDepth=10] - Maximum recursion depth for attribute macros.
     */
    constructor(implicitMacros = {}, maxAttrDepth = 10) {
        /** @type {Record<string, Macro>} */
        this.macros = {};
        /** @type {Record<string, Macro>} */
        this.implicitMacros = implicitMacros;
        this.maxAttrDepth = maxAttrDepth;
    }

    /**
     * Preprocesses the DSL string.
     * @param {string} dslString - The raw DSL input.
     * @returns {string} - The expanded DSL output.
     */
    preprocess(dslString) {
        const lines = dslString.split(/\r?\n/);
        const remainingLines = this._extractMacros(lines);
        const expandedLines = this._expandMacrosInLines(remainingLines, new Set());
        return expandedLines.join('\n');
    }

    /**
     * Retrieves a macro by name, first from user-defined, then from implicit.
     * @param {string} name
     * @returns {Macro | undefined}
     * @private
     */
    _getMacro(name) {
        return this.macros[name] ?? this.implicitMacros[name];
    }

    /**
     * Extracts macro definitions and returns only content lines.
     * @param {string[]} lines
     * @returns {string[]}
     * @private
     */
    _extractMacros(lines) {
        const remainingLines = [];
        let i = 0;
        const n = lines.length;

        while (i < n) {
            const line = lines[i];
            const trimmed = line.trim();

            if (trimmed === '' || trimmed.startsWith('//')) {
                remainingLines.push(line);
                i++;
                continue;
            }

            if (trimmed.startsWith('#define-attr')) {
                this._parseAttrDef(trimmed);
                i++;
                continue;
            }

            if (trimmed.startsWith('#define-block')) {
                i = this._parseBlockDef(lines, i);
                continue;
            }

            remainingLines.push(line);
            i++;
        }
        return remainingLines;
    }

    /**
     * Expands block macros in lines, recursively.
     * @param {string[]} lines
     * @param {Set<string>} callStack
     * @returns {string[]}
     * @private
     */
    _expandMacrosInLines(lines, callStack) {
        const result = [];

        for (let line of lines) {
            const trimmed = line.trim();
            const leadingSpaces = line.match(/^\s*/)?.[0] ?? '';

            if (trimmed.startsWith('#')) {
                const callMatch = trimmed.match(/^#([a-zA-Z_]\w*)(?:\(([^)]*)\))?/);
                if (callMatch) {
                    const macroName = callMatch[1];
                    const macro = this._getMacro(macroName);

                    if (macro && macro.type === 'block') {
                        if (callStack.has(macroName)) {
                            throw new Error(
                                `Circular dependency: ${Array.from(callStack).join(' -> ')} -> ${macroName}`
                            );
                        }

                        const argsStr = callMatch[2] || '';
                        const args = argsStr
                            ? argsStr
                                  .split(',')
                                  .map(a => a.trim())
                                  .filter(a => a !== '')
                            : [];
                        if (args.length !== macro.params.length) {
                            throw new Error(
                                `Block macro ${macroName} expects ${macro.params.length} arguments, got ${args.length}`
                            );
                        }

                        let body = this._replaceParams(macro.body, macro.params, args);
                        const nextStack = new Set(callStack).add(macroName);
                        const expandedBody = this._expandMacrosInLines(body.split('\n'), nextStack);

                        for (let bLine of expandedBody) {
                            const trimmedBody = bLine.trim();
                            if (trimmedBody === '') {
                                result.push('');
                            } else {
                                const originalIndent = bLine.match(/^\s*/)?.[0] ?? '';
                                const withoutIndent = bLine.slice(originalIndent.length);
                                result.push(leadingSpaces + withoutIndent);
                            }
                        }
                        continue;
                    }
                }
            }
            // Not a block macro invocation (or unknown macro)
            result.push(this._expandLineAttributes(line));
        }
        return result;
    }

    /**
     * Expands inline attribute macros.
     * @param {string} line
     * @param {number} [depth=0]
     * @returns {string}
     * @private
     */
    _expandLineAttributes(line, depth = 0) {
        if (depth > this.maxAttrDepth) {
            throw new Error(`Max attribute macro depth (${this.maxAttrDepth}) exceeded`);
        }

        const regex = /#([a-zA-Z_]\w*)(?:\(([^)]*)\))?/g;
        let result = line;

        result = result.replace(regex, (match, name, argsStr) => {
            const macro = this._getMacro(name);
            if (!macro || macro.type !== 'attr') return match;

            const args = argsStr
                ? argsStr
                      .split(',')
                      .map((/** @type {string} */ a) => a.trim())
                      .filter((/** @type {string} */ a) => a !== '')
                : [];
            if (args.length !== macro.params.length) {
                throw new Error(
                    `Attribute macro ${name} expects ${macro.params.length} arguments, got ${args.length}`
                );
            }

            let expanded = this._replaceParams(macro.body, macro.params, args);
            return this._expandLineAttributes(expanded, depth + 1);
        });

        return result;
    }

    /**
     * Replaces placeholders {{param}} with argument values.
     * @param {string} body
     * @param {string[]} params
     * @param {string[]} args
     * @returns {string}
     * @private
     */
    _replaceParams(body, params, args) {
        let result = body;
        for (let i = 0; i < params.length; i++) {
            const param = params[i];
            const arg = args[i];
            result = result.replace(new RegExp(`{{${param}}}`, 'g'), arg);
        }
        return result;
    }

    /**
     * Parses a #define-attr directive.
     * @param {string} trimmedLine
     * @private
     */
    _parseAttrDef(trimmedLine) {
        const match = trimmedLine.match(/^#define-attr\s+([a-zA-Z_]\w*)(?:\(([^)]*)\))?\s+(.*)$/);
        if (!match) throw new Error('Invalid #define-attr syntax');
        const [, name, paramsStr, body] = match;
        if (this.macros[name]) throw new Error(`Macro already defined: ${name}`);
        const params = paramsStr
            ? paramsStr
                  .split(',')
                  .map(p => p.trim())
                  .filter(p => p)
            : [];
        this.macros[name] = {
            type: 'attr',
            params,
            body: body.trim(),
        };
    }

    /**
     * Parses a #define-block ... #end block.
     * @param {string[]} lines
     * @param {number} startIndex
     * @returns {number} The index after #end.
     * @private
     */
    _parseBlockDef(lines, startIndex) {
        const header = lines[startIndex].trim();
        const match = header.match(/^#define-block\s+([a-zA-Z_]\w*)(?:\(([^)]*)\))?/);
        if (!match) throw new Error('Invalid #define-block syntax');
        const name = match[1];
        if (this.macros[name]) throw new Error(`Macro already defined: ${name}`);
        const params = match[2]
            ? match[2]
                  .split(',')
                  .map(p => p.trim())
                  .filter(p => p)
            : [];
        const bodyLines = [];
        let i = startIndex + 1;
        const n = lines.length;

        while (i < n && lines[i].trim() !== '#end') {
            bodyLines.push(lines[i]);
            i++;
        }
        if (i >= n) throw new Error(`Missing #end for macro block: ${name}`);

        this.macros[name] = {
            type: 'block',
            params,
            body: bodyLines.join('\n'),
        };
        return i + 1; // skip the #end line
    }
}

/**
 * Compatibility wrapper with optional implicit macros.
 * @param {string} dslString
 * @param {Object<string, Macro>} [implicitMacros]
 * @returns {string}
 */
export function preprocessMacros(dslString, implicitMacros = {}) {
    const processor = new MacroPreprocessor(implicitMacros);
    return processor.preprocess(dslString);
}
