import test from 'ava';
import { expandMacros } from '../src/index.js';

test('expandMacros expands macros correctly', t => {
    const dsl = `
#define-attr uint32 type="integer" min="0" max="4294967295"
users.get
    id    #uint32 is_primary
`;
    const expected = `users.get
    id    type="integer" min="0" max="4294967295" is_primary
`;
    const result = expandMacros(dsl);
    t.is(result.trim(), expected.trim());
});
