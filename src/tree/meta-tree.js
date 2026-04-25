// @ts-check

import { MetaRecord } from './meta-record.js';

export class MetaTree {
    /** @type {Map<string, MetaRecord>} */
    records = new Map();

    constructor() {}

    /**
     * Adds a new record to the tree.
     * @param {string} entityName
     * @param {string|null} [propertyName=null]
     * @param {string|null} [actionName=null]
     * @param {string|null} [description=null]
     * @returns {MetaRecord}
     * @throws {Error} When a record with the same full name already exists.
     */
    addRecord(entityName, propertyName = null, actionName = null, description = null) {
        const record = new MetaRecord(entityName, propertyName, actionName, description);
        const fullName = record.getFullName();
        if (this.records.has(fullName)) throw new Error(`Record already exists: ${fullName}`);
        this.records.set(fullName, record);
        return record;
    }

    /**
     * Checks if a record exists by its full name.
     * @param {string} recordFullName
     * @returns {boolean}
     */
    hasRecord(recordFullName) {
        return this.records.has(recordFullName);
    }

    /**
     * Retrieves a record by its full name.
     * @param {string} recordFullName
     * @returns {MetaRecord|null}
     */
    getRecord(recordFullName) {
        return this.records.get(recordFullName) || null;
    }

    /**
     * Deletes a record.
     * @param {string} recordFullName
     */
    deleteRecord(recordFullName) {
        this.records.delete(recordFullName);
    }

    /**
     * Returns all records in the tree.
     * @returns {MetaRecord[]}
     */
    getRecords() {
        return Array.from(this.records.values());
    }

    /**
     * Sets a record (overwrites if exists).
     * @param {MetaRecord} record
     */
    setRecord(record) {
        this.records.set(record.getFullName(), record);
    }

    /**
     * Returns all record full names.
     * @returns {string[]}
     */
    getRecordNames() {
        return Array.from(this.records.keys());
    }

    /**
     * Serializes the entire tree to a DSL string.
     * @returns {string}
     */
    stringify() {
        return Array.from(this.records.values())
            .map(record => record.stringify())
            .join('\n\n');
    }

    /**
     * Returns a JSON-compatible object.
     * @returns {{ records: Array<ReturnType<MetaRecord['toJSON']>> }}
     */
    toJSON() {
        return {
            records: Array.from(this.records.values()).map(r => r.toJSON()),
        };
    }
}
