import { gunzipSync } from "zlib";

export class BinaryReader {
    public view: DataView;
    public offset: number;

    constructor(data: Uint8Array, offset: number = 0) {
        this.view = new DataView(data.buffer);
        this.offset = offset || 0;
    }

    canRead(n = 1) {
        return this.offset + n <= this.view.byteLength;
    }

    readUint8() {
        const value = this.view.getUint8(this.offset);
        this.offset++;
        return value;
    }

    readInt32() {
        const value = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readInt64() {
        const value = this.view.getBigInt64(this.offset, true);
        this.offset += 8;
        return value;
    }

    readFloat() {
        const value = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readUint32() {
        const value = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readUint64() {
        const value = this.view.getBigUint64(this.offset, true);
        this.offset += 8;
        return value;
    }

    readString() {
        const length = this.readUint8();
        let value = "";
        for (let i = 0; i < length; i++) {
            const charCode = this.view.getUint8(this.offset + i);
            value += String.fromCharCode(charCode);
        }
        this.offset += length;
        return value;
    }

    readCompressedString() {
        const length = this.readUint32();
        const data = this.view.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return gunzipSync(data).toString();
    }

    readUint8Vector2() {
        const x = this.readUint8();
        const y = this.readUint8();
        return { x, y };
    }

    readVector2() {
        const x = this.readFloat();
        const y = this.readFloat();
        return { x, y };
    }

    readArrayVector2() {
        const length = this.readInt32();
        let result: { x: number; y: number }[] = [];
        for (let i = 0; i < length; i++) {
            result.push(this.readVector2());
        }
        return result;
    }

    readArrayUint32() {
        const length = this.readInt32();
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.readUint32();
        }
        return result;
    }

    readUint16() {
        const value = this.view.getUint16(this.offset);
        this.offset += 2;
        return value;
    }

    readInt16() {
        const value = this.view.getInt16(this.offset);
        this.offset += 2;
        return value;
    }

    readInt8() {
        const value = this.view.getInt8(this.offset);
        this.offset += 1;
        return value;
    }

    readArrayInt32() {
        const length = this.readInt32();
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.readInt32();
        }
        return result;
    }

    readArrayUint8() {
        const length = this.readUint8();
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.readUint8();
        }
        return result;
    }
}
