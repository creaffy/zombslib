export declare class ZRCrypto {
    rpcKey: Uint8Array<ArrayBuffer>;
    computeRpcKey(codecVersion: number, targetUrl: Uint8Array, proofOfWork: Uint8Array): Uint8Array<ArrayBuffer>;
    generateProofOfWork(endpoint: string, platform: "Android" | "Windows" | "Web", difficulty?: number, size?: number): Buffer<ArrayBuffer>;
    validateProofOfWork(proofOfWork: Uint8Array, endpoint: string, difficulty?: number, size?: number): {
        valid: boolean;
        platform?: string;
    };
    cryptRpc(data: Uint8Array): Uint8Array;
    private applyCommonMask;
}
