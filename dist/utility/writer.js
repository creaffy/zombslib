"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinaryWriter = void 0;
const zlib_1 = require("zlib");
class BinaryWriter {
    constructor(length) {
        this.view = new DataView(new ArrayBuffer(length));
        this.offset = 0;
    }
    checkBufferSize(size) {
        const newLength = this.offset + size;
        if (newLength > this.view.byteLength) {
            const newBuffer = new ArrayBuffer(newLength);
            const newView = new Uint8Array(newBuffer);
            newView.set(new Uint8Array(this.view.buffer));
            this.view = new DataView(newBuffer);
        }
    }
    writeUint8(value) {
        this.checkBufferSize(1);
        this.view.setUint8(this.offset, value);
        this.offset += 1;
    }
    writeInt32(value) {
        this.checkBufferSize(4);
        this.view.setInt32(this.offset, value, true);
        this.offset += 4;
    }
    writeInt64(value) {
        this.checkBufferSize(8);
        this.view.setBigInt64(this.offset, value, true);
        this.offset += 8;
    }
    writeUint32(value) {
        this.checkBufferSize(4);
        this.view.setUint32(this.offset, value, true);
        this.offset += 4;
    }
    writeUint64(value) {
        this.checkBufferSize(8);
        this.view.setBigUint64(this.offset, value, true);
        this.offset += 8;
    }
    writeFloat(value) {
        this.checkBufferSize(4);
        this.view.setInt32(this.offset, value, true);
        this.offset += 4;
    }
    writeULEB128(value) {
        do {
            let byte = value & 0x7f;
            value >>>= 7;
            if (value !== 0) {
                byte |= 0x80;
            }
            this.writeUint8(byte);
        } while (value !== 0);
    }
    writeString(value) {
        const length = value.length;
        if (length < 0x80) {
            this.writeUint8(length); // Single-byte length
        }
        else {
            this.writeULEB128(length); // Multi-byte ULEB128 length
        }
        this.checkBufferSize(length);
        for (let i = 0; i < length; i++) {
            this.view.setUint8(this.offset + i, value.charCodeAt(i));
        }
        this.offset += length;
    }
    writeCompressedString(value) {
        const compressed = (0, zlib_1.gzipSync)(value);
        const length = compressed.length;
        this.writeUint32(length);
        this.checkBufferSize(length);
        for (let i = 0; i < length; i++) {
            this.view.setUint8(this.offset + i, compressed[i]);
        }
        this.offset += length;
    }
    writeUint8Vector2(value) {
        this.writeUint8(value.x);
        this.writeUint8(value.y);
    }
    writeVector2(value) {
        this.writeInt32(value.x);
        this.writeInt32(value.y);
    }
    writeArrayVector2(data) {
        this.writeInt32(data.length);
        for (const vector of data) {
            this.writeVector2(vector);
        }
    }
    writeArrayUint32(data) {
        this.writeInt32(data.length);
        for (const value of data) {
            this.writeUint32(value);
        }
    }
    writeUint16(value) {
        this.checkBufferSize(2);
        this.view.setUint16(this.offset, value, true);
        this.offset += 2;
    }
    writeInt16(value) {
        this.checkBufferSize(2);
        this.view.setInt16(this.offset, value, true);
        this.offset += 2;
    }
    writeInt8(value) {
        this.checkBufferSize(1);
        this.view.setInt8(this.offset, value);
        this.offset += 1;
    }
    writeArrayInt32(data) {
        this.writeInt32(data.length);
        for (const value of data) {
            this.writeInt32(value);
        }
    }
    writeArrayUint8(data) {
        this.writeUint8(data.length);
        for (const value of data) {
            this.writeUint8(value);
        }
    }
    writeUint8Array(data) {
        for (const value of data) {
            this.writeUint8(value);
        }
    }
    toArray() {
        return new Uint8Array(this.view.buffer, 0, this.offset);
    }
}
exports.BinaryWriter = BinaryWriter;
