export declare class BinaryReader {
    view: DataView;
    offset: number;
    constructor(data: Uint8Array, offset?: number);
    canRead(n?: number): boolean;
    readUint8(): number;
    readInt32(): number;
    readInt64(): bigint;
    readFloat(): number;
    readUint32(): number;
    readUint64(): bigint;
    readULEB128(): number;
    readString(): string;
    readCompressedString(): string;
    readUint8Vector2(): {
        x: number;
        y: number;
    };
    readVector2(): {
        x: number;
        y: number;
    };
    readArrayVector2(): {
        x: number;
        y: number;
    }[];
    readArrayUint32(): any[];
    readUint16(): number;
    readInt16(): number;
    readInt8(): number;
    readArrayInt32(): any[];
    readArrayUint8(): any[];
}
