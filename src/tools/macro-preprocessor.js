// @ts-check

/**
 * @typedef {Object} MacroAttr
 * @property {string} type - 'attr'
 * @property {string[]} params
 * @property {string} body
 */

/**
 * @typedef {Object} MacroBlock
 * @property {string} type - 'block'
 * @property {string[]} params
 * @property {string} body
 */

/** @typedef {MacroAttr | MacroBlock} Macro */

function extractMacros(lines) {
    const macros = {};
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

        // Attribute macro: #define-attr ...
        if (trimmed.startsWith('#define-attr')) {
            const rest = trimmed.slice('#define-attr'.length).trim();
            const match = rest.match(/^([a-zA-Z_][a-zA-Z0-9_]*)(?:\(([^)]*)\))?\s+(.*)$/);
            if (!match) {
                throw new Error(`Invalid #define-attr syntax: ${line}`);
            }
            const name = match[1];
            if (macros[name]) throw new Error(`Macro already defined: ${name}`);
            const paramsStr = match[2] || '';
            const body = match[3].trim();
            const params = paramsStr
                ? paramsStr
                      .split(',')
                      .map(p => p.trim())
                      .filter(p => p)
                : [];
            macros[name] = { type: 'attr', params, body };
            i++;
            continue;
        }

        // Block macro: #define-block NAME(params) ... #end
        if (trimmed.startsWith('#define-block')) {
            const match = trimmed.match(
                /^#define-block\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\(([^)]*)\))?/
            );
            if (!match) {
                throw new Error(`Invalid #define-block syntax: ${line}`);
            }
            const name = match[1];
            if (macros[name]) throw new Error(`Macro already defined: ${name}`);
            const paramsStr = match[2] || '';
            const params = paramsStr
                ? paramsStr
                      .split(',')
                      .map(p => p.trim())
                      .filter(p => p)
                : [];
            let bodyLines = [];
            i++;
            let foundEnd = false;
            while (i < n) {
                const currentLine = lines[i];
                const currentTrimmed = currentLine.trim();
                if (currentTrimmed === '#end') {
                    foundEnd = true;
                    i++;
                    break;
                }
                bodyLines.push(currentLine);
                i++;
            }
            if (!foundEnd) throw new Error(`Missing #end for macro block: ${name}`);
            macros[name] = { type: 'block', params, body: bodyLines.join('\n') };
            continue;
        }

        remainingLines.push(line);
        i++;
    }

    return { macros, remainingLines };
}

function expandLine(line, macros, depth = 0) {
    if (depth > 10) throw new Error('Macro expansion depth exceeded (possible circular reference)');
    const macroCallRegex = /#([a-zA-Z_][a-zA-Z0-9_]*(?:\([^)]*\))?)/g;
    let result = line;
    let match;
    while ((match = macroCallRegex.exec(result)) !== null) {
        const fullMatch = match[0];
        const namePart = match[1];
        let macroName;
        let args = [];
        if (namePart.includes('(')) {
            const openParen = namePart.indexOf('(');
            macroName = namePart.slice(0, openParen);
            const argsStr = namePart.slice(openParen + 1, -1);
            if (argsStr.trim()) {
                args = argsStr.split(',').map(a => a.trim());
            }
        } else {
            macroName = namePart;
        }
        const macro = macros[macroName];
        if (!macro) continue;
        if (macro.type === 'attr') {
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
                        new RegExp(`{{${paramName}}}`, 'g'),
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
        // Check for block macro invocation
        if (trimmed.startsWith('#')) {
            const callMatch = trimmed.match(/^#([a-zA-Z_][a-zA-Z0-9_]*)(?:\(([^)]*)\))?/);
            if (callMatch) {
                const macroName = callMatch[1];
                const argsStr = callMatch[2] || '';
                const args = argsStr ? argsStr.split(',').map(a => a.trim()) : [];
                const macro = macros[macroName];
                if (macro && macro.type === 'block') {
                    if (args.length !== macro.params.length) {
                        throw new Error(
                            `Block macro ${macroName} expects ${macro.params.length} arguments, got ${args.length}`
                        );
                    }
                    let body = macro.body;
                    // Replace placeholders
                    for (let i = 0; i < macro.params.length; i++) {
                        const param = macro.params[i];
                        const arg = args[i];
                        body = body.replace(new RegExp(`{{${param}}}`, 'g'), arg);
                    }
                    const bodyLines = body.split('\n');
                    const leadingSpaces = line.match(/^\s*/)[0];
                    for (let bline of bodyLines) {
                        const trimmedBody = bline.trim();
                        if (trimmedBody === '') {
                            result.push('');
                        } else {
                            const indentedLine = leadingSpaces + trimmedBody;
                            const expandedLine = expandLine(indentedLine, macros);
                            result.push(expandedLine);
                        }
                    }
                    continue;
                }
            }
        }
        // Not a block macro invocation
        const expandedLine = expandLine(line, macros);
        result.push(expandedLine);
    }
    return result;
}

export function preprocessMacros(dslString) {
    const lines = dslString.split(/\r?\n/);
    const { macros, remainingLines } = extractMacros(lines);
    const expandedLines = expandMacrosInLines(remainingLines, macros);
    return expandedLines.join('\n');
}
