// @ts-check

import test from 'ava';
import { Tree } from '../src/tree/tree.js';

test('addRecord and getRecord', t => {
    const tree = new Tree();
    const record = tree.addRecord('user', 'profile', 'update');
    const fullName = record.getFullName();
    t.true(tree.hasRecord(fullName));
    t.is(tree.getRecord(fullName), record);
    t.throws(() => tree.addRecord('user', 'profile', 'update'), { message: /already exists/ });
});

test('setRecord overwrites', async t => {
    const tree = new Tree();
    const r1 = tree.addRecord('product', 'price', 'get');
    const r2 = new (await import('../src/tree/record.js')).Record('product', 'price', 'get');
    tree.setRecord(r2);
    t.is(tree.getRecord('product.price.get'), r2);
});

test('deleteRecord', t => {
    const tree = new Tree();
    tree.addRecord('a');
    tree.deleteRecord('a');
    t.false(tree.hasRecord('a'));
});

test('getRecords and getRecordNames', t => {
    const tree = new Tree();
    tree.addRecord('a');
    tree.addRecord('b');
    t.is(tree.getRecords().length, 2);
    t.deepEqual(tree.getRecordNames(), ['a', 'b']);
});

test('stringify joins records with double newline', t => {
    const tree = new Tree();
    tree.addRecord('a', null, null, 'desc a');
    tree.addRecord('b', null, null, 'desc b');
    const str = tree.stringify();
    t.true(str.includes('desc a'));
    t.true(str.includes('desc b'));
    t.true(str.includes('\n\n'));
});
