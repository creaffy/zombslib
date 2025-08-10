import { EnterWorldResponse, EnterWorldRequest, EntityMap, Rpc, NetworkEntity, EntityUpdate } from "../../types/Packets";
import { ZRCrypto } from "./ZRCrypto";
export declare class Codec {
    crypto: ZRCrypto;
    entityMaps: EntityMap[];
    enterWorldResponse: EnterWorldResponse;
    readonly rpcMapping: DumpedData;
    readonly entityList: Map<number, NetworkEntity>;
    constructor(rpcMapping: DumpedData);
    private decodeEntityMapAttribute;
    private encodeEntityMapAttribute;
    getAttributeName(nameHash: number): string;
    private encodeRpcParams;
    decodeEnterWorldResponse(data: Uint8Array): EnterWorldResponse;
    encodeEnterWorldResponse(response: EnterWorldResponse): Uint8Array;
    decodeEntityUpdate(data: Uint8Array): EntityUpdate;
    encodeEntityUpdate(entityUpdate: EntityUpdate): Uint8Array;
    decodeEnterWorldRequest(data: Uint8Array): EnterWorldRequest | undefined;
    encodeEnterWorldRequest(request: EnterWorldRequest): Uint8Array;
    decodeRpc(def: Rpc, data: Uint8Array): {
        name: string | null;
        data: {};
    } | undefined;
    encodeRpc(name: string, data: object | object[]): Uint8Array<ArrayBufferLike> | undefined;
}
export interface DumpedRpcParam {
    InternalIndex: number;
    Key: number | null;
    NameHash: number;
    Offset: number;
    Type: number;
    XFieldName: string | null;
    FieldName: string | null;
}
export interface DumpedRpc {
    IsArray: boolean;
    NameHash: number;
    Parameters: DumpedRpcParam[];
    XClassName: string;
    XParentName: string;
    ClassName: string | null;
    ParentName: string;
}
export interface DumpedData {
    Codec: number;
    Platform: string;
    Rpcs: DumpedRpc[];
}
