import { EnterWorldResponse, EnterWorldRequest, EntityMap, Rpc, NetworkEntity, EntityUpdate, RpcMetadata, UdpConnectRequest, UdpConnectResponse, UdpFragment, UdpTick, UdpAckTickRequest } from "../../types/Packets";
import { ZRCrypto } from "./ZRCrypto";
export declare class Codec {
    crypto: ZRCrypto;
    entityMaps: EntityMap[];
    enterWorldResponse: EnterWorldResponse;
    readonly rpcMapping: DumpedData;
    readonly entityList: Map<number, NetworkEntity>;
    private readonly fragments;
    private highestTickSeen;
    constructor(rpcMapping: DumpedData);
    private decodeEntityMapAttribute;
    private encodeEntityMapAttribute;
    private decodeRpcObject;
    private encodeRpcObject;
    getAttributeName(nameHash: number): string;
    decodeEnterWorldResponse(data: Uint8Array): EnterWorldResponse | undefined;
    encodeEnterWorldResponse(response: EnterWorldResponse): Uint8Array<ArrayBuffer | SharedArrayBuffer>;
    decodeEntityUpdate(data: Uint8Array): EntityUpdate | undefined;
    encodeEntityUpdate(entityUpdate: EntityUpdate): Uint8Array<ArrayBuffer | SharedArrayBuffer>;
    decodeEnterWorldRequest(data: Uint8Array): {
        displayName: string;
        version: number;
        proofOfWork: Uint8Array<ArrayBuffer>;
    } | undefined;
    encodeEnterWorldRequest(request: EnterWorldRequest): Uint8Array<ArrayBufferLike>;
    decodeRpc(def: Rpc, data: Uint8Array, udp: boolean): {
        name: string;
        data: any;
        metadata: RpcMetadata;
    } | undefined;
    encodeRpc(name: string, data: object | object[], udp?: boolean, tick?: number): Uint8Array<ArrayBufferLike> | undefined;
    decodeUdpConnectRequest(data: Uint8Array): UdpConnectRequest | undefined;
    encodeUdpConnectRequest(request: UdpConnectRequest): Uint8Array<ArrayBufferLike>;
    decodeUdpConnectResponse(data: Uint8Array): UdpConnectResponse | undefined;
    encodeUdpConnectResponse(request: UdpConnectResponse): Uint8Array<ArrayBufferLike>;
    decodeUdpFragment(data: Uint8Array): {
        fragment: UdpFragment;
        buffer: Uint8Array<ArrayBufferLike> | undefined;
    } | undefined;
    decodeUdpTick(data: Uint8Array, compressed: boolean): UdpTick | undefined;
    decodeUdpAckTickRequest(data: Uint8Array): UdpAckTickRequest | undefined;
    encodeUdpAckTickRequest(request: UdpAckTickRequest): Uint8Array<ArrayBufferLike>;
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
