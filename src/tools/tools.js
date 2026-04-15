// @ts-check

/**
 * Attempts to determine the verb of an action from its name.
 * @param {string|null} actionName - The name of the action.
 * @returns {"get"|"set"|"add"|"delete"|"list"|"check"|"other"|null} The verb of the action, or null if it could not be determined.
 */
export function getVerbFromActionName(actionName) {
    if (!actionName) return null;
    const lower = actionName.trim().toLowerCase();

    if (
        lower.startsWith('get') ||
        lower.startsWith('fetch') ||
        lower.startsWith('retrieve') ||
        lower.startsWith('find')
    )
        return 'get';

    if (
        lower.startsWith('set') ||
        lower.startsWith('update') ||
        lower.startsWith('put') ||
        lower.startsWith('patch') ||
        lower.startsWith('replace')
    )
        return 'set';

    if (
        lower.startsWith('add') ||
        lower.startsWith('create') ||
        lower.startsWith('post') ||
        lower.startsWith('insert') ||
        lower.startsWith('new')
    )
        return 'add';

    if (
        lower.startsWith('delete') ||
        lower.startsWith('remove') ||
        lower.startsWith('del') ||
        lower.startsWith('erase')
    )
        return 'delete';

    if (
        lower.includes('list') ||
        lower.startsWith('search') ||
        lower.startsWith('query') ||
        lower.startsWith('findall') ||
        lower.startsWith('getall')
    )
        return 'list';

    if (
        lower.startsWith('check') ||
        lower.startsWith('validate') ||
        lower.startsWith('verify') ||
        lower.startsWith('test')
    )
        return 'check';

    return 'other'; // fallback
}
