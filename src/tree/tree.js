// @ts-check

import { Record } from "./record.js";

class Tree {
    /** @type {Map<string, Record>} */
    records = new Map();

    constructor() {}

    /**
     * Adds a new record to the tree.
     * @param {string} entityName - The name of the entity for the record.
     * @param {string|null} propertyName - The name of the property for the record, or null if not applicable.
     * @param {string|null} verb - The verb associated with the record, or null if not applicable.
     * @param {string|null} description - The description of the record, or null if not applicable.
     * @returns {Record} The newly created record.
     */
    addRecord(
        entityName,
        propertyName = null,
        verb = null,
        description = null
    ) {
        let record = new Record(entityName, propertyName, verb, description);
        let fullName = record.getFullName();

        if (this.records.has(fullName))
            throw new Error(`Record already exists: ${fullName}`);

        this.records.set(fullName, record);

        return record;
    }

    /**
     * Checks if a record exists in the tree by its full name.
     * @param {string} recordFullName - The full name of the record to check.
     * @returns {boolean} True if the record exists, false otherwise.
     */
    hasRecord(recordFullName) {
        return this.records.has(recordFullName);
    }

    /**
     * Retrieves a record from the tree by its full name.
     * @param {string} recordFullName - The full name of the record to retrieve.
     * @returns {Record|null} The record if found, otherwise null.
     */
    getRecord(recordFullName) {
        return this.records.get(recordFullName) || null;
    }

    /**
     * Deletes a record from the tree by its full name.
     * @param {string} recordFullName - The full name of the record to delete.
     */
    deleteRecord(recordFullName) {
        this.records.delete(recordFullName);
    }

    /**
     * Retrieves all records in the tree.
     * @returns {Record[]} An array of all records in the tree.
     */
    getRecords() {
        return Array.from(this.records.values());
    }

    /**
     * Sets a record in the tree, overwriting any existing record with the same full name.
     * @param {Record} record - The record to set.
     */
    setRecord(record) {
        this.records.set(record.getFullName(), record);
    }

    /**
     * Retrieves all record names in the tree.
     * @returns {string[]} An array of all record names in the tree.
     */
    getRecordNames() {
        return Array.from(this.records.keys());
    }

    /**
     * Converts all records in the tree to their string representations and joins them.
     * @returns {string} A string representation of all records, separated by two newlines.
     */
    stringify() {
        return Array.from(this.records.values())
            .map((record) => record.stringify())
            .join("\n\n");
    }

    /**
     * Converts the tree to a JSON-compatible object.
     * @returns {object} A JSON-compatible object with a "records" property that is an array of JSON-compatible records.
     */
    toJSON() {
        return {
            records: Array.from(this.records.values()).map((record) =>
                record.toJSON()
            ),
        };
    }
}

export { Tree };
