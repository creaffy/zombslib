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
        if (!this.canRead(1)) return undefined;
        const value = this.view.getUint8(this.offset);
        this.offset++;
        return value;
    }

    readInt32() {
        if (!this.canRead(4)) return undefined;
        const value = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readInt64() {
        if (!this.canRead(8)) return undefined;
        const value = this.view.getBigInt64(this.offset, true);
        this.offset += 8;
        return value;
    }

    readFloat() {
        if (!this.canRead(4)) return undefined;
        const value = this.view.getInt32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readUint32() {
        if (!this.canRead(4)) return undefined;
        const value = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return value;
    }

    readUint64() {
        if (!this.canRead(8)) return undefined;
        const value = this.view.getBigUint64(this.offset, true);
        this.offset += 8;
        return value;
    }

    readULEB128() {
        let result = 0;
        let shift = 0;
        let byte = 0;
        do {
            if (!this.canRead(1)) return undefined;
            byte = this.view.getUint8(this.offset);
            this.offset++;
            result |= (byte & 0x7f) << shift;
            shift += 7;
        } while ((byte & 0x80) !== 0);
        return result;
    }

    readString() {
        if (!this.canRead(1)) return undefined;
        const firstByte = this.view.getUint8(this.offset);
        let length: number | undefined = 0;
        if ((firstByte & 0x80) === 0) {
            length = firstByte; // MSB = 0, single-byte length (Uint8)
            this.offset += 1;
        } else {
            length = this.readULEB128(); // MSB = 1, multi-byte unsigned LEB128 length
        }
        if (length === undefined || !this.canRead(length)) return undefined;
        let value = "";
        for (let i = 0; i < length; i++) {
            const charCode = this.view.getUint8(this.offset + i);
            value += String.fromCharCode(charCode);
        }
        this.offset += length;
        return value;
    }

    readCompressedString() {
        if (!this.canRead(4)) return undefined;
        const length = this.readUint32()!;
        if (!this.canRead(length)) return undefined;
        const data = this.view.buffer.slice(this.offset, this.offset + length);
        this.offset += length;
        return gunzipSync(data).toString();
    }

    readUint8Vector2() {
        if (!this.canRead(2)) return undefined;
        const x = this.readUint8()!;
        const y = this.readUint8()!;
        return { x, y };
    }

    readVector2() {
        if (!this.canRead(8)) return undefined;
        const x = this.readFloat()!;
        const y = this.readFloat()!;
        return { x, y };
    }

    readArrayVector2() {
        if (!this.canRead(4)) return undefined;
        const length = this.readInt32()!;
        if (!this.canRead(length * 8)) return undefined;
        let result: { x: number; y: number }[] = [];
        for (let i = 0; i < length; i++) {
            result.push(this.readVector2()!);
        }
        return result;
    }

    readArrayUint32() {
        if (!this.canRead(4)) return undefined;
        const length = this.readInt32()!;
        if (!this.canRead(length * 4)) return undefined;
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.readUint32()!;
        }
        return result;
    }

    readUint16LE() {
        if (!this.canRead(2)) return undefined;
        const value = this.view.getUint16(this.offset, true);
        this.offset += 2;
        return value;
    }

    readInt16LE() {
        if (!this.canRead(2)) return undefined;
        const value = this.view.getInt16(this.offset, true);
        this.offset += 2;
        return value;
    }

    readUint16() {
        if (!this.canRead(2)) return undefined;
        const value = this.view.getUint16(this.offset);
        this.offset += 2;
        return value;
    }

    readInt16() {
        if (!this.canRead(2)) return undefined;
        const value = this.view.getInt16(this.offset);
        this.offset += 2;
        return value;
    }

    readInt8() {
        if (!this.canRead(1)) return undefined;
        const value = this.view.getInt8(this.offset);
        this.offset += 1;
        return value;
    }

    readArrayInt32() {
        if (!this.canRead(4)) return undefined;
        const length = this.readInt32()!;
        if (!this.canRead(length * 4)) return undefined;
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.readInt32()!;
        }
        return result;
    }

    readArrayUint8() {
        if (!this.canRead(1)) return undefined;
        const length = this.readUint8()!;
        if (!this.canRead(length)) return undefined;
        const result = new Array(length);
        for (let i = 0; i < length; i++) {
            result[i] = this.readUint8()!;
        }
        return result;
    }
}
