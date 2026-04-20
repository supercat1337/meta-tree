// @ts-check

/**
 * Escapes a string for safe inclusion after "//".
 * Only backslashes, newlines, carriage returns are escaped.
 * @param {string} str - The raw description.
 * @returns {string} Escaped description.
 */
function escapeComment(str) {
    return str.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

/**
 * Unescapes a comment string that was escaped with `escapeComment`.
 * @param {string} str - Escaped string.
 * @returns {string} Original string.
 */
function unescapeComment(str) {
    return str.replace(/\\([nrt\\])/g, (match, p1) => {
        switch (p1) {
            case 'n':
                return '\n';
            case 'r':
                return '\r';
            case 't':
                return '\t';
            case '\\':
                return '\\';
            default:
                return match;
        }
    });
}

/**
 * Parses HTML-like attributes with support for KSON/JSON values.
 * Optimized for performance and robust error handling.
 * @param {string} str - The attribute string.
 * @returns {Map<string, string>} Map of attribute names to values.
 */
function parseAttributes(str) {
    const attrs = new Map();
    if (!str || typeof str !== 'string') return attrs;

    let i = 0;
    const n = str.length;

    while (i < n) {
        // 1. Skip whitespace
        while (i < n && /\s/.test(str[i])) i++;
        if (i >= n) break;

        // 2. Parse attribute name (optimized: no slice in loop)
        let nameStart = i;
        while (i < n && /[a-zA-Z0-9_.-]/.test(str[i])) i++;

        if (nameStart === i) {
            // Safety: if we hit an unexpected character, move forward to avoid infinite loop
            i++;
            continue;
        }
        const name = str.slice(nameStart, i);

        // Skip whitespace before '='
        while (i < n && /\s/.test(str[i])) i++;

        // 3. Handle boolean attributes
        if (i >= n || str[i] !== '=') {
            attrs.set(name, '');
            continue;
        }
        i++; // skip '='

        // Skip whitespace after '='
        while (i < n && /\s/.test(str[i])) i++;
        if (i >= n) {
            attrs.set(name, '');
            break;
        }

        // 4. Parse value
        let value = '';
        const quote = str[i];

        if (quote === '"' || quote === "'") {
            i++; // skip opening quote
            let rawValue = '';
            let escaped = false;
            let foundClosingQuote = false;

            while (i < n) {
                const char = str[i];
                if (escaped) {
                    // Logic for standard escape sequences
                    if (char === 'n') rawValue += '\n';
                    else if (char === 't') rawValue += '\t';
                    else if (char === 'r') rawValue += '\r';
                    else rawValue += char; // covers \\, \", \'
                    escaped = false;
                } else if (char === '\\') {
                    escaped = true;
                } else if (char === quote) {
                    foundClosingQuote = true;
                    i++; // skip closing quote
                    break;
                } else {
                    rawValue += char;
                }
                i++;
            }

            if (!foundClosingQuote) {
                throw new Error(`Unclosed quote (${quote}) for attribute "${name}"`);
            }
            value = rawValue;
        } else {
            // Unquoted value: read until next whitespace
            let valueStart = i;
            while (i < n && !/\s/.test(str[i])) i++;
            value = str.slice(valueStart, i);
        }

        attrs.set(name, value);
    }

    return attrs;
}

/**
 * Parses a string that may contain a name, attributes, and a trailing comment.
 * Format: `[name] [attr1=value1 attr2] ... [// comment]`
 * @param {string} str - The input string.
 * @returns {ParsedHead}
 */
export function parseHead(str) {
    const trimmed = str.trim();
    if (trimmed === '') {
        return { name: '', attributes: new Map(), description: null };
    }

    // Extract the first token as the name
    const nameMatch = trimmed.match(/^(\S+)/);
    const name = nameMatch ? nameMatch[1] : '';
    let rest = trimmed.slice(name.length).trim();
    let description = null;

    // Split off comment (everything after the first "//")
    const commentIndex = rest.indexOf('//');
    if (commentIndex !== -1) {
        const rawDesc = rest.slice(commentIndex + 2).trim();
        if (rawDesc) description = unescapeComment(rawDesc);
        rest = rest.slice(0, commentIndex).trim();
    }

    const attributes = parseAttributes(rest);
    return { name, attributes, description };
}

/**
 * Converts a name, attributes map, and description into a string representation.
 * Attributes are output as `key="value"` (value JSON-escaped) or `key` if value is empty.
 * Description is escaped with `escapeComment` and prefixed with `//`.
 * @param {string} name - The name (record full name, section name, or empty for fields).
 * @param {Map<string, string>} attributes - Map of attributes.
 * @param {string|null} description - Optional description.
 * @returns {string} The formatted string.
 */
export function stringifyHead(name, attributes, description) {
    const parts = name ? [name] : [];
    const attrStrings = [];
    for (const [key, val] of attributes) {
        if (val === '') {
            attrStrings.push(key);
        } else {
            const escaped = JSON.stringify(val).slice(1, -1); // remove surrounding quotes
            attrStrings.push(`${key}="${escaped}"`);
        }
    }
    if (attrStrings.length) parts.push(attrStrings.join(' '));
    if (description) parts.push(`// ${escapeComment(description)}`);
    return parts.join(' ');
}

/**
 * Parses a string containing only attributes and an optional comment.
 * Used for field attribute strings where there is no leading name.
 * @param {string} str
 * @returns {{ attributes: Map<string, string>, description: string|null }}
 */
/**
 * Parses a string containing only attributes and an optional comment.
 * @param {string} str
 * @returns {{ attributes: Map<string, string>, description: string|null }}
 */
export function parseAttributesAndComment(str) {
    const trimmed = str.trim();
    let description = null;
    let attrsStr = trimmed;
    const commentIndex = trimmed.indexOf('//');
    if (commentIndex !== -1) {
        const rawDesc = trimmed.slice(commentIndex + 2).trim();
        if (rawDesc) description = unescapeComment(rawDesc);
        attrsStr = trimmed.slice(0, commentIndex).trim();
    }
    const attributes = parseAttributes(attrsStr);
    return { attributes, description };
}
