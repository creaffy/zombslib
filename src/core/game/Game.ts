import { EventEmitter } from "node:events";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Agent } from "node:http";
import { WebSocket } from "ws";
import { Codec, DumpedData } from "../codec/Codec";
import { ApiServer } from "../../types/Api";
import { GameEvents } from "./GameEvents";
import {
    CompressedDataRpc,
    EntityType,
    EntityUpdate,
    InputRpc,
    MetricsRpc,
    PacketId,
    SetSkinRpc,
    Vector2,
} from "../../types/Packets";
import { createSocket, Socket } from "node:dgram";

export function rpcMappingFromFile(path: string): DumpedData {
    return JSON.parse(
        readFileSync(path, {
            encoding: "utf-8",
        })
    );
}

export interface GameOptions {
    // Bot in-game name
    displayName?: string;
    // Connection proxy
    proxy?: Agent;
    // Parse CompressedDataRpc contents
    schemas?: boolean;
    // Custom codec mapping
    rpcMapping?: DumpedData;
    // Communicate over UDP
    udp?: boolean;
    // Automatically acknowledge UDP Ticks
    autoAckTick?: boolean;
}

export class Game extends EventEmitter {
    private tcpSocket: WebSocket;
    private udpSocket?: Socket;
    private options: GameOptions;
    private server: ApiServer;
    public codec: Codec;

    override on<K extends keyof GameEvents>(event: K, listener: GameEvents[K]): this;

    override on(event: string, listener: (...args: any[]) => void): this;

    override on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    public constructor(server: ApiServer, options?: GameOptions) {
        super();

        this.options = {
            displayName: options?.displayName ?? "Player",
            proxy: options?.proxy,
            schemas: options?.schemas ?? true,
            rpcMapping: options?.rpcMapping ?? rpcMappingFromFile(join(__dirname, "../../../rpcs.json")),
            udp: options?.udp ?? false,
            autoAckTick: options?.autoAckTick ?? true,
        };

        this.server = server;
        this.codec = new Codec(this.options.rpcMapping!);

        const url = `wss://${server.hostnameV4}/${server.endpoint}`;

        if (this.options.udp) {
            this.udpSocket = createSocket("udp4");
        }

        this.tcpSocket = new WebSocket(url, { agent: this.options.proxy });
        this.tcpSocket.binaryType = "arraybuffer";

        this.tcpSocket.once("open", () => {
            const pow = this.codec.crypto.generateProofOfWork(
                server.endpoint,
                this.codec.rpcMapping.Platform,
                server.discreteFourierTransformBias
            );

            this.tcpSocket.send(
                this.codec.encodeEnterWorldRequest({
                    displayName: this.options.displayName!,
                    version: this.codec.rpcMapping.Codec,
                    proofOfWork: pow,
                })
            );

            this.codec.crypto.computeRpcKey(
                this.codec.rpcMapping.Codec,
                new TextEncoder().encode("/" + server.endpoint),
                pow
            );
        });

        this.tcpSocket.on("message", (data: ArrayBuffer) => this.handlePacket(data, false));
        this.udpSocket?.on("message", (data: Buffer) => this.handlePacket(data.buffer, true));

        this.tcpSocket.on("close", (code) => this.emit("close", code));
        this.udpSocket?.on("close", () => this.emit("close"));

        this.tcpSocket.on("error", (error) => this.emit("error", error));
        this.udpSocket?.on("error", (error) => this.emit("error", error));

        if (this.options.schemas) {
            this.on("CompressedDataRpc", (rpc: CompressedDataRpc) => {
                // TODO: Validate
                this.emit(`Schema${rpc.dataName}`, JSON.parse(rpc.json));
            });
        }
    }

