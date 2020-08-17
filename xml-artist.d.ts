declare function parse(xml: string | Buffer, options?: XmlParseOptions): XmlNode;
declare function parseJson(json: string): XmlNode;
declare function parseFile(filename: string, options?: XmlParseOptions): XmlNode;

declare class XmlNode {
    public readonly name : string;
    public readonly attributes : { [key : string] : string };
    public readonly children : [ XmlNode | string ];
    public readonly parent? : XmlNode;
    public readonly processingInstructions? : [ { name: string, body: string} ];

    constructor(node?: XmlNodeInfo);
    public find(name: string | string[]): XmlNode | null;
    public findAll(name: string | string[]): XmlNode[] | null;
    public findChild(name: string | string[]): XmlNode | null;
    public findAllChildren(name: string | string[]): XmlNode[] | null;
    public findParent(name: string | string[]): XmlNode[] | null;
    public findAllParents(name?: string | string[]): XmlNode[] | null;
    public walk(callbacks: {
        node?: (xmlNode: XmlNode) => any,
        text?: (value: string, parent: XmlNode) => any,
        comment?: (value: string, parent: XmlNode) => any,
        cdata?: (value: string, parent: XmlNode) => any,
        doctype?: (value: string, parent: XmlNode) => any
    }): void;
    public walk(
        node?: (xmlNode: XmlNode) => any,
        text?: (value: string, parent: XmlNode) => any,
        comment?: (value: string, parent: XmlNode) => any,
        cdata?: (value: string, parent: XmlNode) => any,
        doctype?: (value: string, parent: XmlNode) => any
    ): void;
    public asyncWalk(callbacks: {
        node?: (xmlNode: XmlNode) => Promise<any>,
        text?: (value: string, parent: XmlNode) => Promise<any>,
        comment?: (value: string, parent: XmlNode) => Promise<any>,
        cdata?: (value: string, parent: XmlNode) => Promise<any>,
        doctype?: (value: string, parent: XmlNode) => Promise<any>
    }): void;
    public push(element: XmlNode | string | Array<XmlNode | string>, before?: number | XmlNode): void;
    public replaceWith(element: XmlNode | string | Array<XmlNode | string>): void;
    public parse(xml: string | Buffer, options?: XmlParseOptions): void;
    public clone(): XmlNode;
    public remove(): void;
    public removeChild(element: XmlNode | string): void;
    public pushTo(element: XmlNode | string, before?: number | XmlNode): void;
    public empty(): void;
    public toXml(pretty?: boolean): string;
    public toXmlFile(filename: string, pretty?: boolean): string;
    public toJson(): string;
    public get innerText(): string;
}

export interface XmlParseOptions {
    strict?: boolean;
    trim?: boolean;
    normalize?: boolean;
    lowercase?: boolean;
    xmlns?: boolean;
    position?: boolean;
    strictEntities?: boolean;
}

interface XmlNodeInfo {
    readonly name : string;
    readonly attributes?: { [key : string] : string };
    readonly children?: [ XmlNode | string ];
    readonly parent?: XmlNode;
    readonly processingInstructions?: [{ name: string, body: string}];
}
