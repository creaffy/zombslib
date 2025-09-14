export declare class BufferReader {
    view: DataView;
    offset: number;
    constructor(data: Uint8Array, offset?: number);
    canRead(n?: number): boolean;
    i8(): number | undefined;
    u8(): number | undefined;
    i16(le?: boolean): number | undefined;
    u16(le?: boolean): number | undefined;
    i32(le?: boolean): number | undefined;
    u32(le?: boolean): number | undefined;
    i64(le?: boolean): bigint | undefined;
    u64(le?: boolean): bigint | undefined;
    u8vec2(): {
        x: number;
        y: number;
    } | undefined;
    i32vec2(): {
        x: number;
        y: number;
    } | undefined;
    i32vec2arr32(): any[] | undefined;
    u32arr32(): any[] | undefined;
    i32arr32(): any[] | undefined;
    u8arr8(): any[] | undefined;
    u8arr32(): any[] | undefined;
    varint(): number | undefined;
    string(): string | undefined;
    compressedString(): string | undefined;
}
