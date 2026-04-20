// @ts-check

import { formatLocationInTree, getError } from './tools.js';

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
    constructor(implicitMacros = {}, maxAttrDepth = 10) {
        /** @type {Object<string, any>} */
        this.macros = {};
        /** @type {Object<string, any>} */
        this.implicitMacros = implicitMacros;
        this.maxAttrDepth = maxAttrDepth;
        /** @type {string[]} */
        this.traceStack = []; // Stack to track macro calls for error reporting
    }

    /**
     * Preprocesses the DSL string.
     * @param {string} dslString - The raw DSL input.
     * @returns {string} - The expanded DSL output.
     */
    preprocess(dslString) {
        const lines = dslString.split(/\r?\n/);
        const remainingLines = this._extractMacros(lines);
        this.traceStack = [];
        const expandedLines = this._expandMacrosInLines(remainingLines, new Set());
        return expandedLines.join('\n');
    }

    /**
     * Retrieves a macro by name, first from user-defined, then from implicit.
     * @param {string} name
     * @returns {any | undefined}
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
     * Expands block and attribute macros with full context tracking.
     * Context includes: Record, Section, Field, and Macro Call Stack.
     * @param {string[]} lines - Lines to process.
     * @param {Set<string>} callStack - Set of macro names to prevent recursion.
     * @param {number} offset - The starting line index in the original/parent context.
     * @returns {string[]}
     * @private
     */
    _expandMacrosInLines(lines, callStack, offset = 0) {
        const result = [];
        let currentRecord = 'unknown';
        let currentSection = 'main';
        let currentField = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const currentLineIdx = offset + i;
            const trimmed = line.trim();

            // --- Context Tracking ---
            if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('#')) {
                const hasIndent = /^\s/.test(line);

                if (!hasIndent && !trimmed.startsWith('@')) {
                    // New Record: reset section and field
                    currentRecord = trimmed.split(/[ \/]/)[0];
                    currentSection = 'main';
                    currentField = '';
                } else if (trimmed.startsWith('@')) {
                    // New Section: reset field
                    currentSection = trimmed.slice(1).split(/[ \/]/)[0];
                    currentField = '';
                } else if (hasIndent) {
                    // Likely a field: extract the first word as field name
                    // We take the first part before spaces, macros, or brackets
                    const fieldMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)/);
                    if (fieldMatch) {
                        currentField = fieldMatch[1];
                    }
                }
            }

            /** Helper to build the error location string */
            const getContext = () => {
                let pos = formatLocationInTree({
                    recordName: currentRecord,
                    sectionName: currentSection,
                    fieldName: currentField,
                });
                if (this.traceStack.length > 0) {
                    pos += ` [Macro: ${this.traceStack.join(' -> ')}]`;
                }
                return pos;
            };
            // ------------------------

            const leadingSpaces = line.match(/^\s*/)?.[0] ?? '';

            if (trimmed.startsWith('#')) {
                const callMatch = trimmed.match(/^#([a-zA-Z_]\w*)(?:\(([^)]*)\))?/);
                if (callMatch) {
                    const macroName = callMatch[1];
                    const macro = this._getMacro(macroName);

                    if (macro && macro.type === 'block') {
                        if (callStack.has(macroName)) {
                            throw new Error(
                                `Circular dependency: ${macroName} (at line ${currentLineIdx + 1}) (${getContext()})`
                            );
                        }

                        let args = [];
                        try {
                            args = this._parseMacroArgs(callMatch[2] || '');
                        } catch (e) {
                            let err = getError(e);
                            throw new Error(
                                `Args error in #${macroName}: ${err.message} (at line ${currentLineIdx + 1}) (${getContext()})`
                            );
                        }

                        if (args.length !== macro.params.length) {
                            throw new Error(
                                `Block macro ${macroName} expects ${macro.params.length} args, got ${args.length} (at line ${currentLineIdx + 1}) (${getContext()})`
                            );
                        }

                        this.traceStack.push(`${macroName}(${args.join(',')})`);
                        const body = this._replaceParams(macro.body, macro.params, args);
                        const nextStack = new Set(callStack).add(macroName);

                        const expandedBody = this._expandMacrosInLines(
                            body.split('\n'),
                            nextStack,
                            currentLineIdx
                        );
                        result.push(
                            ...expandedBody.map(bLine => {
                                if (bLine.trim() === '') return '';
                                const bIndent = bLine.match(/^\s*/)?.[0] ?? '';
                                return leadingSpaces + bLine.slice(bIndent.length);
                            })
                        );

                        this.traceStack.pop();
                        continue;
                    }
                }
            }

            try {
                // Expanding inline attribute macros (where most type errors occur)
                result.push(this._expandLineAttributes(line));
            } catch (e) {
                let err = getError(e);
                throw new Error(`${err.message} (at line ${currentLineIdx + 1}) (${getContext()})`);
            }
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
        return line.replace(regex, (match, name, argsStr) => {
            const macro = this._getMacro(name);
            if (!macro || macro.type !== 'attr') return match;

            const args = this._parseMacroArgs(argsStr || '');
            if (args.length !== macro.params.length) {
                throw new Error(
                    `Attribute macro ${name} expects ${macro.params.length} arguments, got ${args.length}`
                );
            }

            let expanded = this._replaceParams(macro.body, macro.params, args);
            return this._expandLineAttributes(expanded, depth + 1);
        });
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
            // Global replace for parameter placeholders
            result = result.replace(new RegExp(`{{${param}}}`, 'g'), arg);
        }
        return result;
    }

    /**
     * Parses macro arguments respecting quotes and preserving escape slashes for DSL.
     * @param {string} argsStr
     * @returns {string[]}
     * @private
     */
    _parseMacroArgs(argsStr) {
        if (!argsStr.trim()) return [];

        const args = [];
        let current = '';
        let inQuote = false;
        let quoteChar = '';
        let escape = false;

        for (let i = 0; i < argsStr.length; i++) {
            const ch = argsStr[i];

            if (escape) {
                current += ch;
                escape = false;
                continue;
            }

            if (ch === '\\') {
                escape = true;
                current += ch; // Keep the slash for the DSL parser to handle
                continue;
            }

            if ((ch === '"' || ch === "'") && !inQuote) {
                inQuote = true;
                quoteChar = ch;
                // Only treat as a wrapper quote if it's at the start of an argument
                if (current.trim() === '') continue;
            }

            if (inQuote && ch === quoteChar) {
                inQuote = false;
                quoteChar = '';
                continue;
            }

            if (ch === ',' && !inQuote) {
                args.push(this._finalizeArg(current));
                current = '';
                continue;
            }

            current += ch;
        }

        if (inQuote) {
            throw new Error(`Unclosed quote (${quoteChar}) in macro arguments: ${argsStr}`);
        }

        args.push(this._finalizeArg(current));
        return args;
    }

    /**
     * Trims and removes outer quotes from a parsed argument.
     * @param {string} arg
     * @returns {string}
     * @private
     */
    _finalizeArg(arg) {
        arg = arg.trim();
        if (
            (arg.startsWith('"') && arg.endsWith('"')) ||
            (arg.startsWith("'") && arg.endsWith("'"))
        ) {
            return arg.slice(1, -1);
        }
        return arg;
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
        this.macros[name] = { type: 'attr', params, body: body.trim() };
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

        this.macros[name] = { type: 'block', params, body: bodyLines.join('\n') };
        return i + 1;
    }
}

/**
 * Compatibility wrapper for macro preprocessing.
 * @param {string} dslString
 * @param {Object<string, any>} [implicitMacros]
 * @returns {string}
 */
export function preprocessMacros(dslString, implicitMacros = {}) {
    const processor = new MacroPreprocessor(implicitMacros);
    return processor.preprocess(dslString);
}
