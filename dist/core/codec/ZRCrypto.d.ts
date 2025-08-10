export declare class ZRCrypto {
    private rpcKey;
    computeRpcKey(codecVersion: number, targetUrl: Uint8Array, proofOfWork: Uint8Array): void;
    generateProofOfWork(endpoint: string, platform?: string, difficulty?: number, size?: number): Buffer<ArrayBuffer>;
    validateProofOfWork(proofOfWork: Uint8Array, endpoint: string, difficulty?: number, size?: number): {
        valid: boolean;
        platform?: string;
    };
    cryptRpc(data: Uint8Array): Uint8Array;
    private applyCommonMask;
}
