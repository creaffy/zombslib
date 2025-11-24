"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZRCrypto = void 0;
const js_sha1_1 = require("js-sha1");
class ZRCrypto {
    constructor() {
        this.rpcKey = new Uint8Array(8);
    }
    computeRpcKey(codecVersion, targetUrl, proofOfWork) {
        for (let i = 0; i < proofOfWork.length; ++i)
            this.rpcKey[i % this.rpcKey.length] ^= proofOfWork[i];
        for (let i = 0; i < this.rpcKey.length; ++i)
            this.rpcKey[i] ^= codecVersion;
        for (let i = 0; i < targetUrl.length; ++i)
            this.rpcKey[i % this.rpcKey.length] ^= targetUrl[i];
    }
    generateProofOfWork(endpoint, platform = "Android", difficulty = 13, size = 24) {
        const config = platformConfigs[platform];
        const pathBytes = Buffer.from("/" + endpoint, "utf8");
        const powBuffer = Buffer.alloc(size + pathBytes.length);
        powBuffer.set(pathBytes, size);
        let state = Math.random() * 0xffffffff || Math.floor(Math.random() * Math.pow(2, 32));
        while (true) {
            for (let i = 0; i < size; ++i) {
                state ^= state << 13;
                state ^= state >>> 17;
                state ^= state << 5;
                powBuffer[i] = state;
            }
            config.logic(powBuffer);
            this.applyCommonMask(powBuffer);
            const hash = js_sha1_1.sha1.create();
            Object.assign(hash, config.hashState);
            hash.update(powBuffer);
            const digest = Buffer.from(hash.digest()).swap32();
            let d = 0;
            while (true) {
                if ((digest[Math.floor(d / 8)] & (128 >> d % 8)) == 0) {
                    break;
                }
                if (++d === difficulty) {
                    return powBuffer.subarray(0, size);
                }
            }
        }
    }
    // TODO: Rewrite to return string | undefined (up for discussion)
    validateProofOfWork(proofOfWork, endpoint, difficulty = 13, size = 24) {
        const powBuffer = Buffer.from(proofOfWork);
        const pathBytes = Buffer.from("/" + endpoint, "utf8");
        for (const [platformName, { hashState, logic }] of Object.entries(platformConfigs)) {
            const fullBuffer = Buffer.alloc(size + pathBytes.length);
            powBuffer.copy(fullBuffer, 0, 0, size);
            pathBytes.copy(fullBuffer, size);
            logic(fullBuffer);
            this.applyCommonMask(fullBuffer);
            const hash = js_sha1_1.sha1.create();
            Object.assign(hash, hashState);
            hash.update(fullBuffer);
            const digest = Buffer.from(hash.digest()).swap32();
            let d = 0;
            while (true) {
                if ((digest[Math.floor(d / 8)] & (128 >> d % 8)) == 0) {
                    break;
                }
                if (++d === difficulty) {
                    return { valid: true, platform: platformName };
                }
            }
        }
        return { valid: false };
    }
    cryptRpc(data) {
        let rpc = new Uint8Array(data);
        for (let i = 1; i < rpc.length; ++i)
            rpc[i] ^= this.rpcKey[i % this.rpcKey.length];
        return rpc;
    }
    applyCommonMask(buffer) {
        buffer[4] &= 253;
        buffer[2] &= 254;
        buffer[5] &= 223;
        buffer[8] |= 32;
        buffer[9] &= 251;
    }
}
exports.ZRCrypto = ZRCrypto;
const platformConfigs = {
    Windows: {
        hashState: {
            h0: 0xcde4bac7,
            h1: 0xb6217224,
            h2: 0x872a5994,
            h3: 0xcf538f47,
            h4: 0xec8dc5a1,
        },
        logic(buf) {
            buf[7] |= 8;
            buf[6] &= 239;
            buf[3] &= 127;
        },
    },
    Web: {
        hashState: {
            h0: 0x04c82ad0,
            h1: 0x2beacb85,
            h2: 0x4ccc8e6b,
            h3: 0x849ad64a,
            h4: 0x57ada298,
        },
        logic(buf) {
            buf[7] &= 247;
            buf[6] |= 16;
            buf[3] &= 127;
        },
    },
    Android: {
        hashState: {
            h0: 0xa9c9f023,
            h1: 0x14f071e7,
            h2: 0xc2d99914,
            h3: 0x8e8dda42,
            h4: 0xb8acc665,
        },
        logic(buf) {
            buf[7] &= 247;
            buf[6] &= 239;
            buf[3] |= 128;
        },
    },
};
