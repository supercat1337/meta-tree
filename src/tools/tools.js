// @ts-check

/**
 * Attempts to determine the verb of an action from its name.
 * @param {string|null} actionName - The name of the action.
 * @returns {"get"|"set"|"add"|"delete"|"list"|"check"|null} The verb of the action, or null if it could not be determined.
 */
export function getVerbFromActionName(actionName) {
    if (actionName === null) return null;
    if (!actionName) return null;

    actionName = actionName.trim();

    if (actionName.startsWith("get")) return "get";
    else if (actionName.startsWith("set")) return "set";
    else if (actionName.startsWith("add")) return "add";
    else if (actionName.startsWith("delete")) return "delete";
    else if (/list/i.test(actionName)) return "list";
    else if (actionName.startsWith("check")) return "check";
    else return "check";
}
