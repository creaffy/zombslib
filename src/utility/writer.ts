import { Vector2 } from "../types/network";
import { gzipSync } from "zlib";

export class BinaryWriter {
    public view: DataView;
    public offset: number;

    constructor(length: number) {
        this.view = new DataView(new ArrayBuffer(length));
        this.offset = 0;
    }

    checkBufferSize(size: number) {
        const newLength = this.offset + size;
        if (newLength > this.view.byteLength) {
            const newBuffer = new ArrayBuffer(newLength);
            const newView = new Uint8Array(newBuffer);
            newView.set(new Uint8Array(this.view.buffer));
            this.view = new DataView(newBuffer);
        }
    }

    writeUint8(value: number) {
        this.checkBufferSize(1);
        this.view.setUint8(this.offset, value);
        this.offset += 1;
    }

    writeInt32(value: number) {
        this.checkBufferSize(4);
        this.view.setInt32(this.offset, value, true);
        this.offset += 4;
    }

    writeInt64(value: bigint) {
        this.checkBufferSize(8);
        this.view.setBigInt64(this.offset, value, true);
        this.offset += 8;
    }

    writeUint32(value: number) {
        this.checkBufferSize(4);
        this.view.setUint32(this.offset, value, true);
        this.offset += 4;
    }

    writeUint64(value: bigint) {
        this.checkBufferSize(8);
        this.view.setBigUint64(this.offset, value, true);
        this.offset += 8;
    }

    writeFloat(value: number) {
        this.checkBufferSize(4);
        this.view.setInt32(this.offset, value, true);
        this.offset += 4;
    }

    writeULEB128(value: number) {
        do {
            let byte = value & 0x7f;
            value >>>= 7;
            if (value !== 0) {
                byte |= 0x80;
            }
            this.writeUint8(byte);
        } while (value !== 0);
    }

    writeString(value: string) {
        const length = value.length;
        if (length < 0x80) {
            this.writeUint8(length); // Single-byte length
        } else {
            this.writeULEB128(length); // Multi-byte ULEB128 length
        }
        this.checkBufferSize(length);
        for (let i = 0; i < length; i++) {
            this.view.setUint8(this.offset + i, value.charCodeAt(i));
        }
        this.offset += length;
    }

    writeCompressedString(value: string) {
        const compressed = gzipSync(value);
        const length = compressed.length;
        this.writeUint32(length);
        this.checkBufferSize(length);
        for (let i = 0; i < length; i++) {
            this.view.setUint8(this.offset + i, compressed[i]);
        }
        this.offset += length;
    }

    writeUint8Vector2(value: Vector2) {
        this.writeUint8(value.x);
        this.writeUint8(value.y);
    }

    writeVector2(value: Vector2) {
        this.writeInt32(value.x);
        this.writeInt32(value.y);
    }

    writeArrayVector2(data: Vector2[]) {
        this.writeInt32(data.length);
        for (const vector of data) {
            this.writeVector2(vector);
        }
    }

    writeArrayUint32(data: Uint32Array) {
        this.writeInt32(data.length);
        for (const value of data) {
            this.writeUint32(value);
        }
    }

    writeUint16(value: number) {
        this.checkBufferSize(2);
        this.view.setUint16(this.offset, value, true);
        this.offset += 2;
    }

    writeInt16(value: number) {
        this.checkBufferSize(2);
        this.view.setInt16(this.offset, value, true);
        this.offset += 2;
    }

    writeUint16BE(value: number) {
        this.checkBufferSize(2);
        this.view.setUint16(this.offset, value);
        this.offset += 2;
    }

    writeInt16BE(value: number) {
        this.checkBufferSize(2);
        this.view.setInt16(this.offset, value);
        this.offset += 2;
    }

    writeInt8(value: number) {
        this.checkBufferSize(1);
        this.view.setInt8(this.offset, value);
        this.offset += 1;
    }

    writeArrayInt32(data: Int32Array) {
        this.writeInt32(data.length);
        for (const value of data) {
            this.writeInt32(value);
        }
    }

    writeArrayUint8(data: Uint8Array) {
        this.writeUint8(data.length);
        for (const value of data) {
            this.writeUint8(value);
        }
    }

    writeUint8Array(data: Uint8Array) {
        for (const value of data) {
            this.writeUint8(value);
        }
    }

    toArray() {
        return new Uint8Array(this.view.buffer, 0, this.offset);
    }
}
