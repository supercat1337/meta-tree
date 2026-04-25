import test from 'ava';
import { MetaRecord } from '../src/tree/meta-record.js';
import { MetaField } from '../src/tree/meta-field.js';

test('constructor creates record with main section', t => {
    const record = new MetaRecord('user', 'profile', 'update', 'User profile update');
    t.is(record.entityName, 'user');
    t.is(record.propertyName, 'profile');
    t.is(record.actionName, 'update');
    t.is(record.verb, 'set');
    t.is(record.description, 'User profile update');
    t.true(record.hasSection('main'));
    t.is(record.getMainSection().name, 'main');
});

test('getFullName constructs name correctly', t => {
    let r = new MetaRecord('user', null, null);
    t.is(r.getFullName(), 'user');
    r = new MetaRecord('user', 'profile', null);
    t.is(r.getFullName(), 'user.profile');
    r = new MetaRecord('user', 'profile', 'update');
    t.is(r.getFullName(), 'user.profile.update');
});

test('addSection and getSection', t => {
    const record = new MetaRecord('order');
    const section = record.addSection('items');
    t.true(record.hasSection('items'));
    t.is(record.getSection('items'), section);
    t.throws(() => record.addSection('items'), { message: /already exists/ });
    t.throws(() => record.deleteSection('main'), { message: /Cannot delete/ });
});

test('addField to main section', t => {
    const record = new MetaRecord('user');
    const field = new MetaField('username');
    record.addField(field);
    t.true(record.hasField('username'));
    t.is(record.getField('username'), field);
});

test('addField to custom section', t => {
    const record = new MetaRecord('user');
    const field = new MetaField('street');
    record.addField(field, 'address');
    t.true(record.hasSection('address'));
    t.true(record.hasField('street', 'address'));
});

test('getFields returns array or empty array', t => {
    const record = new MetaRecord('user');
    t.deepEqual(record.getFields(), []);
    record.addField(new MetaField('name'));
    t.is(record.getFields().length, 1);
    t.deepEqual(record.getFields('nonexistent'), []);
});

test('deleteField returns boolean', t => {
    const record = new MetaRecord('user');
    record.addField(new MetaField('name'));
    t.true(record.deleteField('name'));
    t.false(record.deleteField('name'));
});

test('stringify includes description with minimal escaping', t => {
    const record = new MetaRecord('user', null, null, 'Line1\nLine2\\Backslash');
    const str = record.stringify();
    t.true(str.includes('Line1\\nLine2\\\\Backslash'));
});

test('clone creates independent copy', t => {
    const original = new MetaRecord('user', 'profile', 'update');
    original.addField(new MetaField('age'));
    const cloned = original.clone();
    t.deepEqual(original.toJSON(), cloned.toJSON());
    t.not(original, cloned);
    cloned.addField(new MetaField('newField'));
    t.false(original.hasField('newField'));
});
