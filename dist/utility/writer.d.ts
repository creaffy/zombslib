import { Vector2 } from "../types/network";
export declare class BinaryWriter {
    view: DataView;
    offset: number;
    constructor(length: number);
    checkBufferSize(size: number): void;
    writeUint8(value: number): void;
    writeInt32(value: number): void;
    writeInt64(value: bigint): void;
    writeUint32(value: number): void;
    writeUint64(value: bigint): void;
    writeFloat(value: number): void;
    writeULEB128(value: number): void;
    writeString(value: string): void;
    writeCompressedString(value: string): void;
    writeUint8Vector2(value: Vector2): void;
    writeVector2(value: Vector2): void;
    writeArrayVector2(data: Vector2[]): void;
    writeArrayUint32(data: Uint32Array): void;
    writeUint16(value: number): void;
    writeInt16(value: number): void;
    writeUint16BE(value: number): void;
    writeInt16BE(value: number): void;
    writeInt8(value: number): void;
    writeArrayInt32(data: Int32Array): void;
    writeArrayUint8(data: Uint8Array): void;
    writeUint8Array(data: Uint8Array): void;
    toArray(): Uint8Array<ArrayBufferLike>;
}
