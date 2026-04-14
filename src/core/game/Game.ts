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
import { TypedEmitter } from "../../utility/TypedEmitter";

export function rpcMappingFromFile(path: string): DumpedData {
    return JSON.parse(
        readFileSync(path, {
            encoding: "utf-8",
        }),
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
    // Communicate over UDP where possible
    udp?: boolean;
    // Automatically acknowledge UDP ticks
    autoAckTick?: boolean;
    // Connect to via wss
    ssl?: boolean;
}

export class Game extends TypedEmitter<GameEvents> {
    private tcpSocket: WebSocket;
    private udpSocket?: Socket;
    private options: GameOptions;
    private server: ApiServer;
    public codec: Codec;

    public constructor(server: ApiServer, options?: GameOptions) {
        super();

        this.options = {
            displayName: options?.displayName ?? "Player",
            proxy: options?.proxy,
            schemas: options?.schemas ?? true,
            rpcMapping: options?.rpcMapping ?? rpcMappingFromFile(join(__dirname, "../../../rpcs.json")),
            udp: options?.udp ?? false,
            autoAckTick: options?.autoAckTick ?? true,
            ssl: options?.ssl ?? true,
        };

        this.server = server;
        this.codec = new Codec(this.options.rpcMapping!);

        const url = `${this.options.ssl ? "wss" : "ws"}://${server.hostnameV4}/${server.endpoint}`;

        if (this.options.udp) {
            this.udpSocket = createSocket("udp4");
        }

        this.tcpSocket = new WebSocket(url, { agent: this.options.proxy });
        this.tcpSocket.binaryType = "arraybuffer";

        this.tcpSocket.once("open", () => {
            const pow = this.codec.crypto.generateProofOfWork(
                server.endpoint,
                this.codec.rpcMapping.Platform as any,
                server.discreteFourierTransformBias,
            );

            this.tcpSocket.send(
                this.codec.encodeEnterWorldRequest({
                    displayName: this.options.displayName!,
                    version: this.codec.rpcMapping.Codec,
                    proofOfWork: pow,
                }),
            );

            this.codec.crypto.computeRpcKey(
                this.codec.rpcMapping.Codec,
                new TextEncoder().encode("/" + server.endpoint),
                pow,
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
                                true,
                            );
                        });
                    }
                    this.emit("EnterWorldResponse", enterWorldResponse, dataArray);
                }
                break;
            }
            case PacketId.Rpc: {
                const rpc = this.codec.decodeRpc(this.codec.crypto.cryptRpc(dataArray)!);
                if (rpc !== undefined) {
                    this.emit("Rpc", rpc.name, rpc.data, rpc.extra);
                    this.emit(rpc.name, rpc.data, rpc.extra);
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
                            this.codec.encodeUdpAckTick({
                                cookie: udpTick.cookie,
                                tick: udpTick.tick,
                            }),
                            true,
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
            if (udp) {
                this.udpSocket?.send(data);
            } else {
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

    public getSelfUid() {
        return this.codec.enterWorldResponse.uid!;
    }

    public getSelf() {
        return this.getEntityByUid(this.codec.enterWorldResponse.uid!);
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

    public acToServerRpc(data: number[], tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("ACToServerRpc", { data: data }, tick)));
    }

    public startUdpStreamRpc(tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("StartUdpStreamRpc", {}, tick)));
    }

    public setPlatformRpc(platform: "android" | "web" | "windows" | "ios", tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SetPlatformRpc", { platform: platform }, tick)));
    }

    public interactDoorRpc(buildingUid: number, doorIndex: number, close: number, tick?: number) {
        this.send(
            this.codec.crypto.cryptRpc(
                this.codec.encodeRpc(
                    "InteractDoorRpc",
                    {
                        buildingUid: buildingUid,
                        doorIndex: doorIndex,
                        close: close,
                    },
                    tick,
                ),
            ),
        );
    }

    public enterVehicleRpc(uid: number, tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("EnterVehicleRpc", { uid: uid }, tick)));
    }

    public autoFillRpc(tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("AutoFillRpc", {}, tick)));
    }

    public startCircleRpc(tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("StartCircleRpc", {}, tick)));
    }

    public sendChatMessageRpc(channel: "Local" | "Party", message: string, tick?: number) {
        this.send(
            this.codec.crypto.cryptRpc(
                this.codec.encodeRpc(
                    "SendChatMessageRpc",
                    {
                        channel: channel,
                        message: message,
                    },
                    tick,
                ),
            ),
        );
    }

    public joinTeamRpc(key: string, players: number, tick?: number) {
        this.send(
            this.codec.crypto.cryptRpc(this.codec.encodeRpc("JoinTeamRpc", { key: key, players: players }, tick)),
        );
    }

    public placeBuildingRpc(dataIndex: number, x: number, y: number, tick?: number) {
        this.send(
            this.codec.crypto.cryptRpc(
                this.codec.encodeRpc(
                    "PlaceBuildingRpc",
                    {
                        dataIndex: dataIndex,
                        x: x,
                        y: y,
                    },
                    tick,
                ),
            ),
        );
    }

    public swapItemRpc(inventorySlot1: number, inventorySlot2: number, tick?: number) {
        this.send(
            this.codec.crypto.cryptRpc(
                this.codec.encodeRpc(
                    "SwapItemRpc",
                    {
                        inventorySlot1: inventorySlot1,
                        inventorySlot2: inventorySlot2,
                    },
                    tick,
                ),
            ),
        );
    }

    public setBuildingModeRpc(isBuilding: number, tick?: number) {
        this.send(
            this.codec.crypto.cryptRpc(
                this.codec.encodeRpc(
                    "SetBuildingModeRpc",
                    {
                        isBuilding: isBuilding,
                    },
                    tick,
                ),
            ),
        );
    }

    public startReviveRpc(uid: number, tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("StartReviveRpc", { uid: uid }, tick)));
    }

    public loginRpc(token: string, tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("LoginRpc", { token: token }, tick)));
    }

    public respawnRpc(respawnWithHalf: number, tick?: number) {
        this.send(
            this.codec.crypto.cryptRpc(
                this.codec.encodeRpc(
                    "RespawnRpc",
                    {
                        respawnWithHalf: respawnWithHalf,
                    },
                    tick,
                ),
            ),
        );
    }

    public consumeRpc(tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("ConsumeRpc", {}, tick)));
    }

    public dropAmmoRpc(ammoIndex: number, tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("DropAmmoRpc", { ammoIndex: ammoIndex }, tick)));
    }

    public setEmoteRpc(emote: number, tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SetEmoteRpc", { emote2: emote }, tick)));
    }

    public startLobbyRpc(tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("StartLobbyRpc", {}, tick)));
    }

    public setMarkerRpc(x: number, y: number, valid: number, tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SetMarkerRpc", { x: x, y: y, valid: valid }, tick)));
    }

    public pickupItemRpc(itemUid: number, inventorySlot: number, tick?: number) {
        this.send(
            this.codec.crypto.cryptRpc(
                this.codec.encodeRpc(
                    "PickupItemRpc",
                    {
                        itemUid: itemUid,
                        inventorySlot: inventorySlot,
                    },
                    tick,
                ),
            ),
        );
    }

    public setSkinRpc(rpcs: SetSkinRpc[], tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SetSkinRpc", rpcs, tick)));
    }

    public equipItemRpc(inventorySlot: number, tick?: number) {
        this.send(
            this.codec.crypto.cryptRpc(
                this.codec.encodeRpc(
                    "EquipItemRpc",
                    {
                        inventorySlot: inventorySlot,
                    },
                    tick,
                ),
            ),
        );
    }

    public setPartyColorRpc(party: number, tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SetPartyColorRpc", { party: party }, tick)));
    }

    public sprayRpc(sprayIndex: number, x: number, y: number, tick?: number) {
        this.send(
            this.codec.crypto.cryptRpc(
                this.codec.encodeRpc(
                    "SprayRpc",
                    {
                        sprayIndex2: sprayIndex,
                        x: x,
                        y: y,
                    },
                    tick,
                ),
            ),
        );
    }

    public setLoadoutRpc(index: number, tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SetLoadoutRpc", { index: index }, tick)));
    }

    public dropItemRpc(inventorySlot: number, x: number, y: number, tick?: number) {
        this.send(
            this.codec.crypto.cryptRpc(
                this.codec.encodeRpc(
                    "DropItemRpc",
                    {
                        inventorySlot: inventorySlot,
                        x: x,
                        y: y,
                    },
                    tick,
                ),
            ),
        );
    }

    public respawnPendingRpc(tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("RespawnPendingRpc", {}, tick)));
    }

    public reloadServerRpc(tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("ReloadServerRpc", {}, tick)));
    }

    public exitVehicleRpc(tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("ExitVehicleRpc", {}, tick)));
    }

    public inputRpc(rpc: Partial<InputRpc>, tick?: number) {
        const defaultRpc: InputRpc = {
            inputUid: 0,
            acknowledgedTickNumber: 0,
            isPing: 0,
            left: 0,
            right: 0,
            down: 0,
            up: 0,
            space: 0,
            moveDirection: -1,
            use: 0,
            worldX: 0,
            worldY: 0,
            distance: 0,
            yaw: 0,
            mouseDown: -1,
            mouseMovedWhileDown: -1,
            mouseMoved: -1,
            mouseUp: 1,
            moveSpeed: 1,
            rightMouseDown: 0,
            zoomFactor: 1,
            unknown: 5,
        };
        // InputRpc is the only one sent over UDP (if UDP is enabled ofc)
        if (this.options.udp) {
            const e = this.codec.encodeUdpRpc("InputRpc", { ...defaultRpc, ...rpc }, tick);
            console.log(this.codec.decodeUdpRpc(e!));
            this.send(e, true);
        } else {
            this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("InputRpc", { ...defaultRpc, ...rpc }, tick)));
        }
    }

    public reloadRpc(tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("ReloadRpc", {}, tick)));
    }

    public spectateRpc(uid: number, tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SpectateRpc", { uid: uid }, tick)));
    }

    public startTcpStreamRpc(attemptedUdp: number, received500: number, tick?: number) {
        this.send(
            this.codec.crypto.cryptRpc(
                this.codec.encodeRpc(
                    "StartTcpStreamRpc",
                    {
                        attemptedUdp: attemptedUdp,
                        received500: received500,
                    },
                    tick,
                ),
            ),
        );
    }

    public cancelActionRpc(tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("CancelActionRpc", {}, tick)));
    }

    public lootChestRpc(chestUid: number, tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("LootChestRpc", { chestUid: chestUid }, tick)));
    }

    public metricsRpc(rpc: MetricsRpc, tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("MetricsRpc", rpc, tick)));
    }

    public parachuteRpc(tick?: number) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("ParachuteRpc", {}, tick)));
    }
}
