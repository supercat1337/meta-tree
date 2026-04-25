import test from 'ava';
import { treeFromString } from '../src/tools/treeFromString.js';
import { MetaField } from '../src/tree/meta-field.js';
import { MetaTree } from '../src/tree/meta-tree.js';

test('parses simple record with one field', t => {
    const input = `user.profile.update
    username    maxLength="32" // The display name`;
    const tree = treeFromString(input);
    const record = tree.getRecord('user.profile.update');
    t.truthy(record);
    const field = record.getField('username');
    t.truthy(field);
    t.is(field.getAttribute('maxLength'), '32');
    t.is(field.description, 'The display name');
});

test('parses optional field with default value', t => {
    const input = `config
    [role="guest"]`;
    const tree = treeFromString(input);
    const record = tree.getRecord('config');
    const field = record.getField('role');
    t.true(field.isOptional);
    t.is(field.defaultValue, 'guest');
});

test('parses optional field without default', t => {
    const input = `config
    [flag]`;
    const tree = treeFromString(input);
    const record = tree.getRecord('config');
    const field = record.getField('flag');
    t.true(field.isOptional);
    t.is(field.defaultValue, null);
});

test('parses escaped backslashes and newlines in description', t => {
    const input = `log
    message // Line1\\nLine2\\\\Backslash`;
    const tree = treeFromString(input);
    const field = tree.getRecord('log').getField('message');
    t.is(field.description, 'Line1\nLine2\\Backslash');
});

test('parses attributes with JSON escapes', t => {
    const input = `test
    field    regex="\\d+" note="He said: \\"Hello\\""`;
    const tree = treeFromString(input);
    const field = tree.getRecord('test').getField('field');
    t.is(field.getAttribute('regex'), 'd+');
    t.is(field.getAttribute('note'), 'He said: "Hello"');
});

test('parses section and fields', t => {
    const input = `user.profile.update
    username
    @returns
    result    boolean`;
    const tree = treeFromString(input);
    const record = tree.getRecord('user.profile.update');
    t.true(record.hasField('username', 'main'));
    t.true(record.hasField('result', 'returns'));
});

test('handles multiple records', t => {
    const input = `user.create
    name

user.delete
    id`;
    const tree = treeFromString(input);
    t.true(tree.hasRecord('user.create'));
    t.true(tree.hasRecord('user.delete'));
});

test('round-trip serialization/deserialization', async t => {
    const originalTree = new MetaTree();
    const record = originalTree.addRecord('product', 'price', 'update', 'Product price update');
    const field = new MetaField('amount', false, null, 'New price');
    field.setAttribute('min', '0');
    record.addField(field);
    const stringified = originalTree.stringify();
    const parsedTree = treeFromString(stringified);
    t.deepEqual(originalTree.toJSON(), parsedTree.toJSON());
});

test('throws on invalid field syntax', t => {
    const input = `record\n    [invalid`;
    t.throws(() => treeFromString(input), { message: /Invalid field/ });
});
