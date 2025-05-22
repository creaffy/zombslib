import { EnterWorldResponse, Rpc, NetworkEntity, EntityUpdate } from "../types/rpc";
export declare class Codec {
    private rpcKey;
    private entityMaps;
    private rpcMapping;
    enterWorldResponse: EnterWorldResponse;
    entityList: Map<number, NetworkEntity>;
    constructor(path: string);
    computeRpcKey(codecVersion: number, targetUrl: Uint8Array, proofOfWork: Uint8Array): void;
    generateProofOfWork(endpoint: string, platform?: string, difficulty?: number, size?: number): Buffer<ArrayBuffer>;
    cryptRpc(data: Uint8Array): Uint8Array;
    private decodeEntityMapAttribute;
    decodeEnterWorldResponse(data: Uint8Array): EnterWorldResponse;
    decodeEntityUpdate(data: Uint8Array): EntityUpdate;
    decodeRpc(def: Rpc, data: Uint8Array): {
        name: string | null;
        data: {};
    } | undefined;
    private encodeRpcParams;
    encodeRpc(name: string, data: object | object[]): Uint8Array<ArrayBufferLike> | undefined;
}
