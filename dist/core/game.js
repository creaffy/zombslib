"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
exports.rpcMappingFromFile = rpcMappingFromFile;
const node_events_1 = require("node:events");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const ws_1 = require("ws");
const codec_1 = require("./codec");
const network_1 = require("../types/network");
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
        const displayName = options?.displayName ?? "Player";
        const proxy = options?.proxy;
        const decodeEntityUpdates = options?.decodeEntityUpdates ?? true;
        const decodeRpcs = options?.decodeRpcs ?? true;
        const rpcMapping = options?.rpcMapping ??
            JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(__dirname, "../../", "./rpcs.json"), {
                encoding: "utf-8",
            }));
        this.codec = new codec_1.Codec(rpcMapping);
        const url = `wss://${server.hostnameV4}/${server.endpoint}`;
        this.socket = new ws_1.WebSocket(url, { agent: proxy });
        this.socket.binaryType = "arraybuffer";
        this.socket.on("open", () => {
            const pow = this.codec.generateProofOfWork(server.endpoint, this.codec.rpcMapping.Platform, server.discreteFourierTransformBias);
            const enterWorldRequest = {
                displayName: displayName,
                version: this.codec.rpcMapping.Codec,
                proofOfWork: pow,
            };
            this.socket.send(this.codec.encodeEnterWorldRequest(enterWorldRequest));
            this.codec.computeRpcKey(this.codec.rpcMapping.Codec, new TextEncoder().encode("/" + server.endpoint), pow);
        });
        this.socket.on("message", (data) => {
            const view = new DataView(data);
            const data2 = new Uint8Array(data);
            this.emit("RawData", data2);
            switch (view.getUint8(0)) {
                case network_1.PacketId.EnterWorld: {
                    this.codec.enterWorldResponse = this.codec.decodeEnterWorldResponse(new Uint8Array(data));
                    this.emit("EnterWorldResponse", this.codec.enterWorldResponse);
                    break;
                }
                case network_1.PacketId.EntityUpdate: {
                    if (decodeEntityUpdates) {
                        const entityUpdate = this.codec.decodeEntityUpdate(data2);
                        this.emit("EntityUpdate", entityUpdate);
                    }
                    break;
                }
                case network_1.PacketId.Rpc: {
                    if (decodeRpcs) {
                        const decrypedData = this.codec.cryptRpc(data2);
                        const definition = this.codec.enterWorldResponse.rpcs.find((rpc) => rpc.index === decrypedData[1]);
                        this.emit("RpcRawData", definition.nameHash, decrypedData);
                        const rpc = this.codec.decodeRpc(definition, decrypedData);
                        if (rpc !== undefined && rpc.name !== null) {
                            this.emit("Rpc", rpc.name, rpc.data);
                            this.emit(rpc.name, rpc.data);
                        }
                    }
                    break;
                }
            }
        });
        this.socket.on("close", (code) => {
            this.emit("close", code);
        });
        this.socket.on("error", (error) => {
            this.emit("error", error);
        });
        this.on("CompressedDataRpc", (rpc) => {
            this.emit(`Schema${rpc.dataName}`, JSON.parse(rpc.json));
        });
    }
    send(data) {
        if (data)
            this.socket.send(data);
    }
    shutdown() {
        this.socket.close();
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
            if (entity.tick?.Name === name)
                return entity;
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
