"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
exports.rpcMappingFromFile = rpcMappingFromFile;
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const ws_1 = require("ws");
const Codec_1 = require("../codec/Codec");
const Packets_1 = require("../../types/Packets");
const node_dgram_1 = require("node:dgram");
const TypedEmitter_1 = require("../../utility/TypedEmitter");
function rpcMappingFromFile(path) {
    return JSON.parse((0, node_fs_1.readFileSync)(path, {
        encoding: "utf-8",
    }));
}
class Game extends TypedEmitter_1.TypedEmitter {
    constructor(server, options) {
        super();
        this.options = {
            displayName: options?.displayName ?? "Player",
            proxy: options?.proxy,
            schemas: options?.schemas ?? true,
            rpcMapping: options?.rpcMapping ?? rpcMappingFromFile((0, node_path_1.join)(__dirname, "../../../rpcs.json")),
            udp: options?.udp ?? false,
            autoAckTick: options?.autoAckTick ?? true,
            ssl: options?.ssl ?? true,
        };
        this.server = server;
        this.codec = new Codec_1.Codec(this.options.rpcMapping);
        const url = `${this.options.ssl ? "wss" : "ws"}://${server.hostnameV4}/${server.endpoint}`;
        if (this.options.udp) {
            this.udpSocket = (0, node_dgram_1.createSocket)("udp4");
        }
        this.tcpSocket = new ws_1.WebSocket(url, { agent: this.options.proxy });
        this.tcpSocket.binaryType = "arraybuffer";
        this.tcpSocket.once("open", () => {
            const pow = this.codec.crypto.generateProofOfWork(server.endpoint, this.codec.rpcMapping.Platform, server.discreteFourierTransformBias);
            this.tcpSocket.send(this.codec.encodeEnterWorldRequest({
                displayName: this.options.displayName,
                version: this.codec.rpcMapping.Codec,
                proofOfWork: pow,
            }));
            this.codec.crypto.computeRpcKey(this.codec.rpcMapping.Codec, new TextEncoder().encode("/" + server.endpoint), pow);
        });
        this.tcpSocket.on("message", (data) => this.handlePacket(data, false));
        this.udpSocket?.on("message", (data) => this.handlePacket(data.buffer, true));
        this.tcpSocket.on("close", (code) => this.emit("close", code));
        this.udpSocket?.on("close", () => this.emit("close"));
        this.tcpSocket.on("error", (error) => this.emit("error", error));
        this.udpSocket?.on("error", (error) => this.emit("error", error));
        if (this.options.schemas) {
            this.on("CompressedDataRpc", (rpc) => {
                // TODO: Validate
                this.emit(`Schema${rpc.dataName}`, JSON.parse(rpc.json));
            });
        }
    }
    handlePacket(data, udp) {
        const view = new DataView(data);
        const dataArray = new Uint8Array(data);
        const packetId = view.getUint8(0);
        this.emit("RawData", dataArray, udp ? "udp" : "tcp", packetId);
        switch (packetId) {
            case Packets_1.PacketId.EnterWorld: {
                const enterWorldResponse = this.codec.decodeEnterWorldResponse(new Uint8Array(data));
                if (enterWorldResponse !== undefined) {
                    this.codec.enterWorldResponse = enterWorldResponse;
                    if (this.options.udp) {
                        this.udpSocket.connect(enterWorldResponse.udpPort, this.server.ipv4, () => {
                            this.send(this.codec.encodeUdpConnectRequest({
                                cookie: enterWorldResponse.udpCookie,
                            }), true);
                        });
                    }
                    this.emit("EnterWorldResponse", enterWorldResponse, dataArray);
                }
                break;
            }
            case Packets_1.PacketId.Rpc: {
                const rpc = this.codec.decodeRpc(this.codec.crypto.cryptRpc(dataArray));
                if (rpc !== undefined) {
                    this.emit("Rpc", rpc.name, rpc.data, rpc.extra);
                    this.emit(rpc.name, rpc.data, rpc.extra);
                }
                break;
            }
            case Packets_1.PacketId.EntityUpdate: {
                const entityUpdate = this.codec.decodeEntityUpdate(dataArray);
                if (entityUpdate !== undefined) {
                    this.emit("EntityUpdate", entityUpdate, packetId);
                }
                break;
            }
            case Packets_1.PacketId.UdpTick:
            case Packets_1.PacketId.UdpTickWithCompressedUids: {
                const udpTick = this.codec.decodeUdpTick(dataArray, packetId === Packets_1.PacketId.UdpTickWithCompressedUids);
                if (udpTick !== undefined) {
                    this.emit("EntityUpdate", udpTick, packetId);
                    if (this.options.autoAckTick) {
                        this.send(this.codec.encodeUdpAckTick({
                            cookie: udpTick.cookie,
                            tick: udpTick.tick,
                        }), true);
                    }
                }
                break;
            }
            case Packets_1.PacketId.UdpConnect:
            case Packets_1.PacketId.UdpConnect1300:
            case Packets_1.PacketId.UdpConnect500: {
                const udpConnectResponse = this.codec.decodeUdpConnectResponse(dataArray);
                if (udpConnectResponse !== undefined) {
                    this.emit("UdpConnectResponse", udpConnectResponse);
                }
                break;
            }
            case Packets_1.PacketId.UdpFragment: {
                const fragment = this.codec.decodeUdpFragment(dataArray);
                if (fragment?.buffer !== undefined) {
                    this.handlePacket(fragment.buffer.buffer, true);
                }
                break;
            }
        }
    }
    send(data, udp = false) {
        if (data) {
            if (udp) {
                this.udpSocket?.send(data);
            }
            else {
                this.tcpSocket.send(data);
            }
        }
    }
    shutdown() {
        this.tcpSocket.close();
        if (this.udpSocket) {
            this.udpSocket.close();
        }
    }
    // --- Utility ---
    getEnterWorldResponse() {
        return this.codec.enterWorldResponse;
    }
    getEntityList() {
        return this.codec.entityList;
    }
    getEntitiesByType(type) {
        return new Map(Array.from(this.codec.entityList).filter(([k, v]) => v.type === type));
    }
    getSelfUid() {
        return this.codec.enterWorldResponse.uid;
    }
    getSelf() {
        return this.getEntityByUid(this.codec.enterWorldResponse.uid);
    }
    getEntityByUid(uid) {
        return this.getEntityList().get(uid);
    }
    getPlayerByName(name) {
        for (const [uid, entity] of this.getEntityList()) {
            if (entity.tick?.Name === name) {
                return entity;
            }
        }
        return undefined;
    }
    toServerPos(worldPos) {
        return { x: worldPos.x * 100, y: -worldPos.y * 100 };
    }
    toWorldPos(serverPos) {
        return { x: serverPos.x / 100, y: -serverPos.y / 100 };
    }
    // --- Rpcs ---
    acToServerRpc(data, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("ACToServerRpc", { data: data }, tick)));
    }
    startUdpStreamRpc(tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("StartUdpStreamRpc", {}, tick)));
    }
    setPlatformRpc(platform, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SetPlatformRpc", { platform: platform }, tick)));
    }
    interactDoorRpc(buildingUid, doorIndex, close, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("InteractDoorRpc", {
            buildingUid: buildingUid,
            doorIndex: doorIndex,
            close: close,
        }, tick)));
    }
    enterVehicleRpc(uid, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("EnterVehicleRpc", { uid: uid }, tick)));
    }
    autoFillRpc(tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("AutoFillRpc", {}, tick)));
    }
    startCircleRpc(tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("StartCircleRpc", {}, tick)));
    }
    sendChatMessageRpc(channel, message, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SendChatMessageRpc", {
            channel: channel,
            message: message,
        }, tick)));
    }
    joinTeamRpc(key, players, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("JoinTeamRpc", { key: key, players: players }, tick)));
    }
    placeBuildingRpc(dataIndex, x, y, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("PlaceBuildingRpc", {
            dataIndex: dataIndex,
            x: x,
            y: y,
        }, tick)));
    }
    swapItemRpc(inventorySlot1, inventorySlot2, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SwapItemRpc", {
            inventorySlot1: inventorySlot1,
            inventorySlot2: inventorySlot2,
        }, tick)));
    }
    setBuildingModeRpc(isBuilding, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SetBuildingModeRpc", {
            isBuilding: isBuilding,
        }, tick)));
    }
    startReviveRpc(uid, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("StartReviveRpc", { uid: uid }, tick)));
    }
    loginRpc(token, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("LoginRpc", { token: token }, tick)));
    }
    respawnRpc(respawnWithHalf, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("RespawnRpc", {
            respawnWithHalf: respawnWithHalf,
        }, tick)));
    }
    consumeRpc(tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("ConsumeRpc", {}, tick)));
    }
    dropAmmoRpc(ammoIndex, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("DropAmmoRpc", { ammoIndex: ammoIndex }, tick)));
    }
    setEmoteRpc(emote, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SetEmoteRpc", { emote2: emote }, tick)));
    }
    startLobbyRpc(tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("StartLobbyRpc", {}, tick)));
    }
    setMarkerRpc(x, y, valid, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SetMarkerRpc", { x: x, y: y, valid: valid }, tick)));
    }
    pickupItemRpc(itemUid, inventorySlot, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("PickupItemRpc", {
            itemUid: itemUid,
            inventorySlot: inventorySlot,
        }, tick)));
    }
    setSkinRpc(rpcs, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SetSkinRpc", rpcs, tick)));
    }
    equipItemRpc(inventorySlot, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("EquipItemRpc", {
            inventorySlot: inventorySlot,
        }, tick)));
    }
    setPartyColorRpc(party, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SetPartyColorRpc", { party: party }, tick)));
    }
    sprayRpc(sprayIndex, x, y, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SprayRpc", {
            sprayIndex2: sprayIndex,
            x: x,
            y: y,
        }, tick)));
    }
    setLoadoutRpc(index, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SetLoadoutRpc", { index: index }, tick)));
    }
    dropItemRpc(inventorySlot, x, y, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("DropItemRpc", {
            inventorySlot: inventorySlot,
            x: x,
            y: y,
        }, tick)));
    }
    respawnPendingRpc(tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("RespawnPendingRpc", {}, tick)));
    }
    reloadServerRpc(tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("ReloadServerRpc", {}, tick)));
    }
    exitVehicleRpc(tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("ExitVehicleRpc", {}, tick)));
    }
    inputRpc(rpc, tick) {
        const defaultRpc = {
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
            console.log(this.codec.decodeUdpRpc(e));
            this.send(e, true);
        }
        else {
            this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("InputRpc", { ...defaultRpc, ...rpc }, tick)));
        }
    }
    reloadRpc(tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("ReloadRpc", {}, tick)));
    }
    spectateRpc(uid, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("SpectateRpc", { uid: uid }, tick)));
    }
    startTcpStreamRpc(attemptedUdp, received500, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("StartTcpStreamRpc", {
            attemptedUdp: attemptedUdp,
            received500: received500,
        }, tick)));
    }
    cancelActionRpc(tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("CancelActionRpc", {}, tick)));
    }
    lootChestRpc(chestUid, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("LootChestRpc", { chestUid: chestUid }, tick)));
    }
    metricsRpc(rpc, tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("MetricsRpc", rpc, tick)));
    }
    parachuteRpc(tick) {
        this.send(this.codec.crypto.cryptRpc(this.codec.encodeRpc("ParachuteRpc", {}, tick)));
    }
}
exports.Game = Game;
