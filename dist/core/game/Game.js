"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
exports.rpcMappingFromFile = rpcMappingFromFile;
const node_events_1 = require("node:events");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const ws_1 = require("ws");
const Codec_1 = require("../codec/Codec");
const Packets_1 = require("../../types/Packets");
const node_dgram_1 = require("node:dgram");
function rpcMappingFromFile(path) {
    return JSON.parse((0, node_fs_1.readFileSync)(path, {
        encoding: "utf-8",
    }));
}
class Game extends node_events_1.EventEmitter {
    on(event, listener) {
        return super.on(event, listener);
    }
    constructor(server, options) {
        super();
        this.options = {
            displayName: options?.displayName ?? "Player",
            proxy: options?.proxy,
            schemas: options?.schemas ?? true,
            rpcMapping: options?.rpcMapping ?? rpcMappingFromFile((0, node_path_1.join)(__dirname, "../../../rpcs.json")),
            udp: options?.udp ?? false,
            autoAckTick: options?.autoAckTick ?? true,
        };
        this.server = server;
        this.codec = new Codec_1.Codec(this.options.rpcMapping);
        const url = `wss://${server.hostnameV4}/${server.endpoint}`;
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
                const decrypedData = this.codec.crypto.cryptRpc(dataArray);
                const definition = this.codec.enterWorldResponse.rpcs.find((rpc) => rpc.index === decrypedData[1]);
                if (definition !== undefined) {
                    const rpc = this.codec.decodeRpc(definition, decrypedData, false);
                    if (rpc !== undefined) {
                        this.emit("Rpc", rpc.name, rpc.data, rpc.metadata);
                        this.emit(rpc.name, rpc.data, rpc.metadata);
                    }
                }
                break;
            }
            case Packets_1.PacketId.UdpRpc: {
                const definition = this.codec.enterWorldResponse.rpcs.find((rpc) => rpc.index === dataArray[1]);
                const rpc = this.codec.decodeRpc(definition, dataArray, true);
                if (rpc !== undefined) {
                    this.emit("Rpc", rpc.name, rpc.data, rpc.metadata);
                    this.emit(rpc.name, rpc.data, rpc.metadata);
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
                        this.send(this.codec.encodeUdpAckTickRequest({
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
            if (udp && this.udpSocket) {
                this.udpSocket.send(data);
            }
            else if (!udp) {
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
    getMyUid() {
        return this.codec.enterWorldResponse.uid;
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
    acToServerRpc(data) {
        this.send(this.codec.encodeRpc("ACToServerRpc", { data: data }));
    }
    startUdpStreamRpc() {
        this.send(this.codec.encodeRpc("StartUdpStreamRpc", {}));
    }
    setPlatformRpc(platform) {
        this.send(this.codec.encodeRpc("SetPlatformRpc", { platform: platform }));
    }
    interactDoorRpc(buildingUid, doorIndex, close) {
        this.send(this.codec.encodeRpc("InteractDoorRpc", {
            buildingUid: buildingUid,
            doorIndex: doorIndex,
            close: close,
        }));
    }
    enterVehicleRpc(uid) {
        this.send(this.codec.encodeRpc("EnterVehicleRpc", { uid: uid }));
    }
    autoFillRpc() {
        this.send(this.codec.encodeRpc("AutoFillRpc", {}));
    }
    startCircleRpc() {
        this.send(this.codec.encodeRpc("StartCircleRpc", {}));
    }
    sendChatMessageRpc(channel, message) {
        this.send(this.codec.encodeRpc("SendChatMessageRpc", {
            channel: channel,
            message: message,
        }));
    }
    joinTeamRpc(key, players) {
        this.send(this.codec.encodeRpc("JoinTeamRpc", { key: key, players: players }));
    }
    placeBuildingRpc(dataIndex, x, y) {
        this.send(this.codec.encodeRpc("PlaceBuildingRpc", {
            dataIndex: dataIndex,
            x: x,
            y: y,
        }));
    }
    swapItemRpc(inventorySlot1, inventorySlot2) {
        this.send(this.codec.encodeRpc("SwapItemRpc", {
            inventorySlot1: inventorySlot1,
            inventorySlot2: inventorySlot2,
        }));
    }
    setBuildingModeRpc(isBuilding) {
        this.send(this.codec.encodeRpc("SetBuildingModeRpc", {
            isBuilding: isBuilding,
        }));
    }
    startReviveRpc(uid) {
        this.send(this.codec.encodeRpc("StartReviveRpc", { uid: uid }));
    }
    loginRpc(token) {
        this.send(this.codec.encodeRpc("LoginRpc", { token: token }));
    }
    respawnRpc(respawnWithHalf) {
        this.send(this.codec.encodeRpc("RespawnRpc", {
            respawnWithHalf: respawnWithHalf,
        }));
    }
    consumeRpc() {
        this.send(this.codec.encodeRpc("ConsumeRpc", {}));
    }
    dropAmmoRpc(ammoIndex) {
        this.send(this.codec.encodeRpc("DropAmmoRpc", { ammoIndex: ammoIndex }));
    }
    setEmoteRpc(emote2) {
        this.send(this.codec.encodeRpc("SetEmoteRpc", { emote2: emote2 }));
    }
    startLobbyRpc() {
        this.send(this.codec.encodeRpc("StartLobbyRpc", {}));
    }
    setMarkerRpc(x, y, valid) {
        this.send(this.codec.encodeRpc("SetMarkerRpc", { x: x, y: y, valid: valid }));
    }
    pickupItemRpc(itemUid, inventorySlot) {
        this.send(this.codec.encodeRpc("PickupItemRpc", {
            itemUid: itemUid,
            inventorySlot: inventorySlot,
        }));
    }
    setSkinRpc(rpcs) {
        this.send(this.codec.encodeRpc("SetSkinRpc", rpcs));
    }
    equipItemRpc(inventorySlot) {
        this.send(this.codec.encodeRpc("EquipItemRpc", {
            inventorySlot: inventorySlot,
        }));
    }
    setPartyColorRpc(party) {
        this.send(this.codec.encodeRpc("SetPartyColorRpc", { party: party }));
    }
    sprayRpc(sprayIndex2, x, y) {
        this.send(this.codec.encodeRpc("SprayRpc", {
            sprayIndex2: sprayIndex2,
            x: x,
            y: y,
        }));
    }
    setLoadoutRpc(index) {
        this.send(this.codec.encodeRpc("SetLoadoutRpc", { index: index }));
    }
    dropItemRpc(inventorySlot, x, y) {
        this.send(this.codec.encodeRpc("DropItemRpc", {
            inventorySlot: inventorySlot,
            x: x,
            y: y,
        }));
    }
    respawnPendingRpc() {
        this.send(this.codec.encodeRpc("RespawnPendingRpc", {}));
    }
    reloadServerRpc() {
        this.send(this.codec.encodeRpc("ReloadServerRpc", {}));
    }
    exitVehicleRpc() {
        this.send(this.codec.encodeRpc("ExitVehicleRpc", {}));
    }
    inputRpc(rpc) {
        this.send(this.codec.encodeRpc("InputRpc", rpc));
    }
    reloadRpc() {
        this.send(this.codec.encodeRpc("ReloadRpc", {}));
    }
    spectateRpc(uid) {
        this.send(this.codec.encodeRpc("SpectateRpc", { uid: uid }));
    }
    startTcpStreamRpc(attemptedUdp, received500) {
        this.send(this.codec.encodeRpc("StartTcpStreamRpc", {
            attemptedUdp: attemptedUdp,
            received500: received500,
        }));
    }
    cancelActionRpc() {
        this.send(this.codec.encodeRpc("CancelActionRpc", {}));
    }
    lootChestRpc(chestUid) {
        this.send(this.codec.encodeRpc("LootChestRpc", { chestUid: chestUid }));
    }
    metricsRpc(rpc) {
        this.send(this.codec.encodeRpc("MetricsRpc", rpc));
    }
    parachuteRpc() {
        this.send(this.codec.encodeRpc("ParachuteRpc", {}));
    }
}
exports.Game = Game;
