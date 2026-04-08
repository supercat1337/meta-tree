// @ts-check

import test from 'ava';
import { preprocessMacros } from '../src/tools/macro-preprocessor.js';
import { treeFromStringWithMacros } from '../src/tools/treeFromString.js';

test('attribute macro without parameters', t => {
    const input = `
#define-attr UInt32 type="integer" min="0" max="4294967295"

links.add
    link_id    #UInt32
`;
    const expected = `
links.add
    link_id    type="integer" min="0" max="4294967295"
`;
    const actual = preprocessMacros(input);
    t.is(actual.trim(), expected.trim());
});

test('attribute macro with parameters', t => {
    const input = `
#define-attr String(min,max) type="string" length_min="{{min}}" length_max="{{max}}"

links.add
    link_name  #String(1,64)
`;
    const expected = `
links.add
    link_name  type="string" length_min="1" length_max="64"
`;
    const actual = preprocessMacros(input);
    t.is(actual.trim(), expected.trim());
});

test('block macro', t => {
    const input = `
#define-block LinkFields
    link_id    type="integer"
    user_id    type="integer"
#end

links.add
    #LinkFields
`;
    const expected = `
links.add
    link_id    type="integer"
    user_id    type="integer"
`;
    const actual = preprocessMacros(input);
    t.is(actual.trim(), expected.trim());
});

test('nested macros (attribute inside block)', t => {
    const input = `
#define-attr UInt32 type="integer" min="0" max="4294967295"
#define-block LinkFields
    link_id    #UInt32
    user_id    #UInt32
#end

links.add
    #LinkFields
`;
    const expected = `
links.add
    link_id    type="integer" min="0" max="4294967295"
    user_id    type="integer" min="0" max="4294967295"
`;
    const actual = preprocessMacros(input);
    t.is(actual.trim(), expected.trim());
});

test('macro redefinition throws error', t => {
    const input = `
#define-attr UInt32 type="integer"
#define-attr UInt32 type="float"
`;
    t.throws(() => preprocessMacros(input), { message: /Macro already defined/ });
});

test('macro argument count mismatch throws error', t => {
    const input = `
#define-attr String(min,max) type="string"
links.add
    link_name  #String(1)
`;
    t.throws(() => preprocessMacros(input), { message: /expects 2 arguments, got 1/ });
});

test('missing #end throws error', t => {
    const input = `
#define-block LinkFields
    link_id    type="integer"
`;
    t.throws(() => preprocessMacros(input), { message: /Missing #end/ });
});

test('integration with treeFromStringWithMacros', t => {
    const input = `
#define-attr UInt32 type="integer" min="0" max="4294967295"

links.add
    link_id    #UInt32 is_primary
    user_id    #UInt32

    @returns
        link_id    #UInt32
`;
    const tree = treeFromStringWithMacros(input);
    const record = tree.getRecord('links.add');
    t.truthy(record);
    const linkIdField = record.getField('link_id');
    t.is(linkIdField.getAttribute('type'), 'integer');
    t.is(linkIdField.getAttribute('min'), '0');
    t.is(linkIdField.getAttribute('max'), '4294967295');
    t.true(linkIdField.hasAttribute('is_primary'));
    const userIdField = record.getField('user_id');
    t.is(userIdField.getAttribute('type'), 'integer');
    const returnSection = record.getSection('returns');
    t.truthy(returnSection);
    const returnLinkId = returnSection.getField('link_id');
    t.is(returnLinkId.getAttribute('type'), 'integer');
});

test('macro call inside attribute macro body (nested expansion)', t => {
    const input = `
#define-attr Base type="integer"
#define-attr Extended #Base min="0"
links.add
    field    #Extended
`;
    const expected = `
links.add
    field    type="integer" min="0"
`;
    const actual = preprocessMacros(input);
    t.is(actual.trim(), expected.trim());
});

test('block macro with empty lines in body', t => {
    const input = `
#define-block FieldsWithGap
    field1    type="string"

    field2    type="integer"
#end

test.record
    #FieldsWithGap
`;
    const expected = `
test.record
    field1    type="string"

    field2    type="integer"
`;
    const actual = preprocessMacros(input);
    t.is(actual.trim(), expected.trim());
});

test('block macro with parameters', t => {
    const input = `
#define-block LinkFields(prefix)
    {{prefix}}_id    type="integer"
    {{prefix}}_name  type="string"
#end

links.add
    #LinkFields(link)
`;
    const expected = `
links.add
    link_id    type="integer"
    link_name  type="string"
`;
    const actual = preprocessMacros(input);
    t.is(actual.trim(), expected.trim());
});