    private handlePacket(data: ArrayBufferLike, udp: boolean) {
        const view = new DataView(data);
        const dataArray = new Uint8Array(data);
        const packetId = view.getUint8(0) as PacketId;

        this.emit("RawData", dataArray, udp ? "udp" : "tcp", packetId);

        switch (packetId) {
            case PacketId.EnterWorld: {
                const enterWorldResponse = this.codec.decodeEnterWorldResponse(new Uint8Array(data));
                if (enterWorldResponse !== undefined) {
                    this.codec.enterWorldResponse = enterWorldResponse;
                    if (this.options.udp) {
                        this.udpSocket!.connect(enterWorldResponse.udpPort!, this.server.ipv4!, () => {
                            this.send(
                                this.codec.encodeUdpConnectRequest({
                                    cookie: enterWorldResponse.udpCookie!,
                                }),
                                true
                            );
                        });
                    }
                    this.emit("EnterWorldResponse", enterWorldResponse, dataArray);
                }
                break;
            }
            case PacketId.Rpc: {
                const decrypedData = this.codec.crypto.cryptRpc(dataArray);
                const definition = this.codec.enterWorldResponse.rpcs!.find((rpc) => rpc.index === decrypedData[1]);
                if (definition !== undefined) {
                    const rpc = this.codec.decodeRpc(definition!, decrypedData, false);
                    if (rpc !== undefined) {
                        this.emit("Rpc", rpc.name, rpc.data, rpc.metadata);
                        this.emit(rpc.name, rpc.data, rpc.metadata);
                    }
                }
                break;
            }
            case PacketId.UdpRpc: {
                const definition = this.codec.enterWorldResponse.rpcs!.find((rpc) => rpc.index === dataArray[1]);
                const rpc = this.codec.decodeRpc(definition!, dataArray, true);
                if (rpc !== undefined) {
                    this.emit("Rpc", rpc.name, rpc.data, rpc.metadata);
                    this.emit(rpc.name, rpc.data, rpc.metadata);
                }
                break;
            }
            case PacketId.EntityUpdate: {
                const entityUpdate = this.codec.decodeEntityUpdate(dataArray);
                if (entityUpdate !== undefined) {
                    this.emit("EntityUpdate", entityUpdate, packetId);
                }
                break;
            }
            case PacketId.UdpTick:
            case PacketId.UdpTickWithCompressedUids: {
                const udpTick = this.codec.decodeUdpTick(dataArray, packetId === PacketId.UdpTickWithCompressedUids);
                if (udpTick !== undefined) {
                    this.emit("EntityUpdate", udpTick, packetId);
                    if (this.options.autoAckTick) {
                        this.send(
                            this.codec.encodeUdpAckTickRequest({
                                cookie: udpTick.cookie,
                                tick: udpTick.tick,
                            }),
                            true
                        );
                    }
                }
                break;
            }
            case PacketId.UdpConnect:
            case PacketId.UdpConnect1300:
            case PacketId.UdpConnect500: {
                const udpConnectResponse = this.codec.decodeUdpConnectResponse(dataArray);
                if (udpConnectResponse !== undefined) {
                    this.emit("UdpConnectResponse", udpConnectResponse);
                }
                break;
            }
            case PacketId.UdpFragment: {
                const fragment = this.codec.decodeUdpFragment(dataArray);
                if (fragment?.buffer !== undefined) {
                    this.handlePacket(fragment.buffer.buffer, true);
                }
                break;
            }
        }
    }

    public send(data?: Uint8Array, udp: boolean = false) {
        if (data) {
            if (udp && this.udpSocket) {
                this.udpSocket.send(data);
            } else if (!udp) {
                this.tcpSocket.send(data);
            }
        }
    }

    public shutdown() {
        this.tcpSocket.close();
        if (this.udpSocket) {
            this.udpSocket.close();
        }
    }

    // --- Utility ---

    public getEnterWorldResponse() {
        return this.codec.enterWorldResponse;
    }

    public getEntityList() {
        return this.codec.entityList;
    }

    public getEntitiesByType(type: EntityType) {
        return new Map(Array.from(this.codec.entityList).filter(([k, v]) => v.type === type));
    }

    public getMyUid() {
        return this.codec.enterWorldResponse.uid!;
    }

    public getEntityByUid(uid: number) {
        return this.getEntityList().get(uid);
    }

    public getPlayerByName(name: string) {
        for (const [uid, entity] of this.getEntityList()) {
            if (entity.tick?.Name === name) {
                return entity;
            }
        }
        return undefined;
    }

    public toServerPos(worldPos: Vector2) {
        return { x: worldPos.x * 100, y: -worldPos.y * 100 } as Vector2;
    }

    public toWorldPos(serverPos: Vector2) {
        return { x: serverPos.x / 100, y: -serverPos.y / 100 } as Vector2;
    }

    // --- Rpcs ---

    public acToServerRpc(data: number[]) {
        this.send(this.codec.encodeRpc("ACToServerRpc", { data: data }));
    }

    public startUdpStreamRpc() {
        this.send(this.codec.encodeRpc("StartUdpStreamRpc", {}));
    }

    public setPlatformRpc(platform: "android" | "web" | "windows" | "ios") {
        this.send(this.codec.encodeRpc("SetPlatformRpc", { platform: platform }));
    }

    public interactDoorRpc(buildingUid: number, doorIndex: number, close: number) {
        this.send(
            this.codec.encodeRpc("InteractDoorRpc", {
                buildingUid: buildingUid,
                doorIndex: doorIndex,
                close: close,
            })
        );
    }

    public enterVehicleRpc(uid: number) {
        this.send(this.codec.encodeRpc("EnterVehicleRpc", { uid: uid }));
    }

    public autoFillRpc() {
        this.send(this.codec.encodeRpc("AutoFillRpc", {}));
    }

    public startCircleRpc() {
        this.send(this.codec.encodeRpc("StartCircleRpc", {}));
    }

    public sendChatMessageRpc(channel: "Local" | "Party", message: string) {
        this.send(
            this.codec.encodeRpc("SendChatMessageRpc", {
                channel: channel,
                message: message,
            })
        );
    }

