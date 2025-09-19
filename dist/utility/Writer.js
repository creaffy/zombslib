"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferWriter = void 0;
const zlib_1 = require("zlib");
class BufferWriter {
    constructor(length = 0) {
        this.view = new DataView(new ArrayBuffer(length));
        this.offset = 0;
    }
    resize(size) {
        const newLength = this.offset + size;
        if (newLength > this.view.byteLength) {
            const newBuffer = new ArrayBuffer(newLength);
            const newView = new Uint8Array(newBuffer);
            newView.set(new Uint8Array(this.view.buffer));
            this.view = new DataView(newBuffer);
        }
    }
    toArray() {
        return new Uint8Array(this.view.buffer, 0, this.offset);
    }
    i8(v) {
        this.resize(1);
        this.view.setInt8(this.offset, v);
        this.offset += 1;
    }
    u8(v) {
        this.resize(1);
        this.view.setUint8(this.offset, v);
        this.offset += 1;
    }
    i16(v, le = true) {
        this.resize(2);
        this.view.setInt16(this.offset, v, le);
        this.offset += 2;
    }
    u16(v, le = true) {
        this.resize(2);
        this.view.setUint16(this.offset, v, le);
        this.offset += 2;
    }
    i32(v, le = true) {
        this.resize(4);
        this.view.setInt32(this.offset, v, le);
        this.offset += 4;
    }
    u32(v, le = true) {
        this.resize(4);
        this.view.setUint32(this.offset, v, le);
        this.offset += 4;
    }
    i64(v, le = true) {
        this.resize(8);
        this.view.setBigInt64(this.offset, v, le);
        this.offset += 8;
    }
    u64(v, le = true) {
        this.resize(8);
        this.view.setBigUint64(this.offset, v, le);
        this.offset += 8;
    }
    // Uint8 Vector2
    u8vec2(v) {
        this.u8(v.x);
        this.u8(v.y);
    }
    // Int32 Vector2
    i32vec2(v) {
        this.i32(v.x);
        this.i32(v.y);
    }
    // Int32 Vector2 Array (Length = Int32)
    i32vec2arr32(arr) {
        this.i32(arr.length);
        for (const v of arr) {
            this.i32vec2(v);
        }
    }
    // Uint32 Array (Length = Int32)
    u32arr32(arr) {
        this.i32(arr.length);
        for (const v of arr) {
            this.u32(v);
        }
    }
    // Int32 Array (Length = Int32)
    i32arr32(arr) {
        this.i32(arr.length);
        for (const v of arr) {
            this.u32(v);
        }
    }
    // Uint8 Array (Length = Uint8)
    u8arr8(arr) {
        this.u8(arr.length);
        for (const v of arr) {
            this.u8(v);
        }
    }
    // Uint8 Array (Length = Uint32)
    u8arr32(arr) {
        this.u32(arr.length);
        for (const v of arr) {
            this.u8(v);
        }
    }
    // Uint8 Array
    u8arr(arr) {
        for (const v of arr) {
            this.u8(v);
        }
    }
    // ULEB128
    varint(v) {
        do {
            let byte = v & 0x7f;
            v >>>= 7;
            if (v !== 0) {
                byte |= 0x80;
            }
            this.u8(byte);
        } while (v !== 0);
    }
    string(str) {
        const length = str.length;
        if (length < 0x80) {
            this.u8(length); // Single-byte length
        }
        else {
            this.varint(length); // Multi-byte ULEB128 length
        }
        this.resize(length);
        for (let i = 0; i < length; i++) {
            this.view.setUint8(this.offset + i, str.charCodeAt(i));
        }
        this.offset += length;
    }
    compressedString(str) {
        const compressed = (0, zlib_1.gzipSync)(str);
        const length = compressed.length;
        this.u32(length);
        this.resize(length);
        for (let i = 0; i < length; i++) {
            this.view.setUint8(this.offset + i, compressed[i]);
        }
        this.offset += length;
    }
}
exports.BufferWriter = BufferWriter;
