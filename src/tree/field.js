// @ts-check

class Field {
    /** @type {string} */
    name;

    /** @type {Map<string, string|null>} */
    attributes = new Map();

    /** @type {boolean} */
    isOptional = false;

    /** @type {string|null} */
    defaultValue;

    /** @type {string|null} */
    description;

    /**
     * @param {string} name
     * @param {boolean} [isOptional=false]
     * @param {string|null} [defaultValue=null]
     * @param {string|null} [description=null]
     */
    constructor(
        name,
        isOptional = false,
        defaultValue = null,
        description = null
    ) {
        this.name = name;
        this.isOptional = isOptional;
        this.defaultValue = defaultValue;
        this.description = description;
    }

    /**
     * @param {string} name
     * @return {boolean}
     */
    hasAttribute(name) {
        return this.attributes.has(name);
    }

    /**
     * @param {string} name
     * @return {string|null}
     */
    getAttribute(name) {
        return this.attributes.get(name) || null;
    }

    /**
     * Deletes an attribute from the field.
     * @param {string} name The name of the attribute to delete.
     */
    deleteAttribute(name) {
        this.attributes.delete(name);
    }

    /**
     * Sets an attribute for the field.
     * @param {string} name
     * @param {number|string|null} [value=null]
     */
    setAttribute(name, value = null) {
        if (typeof value === "number") {
            value = value.toString();
        }
        this.attributes.set(name, value);
    }

    #attrsToString() {
        return Array.from(this.attributes.entries())
            .map(([name, value]) => {
                if (value) {
                    let v = value
                        .replace(/"/g, '\\"')
                        .replace(/'/g, "\\'")
                        .replace(/\r?\n/g, "\\n");
                    return `${name}="${v}"`;
                }
                return name;
            })
            .join(" ");
    }

    #descriptionToString() {
        if (!this.description) {
            return "";
        }

        return (
            "// " +
            this.description.replace(/"/g, "&quot;").replace(/\r?\n/g, "\\n")
        ).trim();
    }

    stringify() {
        let nameStr = this.isOptional
            ? `[${this.name}="${this.defaultValue}"]`
            : this.name;
        let attrs = this.#attrsToString();
        let desc = this.#descriptionToString();
        return `${nameStr}    ${attrs} ${desc}`.trim();
    }

    /**
     * Converts the field to a JSON-compatible object.
     * @returns {object} A JSON-compatible object with "name", "isOptional", "defaultValue",
     *                   "description", and "attributes" properties. The "attributes" property
     *                   is an array of key-value pairs representing the field's attributes.
     */
    toJSON() {
        return {
            name: this.name,
            isOptional: this.isOptional,
            defaultValue: this.defaultValue,
            description: this.description,
            attributes: Array.from(this.attributes.entries()),
        };
    }
}

export { Field };
