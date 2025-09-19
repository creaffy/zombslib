"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferReader = void 0;
const zlib_1 = require("zlib");
class BufferReader {
    constructor(data, offset = 0) {
        this.view = new DataView(data.buffer);
        this.offset = offset;
    }
    canRead(n = 1) {
        return this.offset + n <= this.view.byteLength;
    }
    i8() {
        if (!this.canRead(1)) {
            return undefined;
        }
        const v = this.view.getInt8(this.offset);
        this.offset += 1;
        return v;
    }
    u8() {
        if (!this.canRead(1)) {
            return undefined;
        }
        const v = this.view.getUint8(this.offset);
        this.offset += 1;
        return v;
    }
    i16(le = true) {
        if (!this.canRead(2)) {
            return undefined;
        }
        const v = this.view.getInt16(this.offset, le);
        this.offset += 2;
        return v;
    }
    u16(le = true) {
        if (!this.canRead(2)) {
            return undefined;
        }
        const v = this.view.getUint16(this.offset, le);
        this.offset += 2;
        return v;
    }
    i32(le = true) {
        if (!this.canRead(4)) {
            return undefined;
        }
        const v = this.view.getInt32(this.offset, le);
        this.offset += 4;
        return v;
    }
    u32(le = true) {
        if (!this.canRead(4)) {
            return undefined;
        }
        const v = this.view.getUint32(this.offset, le);
        this.offset += 4;
        return v;
    }
    i64(le = true) {
        if (!this.canRead(8)) {
            return undefined;
        }
        const v = this.view.getBigInt64(this.offset, le);
        this.offset += 8;
        return v;
    }
    u64(le = true) {
        if (!this.canRead(8)) {
            return undefined;
        }
        const v = this.view.getBigUint64(this.offset, le);
        this.offset += 8;
        return v;
    }
    // Uint8 Vector2
    u8vec2() {
        if (!this.canRead(2)) {
            return undefined;
        }
        const x = this.view.getUint8(this.offset);
        const y = this.view.getUint8(this.offset);
        this.offset += 2;
        return { x, y };
    }
    // Int32 Vector2
    i32vec2() {
        if (!this.canRead(8)) {
            return undefined;
        }
        const x = this.view.getInt32(this.offset);
        const y = this.view.getInt32(this.offset);
        this.offset += 8;
        return { x, y };
    }
    // Int32 Vector2 Array (Length = Int32)
    i32vec2arr32() {
        const length = this.i32();
        if (length === undefined) {
            return undefined;
        }
        if (!this.canRead(length * 8) || length < 0) {
            return undefined;
        }
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.i32vec2();
        }
        return result;
    }
    // Uint32 Array (Length = Int32)
    u32arr32() {
        const length = this.i32();
        if (length === undefined) {
            return undefined;
        }
        if (!this.canRead(length * 4) || length < 0) {
            return undefined;
        }
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.u32();
        }
        return result;
    }
    // Int32 Array (Length = Int32)
    i32arr32() {
        const length = this.i32();
        if (length === undefined) {
            return undefined;
        }
        if (!this.canRead(length * 4) || length < 0) {
            return undefined;
        }
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.i32();
        }
        return result;
    }
    // Uint8 Array (Length = Uint8)
    u8arr8() {
        const length = this.u8();
        if (length === undefined) {
            return undefined;
        }
        if (!this.canRead(length) || length < 0) {
            return undefined;
        }
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.u8();
        }
        return result;
    }
    // Uint8 Array (Length = Uint32)
    u8arr32() {
        const length = this.u32();
        if (length === undefined) {
            return undefined;
        }
        if (!this.canRead(length) || length < 0) {
            return undefined;
        }
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.u8();
        }
        return result;
    }
    // Uint8 Array
    u8arr(length) {
        if (!this.canRead(length) || length < 0) {
            return undefined;
        }
        const result = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.u8();
        }
        return result;
    }
    // ULEB128
    varint() {
        let result = 0;
        let shift = 0;
        let byte = 0;
        do {
            if (!this.canRead(1)) {
                return undefined;
            }
            byte = this.view.getUint8(this.offset);
            this.offset++;
            result |= (byte & 0x7f) << shift;
            shift += 7;
        } while ((byte & 0x80) !== 0);
        return result;
    }
    string() {
        if (!this.canRead(1)) {
            return undefined;
        }
        const firstByte = this.view.getUint8(this.offset);
        let length = 0;
        if ((firstByte & 0x80) === 0) {
            length = firstByte; // MSB = 0, single-byte length (Uint8)
            this.offset += 1;
        }
        else {
            length = this.varint(); // MSB = 1, multi-byte unsigned LEB128 length
        }
        if (length === undefined || !this.canRead(length)) {
            return undefined;
        }
        let value = "";
        for (let i = 0; i < length; i++) {
            const charCode = this.view.getUint8(this.offset + i);
            value += String.fromCharCode(charCode);
        }
        this.offset += length;
        return value;
    }
    compressedString() {
        const length = this.u32();
        if (length === undefined) {
            return undefined;
        }
        if (!this.canRead(length)) {
            return undefined;
        }
        const data = this.view.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return (0, zlib_1.gunzipSync)(Buffer.from(data)).toString();
    }
}
exports.BufferReader = BufferReader;
