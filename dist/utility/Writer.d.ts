import { Vector2 } from "../types/Packets";
export declare class BufferWriter {
    view: DataView;
    offset: number;
    constructor(length?: number);
    resize(size: number): void;
    toArray(): Uint8Array<ArrayBufferLike>;
    i8(v: number): void;
    u8(v: number): void;
    i16(v: number, le?: boolean): void;
    u16(v: number, le?: boolean): void;
    i32(v: number, le?: boolean): void;
    u32(v: number, le?: boolean): void;
    i64(v: bigint, le?: boolean): void;
    u64(v: bigint, le?: boolean): void;
    u8vec2(v: Vector2): void;
    i32vec2(v: Vector2): void;
    i32vec2arr32(arr: Vector2[]): void;
    u32arr32(arr: Uint32Array): void;
    i32arr32(arr: Int32Array): void;
    u8arr8(arr: Uint8Array): void;
    u8arr32(arr: Uint8Array): void;
    u8arr(arr: Uint8Array): void;
    varint(v: number): void;
    string(str: string): void;
    compressedString(str: string): void;
}
