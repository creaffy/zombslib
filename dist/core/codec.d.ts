import { BinaryWriter } from "../utility/writer";
import { AttributeType, EnterWorldResponse, EnterWorldRequest, Rpc, NetworkEntity, EntityUpdate } from "../types/network";
export declare class Codec {
    private rpcKey;
    private entityMaps;
    enterWorldResponse: EnterWorldResponse;
    readonly rpcMapping: DumpedData;
    readonly entityList: Map<number, NetworkEntity>;
    constructor(path: string);
    computeRpcKey(codecVersion: number, targetUrl: Uint8Array, proofOfWork: Uint8Array): void;
    generateProofOfWork(endpoint: string, platform?: string, difficulty?: number, size?: number): Buffer<ArrayBuffer>;
    validateProofOfWork(powBuffer: Buffer, endpoint: string, difficulty?: number, size?: number): {
        valid: boolean;
        platform: string | null;
    };
    cryptRpc(data: Uint8Array): Uint8Array;
    private decodeEntityMapAttribute;
    encodeEntityMapAttribute(writer: BinaryWriter, type: AttributeType | undefined, value: any): void;
    decodeEnterWorldResponse(data: Uint8Array): EnterWorldResponse;
    encodeEnterWorldResponse(response: EnterWorldResponse): Uint8Array;
    decodeEntityUpdate(data: Uint8Array): EntityUpdate;
    decodeEnterWorldRequest(data: Uint8Array): EnterWorldRequest;
    encodeEnterWorldRequest(request: EnterWorldRequest): Uint8Array;
    encodeEntityUpdate(update: EntityUpdate): Uint8Array;
    decodeRpc(def: Rpc, data: Uint8Array): {
        name: string | null;
        data: {};
    } | undefined;
    private encodeRpcParams;
    encodeRpc(name: string, data: object | object[]): Uint8Array<ArrayBufferLike> | undefined;
}
interface DumpedRpcParam {
    InternalIndex: number;
    Key: number | null;
    NameHash: number;
    Offset: number;
    Type: number;
    XFieldName: string | null;
    FieldName: string | null;
}
interface DumpedRpc {
    IsArray: boolean;
    NameHash: number;
    Parameters: DumpedRpcParam[];
    XClassName: string;
    XParentName: string;
    ClassName: string | null;
    ParentName: string;
}
interface DumpedData {
    Codec: number;
    Platform: string;
    Rpcs: DumpedRpc[];
}
export {};