    public joinTeamRpc(key: string, players: number) {
        this.send(this.codec.encodeRpc("JoinTeamRpc", { key: key, players: players }));
    }

    public placeBuildingRpc(dataIndex: number, x: number, y: number) {
        this.send(
            this.codec.encodeRpc("PlaceBuildingRpc", {
                dataIndex: dataIndex,
                x: x,
                y: y,
            })
        );
    }

    public swapItemRpc(inventorySlot1: number, inventorySlot2: number) {
        this.send(
            this.codec.encodeRpc("SwapItemRpc", {
                inventorySlot1: inventorySlot1,
                inventorySlot2: inventorySlot2,
            })
        );
    }

    public setBuildingModeRpc(isBuilding: number) {
        this.send(
            this.codec.encodeRpc("SetBuildingModeRpc", {
                isBuilding: isBuilding,
            })
        );
    }

    public startReviveRpc(uid: number) {
        this.send(this.codec.encodeRpc("StartReviveRpc", { uid: uid }));
    }

    public loginRpc(token: string) {
        this.send(this.codec.encodeRpc("LoginRpc", { token: token }));
    }

    public respawnRpc(respawnWithHalf: number) {
        this.send(
            this.codec.encodeRpc("RespawnRpc", {
                respawnWithHalf: respawnWithHalf,
            })
        );
    }

    public consumeRpc() {
        this.send(this.codec.encodeRpc("ConsumeRpc", {}));
    }

    public dropAmmoRpc(ammoIndex: number) {
        this.send(this.codec.encodeRpc("DropAmmoRpc", { ammoIndex: ammoIndex }));
    }

    public setEmoteRpc(emote2: number) {
        this.send(this.codec.encodeRpc("SetEmoteRpc", { emote2: emote2 }));
    }

    public startLobbyRpc() {
        this.send(this.codec.encodeRpc("StartLobbyRpc", {}));
    }

    public setMarkerRpc(x: number, y: number, valid: number) {
        this.send(this.codec.encodeRpc("SetMarkerRpc", { x: x, y: y, valid: valid }));
    }

    public pickupItemRpc(itemUid: number, inventorySlot: number) {
        this.send(
            this.codec.encodeRpc("PickupItemRpc", {
                itemUid: itemUid,
                inventorySlot: inventorySlot,
            })
        );
    }

    public setSkinRpc(rpcs: SetSkinRpc[]) {
        this.send(this.codec.encodeRpc("SetSkinRpc", rpcs));
    }

    public equipItemRpc(inventorySlot: number) {
        this.send(
            this.codec.encodeRpc("EquipItemRpc", {
                inventorySlot: inventorySlot,
            })
        );
    }

    public setPartyColorRpc(party: number) {
        this.send(this.codec.encodeRpc("SetPartyColorRpc", { party: party }));
    }

    public sprayRpc(sprayIndex2: number, x: number, y: number) {
        this.send(
            this.codec.encodeRpc("SprayRpc", {
                sprayIndex2: sprayIndex2,
                x: x,
                y: y,
            })
        );
    }

    public setLoadoutRpc(index: number) {
        this.send(this.codec.encodeRpc("SetLoadoutRpc", { index: index }));
    }

    public dropItemRpc(inventorySlot: number, x: number, y: number) {
        this.send(
            this.codec.encodeRpc("DropItemRpc", {
                inventorySlot: inventorySlot,
                x: x,
                y: y,
            })
        );
    }

    public respawnPendingRpc() {
        this.send(this.codec.encodeRpc("RespawnPendingRpc", {}));
    }

    public reloadServerRpc() {
        this.send(this.codec.encodeRpc("ReloadServerRpc", {}));
    }

    public exitVehicleRpc() {
        this.send(this.codec.encodeRpc("ExitVehicleRpc", {}));
    }

    public inputRpc(rpc: InputRpc) {
        this.send(this.codec.encodeRpc("InputRpc", rpc));
    }

    public reloadRpc() {
        this.send(this.codec.encodeRpc("ReloadRpc", {}));
    }

    public spectateRpc(uid: number) {
        this.send(this.codec.encodeRpc("SpectateRpc", { uid: uid }));
    }

    public startTcpStreamRpc(attemptedUdp: number, received500: number) {
        this.send(
            this.codec.encodeRpc("StartTcpStreamRpc", {
                attemptedUdp: attemptedUdp,
                received500: received500,
            })
        );
    }

    public cancelActionRpc() {
        this.send(this.codec.encodeRpc("CancelActionRpc", {}));
    }

    public lootChestRpc(chestUid: number) {
        this.send(this.codec.encodeRpc("LootChestRpc", { chestUid: chestUid }));
    }

    public metricsRpc(rpc: MetricsRpc) {
        this.send(this.codec.encodeRpc("MetricsRpc", rpc));
    }

    public parachuteRpc() {
        this.send(this.codec.encodeRpc("ParachuteRpc", {}));
    }
}
