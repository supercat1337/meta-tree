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
 * Parses a string of HTML-like attributes, e.g. `key1=value1 key2 key3="quoted value"`.
 * Quoted values are JSON-parsed to handle escapes.
 * @param {string} str - The attribute string.
 * @returns {Map<string, string>} Map of attribute names to values.
 */
function parseAttributes(str) {
    const attrs = new Map();
    const trimmed = str.trim();
    if (!trimmed) return attrs;

    let i = 0;
    const n = trimmed.length;

    while (i < n) {
        while (i < n && /\s/.test(trimmed[i])) i++;
        if (i >= n) break;

        // Читаем имя атрибута
        let nameStart = i;
        while (i < n && /[\w$-]/.test(trimmed[i])) i++;
        if (nameStart === i) break; 
        const name = trimmed.slice(nameStart, i);

        while (i < n && /\s/.test(trimmed[i])) i++;
        if (i >= n || trimmed[i] !== '=') {
            attrs.set(name, '');
            continue;
        }
        i++;

        while (i < n && /\s/.test(trimmed[i])) i++;
        if (i >= n) {
            attrs.set(name, '');
            break;
        }

        let value = '';
        const ch = trimmed[i];
        if (ch === '"' || ch === "'") {
            const quote = ch;
            i++;
            let valueStart = i;
            while (i < n && trimmed[i] !== quote) {
                if (trimmed[i] === '\\' && i + 1 < n) {
                    i++;
                }
                i++;
            }
            value = trimmed.slice(valueStart, i);
            value = value.replace(/\\(["'])/g, '$1');
            i++;
        } else {
            let valueStart = i;
            while (i < n && !/\s/.test(trimmed[i])) i++;
            value = trimmed.slice(valueStart, i);
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
