import test from 'ava';
import { Section } from '../src/tree/section.js';
import { Field } from '../src/tree/field.js';

test('constructor validates section name', t => {
    t.throws(() => new Section('my section'), { message: /cannot contain spaces/ });
    t.throws(() => new Section(''), { message: /cannot be empty/ });
    t.throws(() => new Section('@main'), { message: /Invalid section name/ });
    t.notThrows(() => new Section('main'));
    t.notThrows(() => new Section('returns'));
});

test('addField and getField', t => {
    const section = new Section('main');
    const field = new Field('email');
    section.addField(field);
    t.true(section.hasField('email'));
    t.is(section.getField('email'), field);
    t.throws(() => section.addField(field), { message: /already exists/ });
});

test('setField overwrites existing field', t => {
    const section = new Section('main');
    const f1 = new Field('email');
    const f2 = new Field('email');
    section.setField(f1);
    section.setField(f2);
    t.is(section.getField('email'), f2);
});

test('getFields returns array', t => {
    const section = new Section('main');
    section.addField(new Field('a'));
    section.addField(new Field('b'));
    const fields = section.getFields();
    t.is(fields.length, 2);
    t.is(fields[0].name, 'a');
    t.is(fields[1].name, 'b');
});

test('stringify main section', t => {
    const section = new Section('main');
    section.addField(new Field('username'));
    const str = section.stringify();
    t.is(str, '    username');
});

test('stringify named section', t => {
    const section = new Section('returns');
    section.addField(new Field('result'));
    const str = section.stringify();
    t.is(str, '    @returns\n    result');
});

test('clone creates deep copy', t => {
    const original = new Section('test');
    original.addField(new Field('f1'));
    const cloned = original.clone();
    t.deepEqual(original.toJSON(), cloned.toJSON());
    t.not(original, cloned);
    t.not(original.getField('f1'), cloned.getField('f1'));
});
