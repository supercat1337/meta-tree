export interface MacroAttr {
    type: 'attr';
    params: string[];
    body: string;
}

export interface MacroBlock {
    type: 'block';
    params: string[];
    body: string;
}

export type Macro = MacroAttr | MacroBlock;

export type ParsedHead = {
    /**
     * - The extracted name (record full name, section name, etc.)
     */
    name: string;
    /**
     * - Map of attribute names to values (empty string for valueless)
     */
    attributes: Map<string, string>;
    /**
     * - The comment after "//", or null
     */
    description: string | null;
};


declare global {
    interface MacroAttr extends _MacroAttr {}
    interface MacroBlock extends _MacroBlock {}
    type Macro = _Macro;
    interface ParsedHead extends _ParsedHead {}
}

type _MacroAttr = MacroAttr;
type _MacroBlock = MacroBlock;
type _Macro = Macro;
type _ParsedHead = ParsedHead;