export declare class BinaryReader {
    view: DataView;
    offset: number;
    constructor(data: Uint8Array, offset?: number);
    canRead(n?: number): boolean;
    readUint8(): number | undefined;
    readInt32(): number | undefined;
    readInt64(): bigint | undefined;
    readFloat(): number | undefined;
    readUint32(): number | undefined;
    readUint64(): bigint | undefined;
    readULEB128(): number | undefined;
    readString(): string | undefined;
    readCompressedString(): string | undefined;
    readUint8Vector2(): {
        x: number;
        y: number;
    } | undefined;
    readVector2(): {
        x: number;
        y: number;
    } | undefined;
    readArrayVector2(): {
        x: number;
        y: number;
    }[] | undefined;
    readArrayUint32(): any[] | undefined;
    readUint16(): number | undefined;
    readInt16(): number | undefined;
    readInt8(): number | undefined;
    readArrayInt32(): any[] | undefined;
    readArrayUint8(): any[] | undefined;
}
