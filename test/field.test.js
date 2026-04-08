import test from 'ava';
import { Field } from '../src/tree/field.js';

test('constructor creates field with defaults', t => {
    const field = new Field('username');
    t.is(field.name, 'username');
    t.false(field.isOptional);
    t.is(field.defaultValue, null);
    t.is(field.description, null);
    t.deepEqual(Array.from(field.attributes.entries()), []);
});

test('constructor validates field name', t => {
    t.throws(() => new Field('user name'), { message: /Invalid field name/ });
    t.throws(() => new Field('user@name'), { message: /Invalid field name/ });
    t.notThrows(() => new Field('user_name'));
    t.notThrows(() => new Field('user.name'));
});

test('attributes manipulation', t => {
    const field = new Field('email');
    field.setAttribute('maxLength', '64');
    t.true(field.hasAttribute('maxLength'));
    t.is(field.getAttribute('maxLength'), '64');
    field.deleteAttribute('maxLength');
    t.false(field.hasAttribute('maxLength'));
    t.is(field.getAttribute('maxLength'), null);
});

test('stringify required field', t => {
    const field = new Field('username');
    field.setAttribute('maxLength', '32');
    field.description = 'User name';
    const str = field.stringify();
    t.is(str, 'username    maxLength="32" // User name');
});

test('stringify optional field with default', t => {
    const field = new Field('role', true, 'guest');
    const str = field.stringify();
    t.is(str, '[role="guest"]');
});

test('stringify optional field without default', t => {
    const field = new Field('role', true, null);
    const str = field.stringify();
    t.is(str, '[role]');
});

test('stringify escapes backslashes and newlines in description', t => {
    const field = new Field('note', false, null, 'Line1\nLine2\\Backslash');
    const str = field.stringify();
    t.is(str, 'note    // Line1\\nLine2\\\\Backslash');
});

test('clone creates independent copy', t => {
    const original = new Field('test', true, 'default', 'desc');
    original.setAttribute('attr', 'val');
    const cloned = original.clone();
    t.deepEqual(original.toJSON(), cloned.toJSON());
    t.not(original, cloned);
    cloned.setAttribute('attr', 'changed');
    t.is(original.getAttribute('attr'), 'val');
});
