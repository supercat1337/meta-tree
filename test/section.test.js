import test from 'ava';
import { MetaSection } from '../src/tree/meta-section.js';
import { MetaField } from '../src/tree/meta-field.js';

test('constructor validates section name', t => {
    t.throws(() => new MetaSection('my section'), { message: /cannot contain spaces/ });
    t.throws(() => new MetaSection(''), { message: /cannot be empty/ });
    t.throws(() => new MetaSection('@main'), { message: /Invalid section name/ });
    t.notThrows(() => new MetaSection('main'));
    t.notThrows(() => new MetaSection('returns'));
});

test('addField and getField', t => {
    const section = new MetaSection('main');
    const field = new MetaField('email');
    section.addField(field);
    t.true(section.hasField('email'));
    t.is(section.getField('email'), field);
    t.throws(() => section.addField(field), { message: /already exists/ });
});

test('setField overwrites existing field', t => {
    const section = new MetaSection('main');
    const f1 = new MetaField('email');
    const f2 = new MetaField('email');
    section.setField(f1);
    section.setField(f2);
    t.is(section.getField('email'), f2);
});

test('getFields returns array', t => {
    const section = new MetaSection('main');
    section.addField(new MetaField('a'));
    section.addField(new MetaField('b'));
    const fields = section.getFields();
    t.is(fields.length, 2);
    t.is(fields[0].name, 'a');
    t.is(fields[1].name, 'b');
});

test('stringify main section', t => {
    const section = new MetaSection('main');
    section.addField(new MetaField('username'));
    const str = section.stringify();
    t.is(str, '    username');
});

test('stringify named section', t => {
    const section = new MetaSection('returns');
    section.addField(new MetaField('result'));
    const str = section.stringify();
    t.is(str, '    @returns\n    result');
});

test('clone creates deep copy', t => {
    const original = new MetaSection('test');
    original.addField(new MetaField('f1'));
    const cloned = original.clone();
    t.deepEqual(original.toJSON(), cloned.toJSON());
    t.not(original, cloned);
    t.not(original.getField('f1'), cloned.getField('f1'));
});
