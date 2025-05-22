"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const node_events_1 = require("node:events");
const ws_1 = require("ws");
const codec_1 = require("./codec");
const rpc_1 = require("../types/rpc");
class Game extends node_events_1.EventEmitter {
    on(event, listener) {
        return super.on(event, listener);
    }
    constructor(server, platform, codecVersion, displayName) {
        super();
        this.codec = new codec_1.Codec("./rpcs.json");
        const url = `wss://${server.hostnameV4}/${server.endpoint}`;
        this.socket = new ws_1.WebSocket(url);
        this.socket.binaryType = "arraybuffer";
        this.socket.on("open", () => {
            const pow = this.codec.generateProofOfWork(server.endpoint, platform, server.discreteFourierTransformBias);
            const enterWorldRequest = Buffer.alloc(7 + Buffer.byteLength(displayName) + pow.length);
            enterWorldRequest.writeUint8(4, 0);
            enterWorldRequest.writeUint8(Buffer.byteLength(displayName), 1);
            enterWorldRequest.write(displayName, 2);
            enterWorldRequest.writeUint32LE(codecVersion, 2 + Buffer.byteLength(displayName));
            enterWorldRequest.writeUint8(pow.length, 6 + Buffer.byteLength(displayName));
            enterWorldRequest.set(pow, 7 + Buffer.byteLength(displayName));
            this.socket.send(new Uint8Array(enterWorldRequest));
            this.codec.computeRpcKey(codecVersion, new TextEncoder().encode("/" + server.endpoint), pow);
        });
        this.socket.on("message", (data) => {
            const view = new DataView(data);
            switch (view.getUint8(0)) {
                case rpc_1.PacketId.EnterWorld: {
                    this.codec.enterWorldResponse =
                        this.codec.decodeEnterWorldResponse(new Uint8Array(data));
                    this.emit("EnterWorldResponse", this.codec.enterWorldResponse);
                    break;
                }
                case rpc_1.PacketId.EntityUpdate: {
                    const entityUpdate = this.codec.decodeEntityUpdate(new Uint8Array(data));
                    this.emit("EntityUpdate", entityUpdate);
                    break;
                }
                case rpc_1.PacketId.Rpc: {
                    const decrypedData = this.codec.cryptRpc(new Uint8Array(data));
                    this.emit("Rpc", decrypedData);
                    const definition = this.codec.enterWorldResponse.rpcs.find((rpc) => rpc.index === decrypedData[1]);
                    const rpc = this.codec.decodeRpc(definition, decrypedData);
                    if (rpc !== undefined && rpc.name !== null)
                        this.emit(rpc.name, rpc.data);
                    break;
                }
            }
        });
        this.socket.on("close", (code) => {
            this.emit("close", code);
        });
    }
    send(data) {
        if (data)
            this.socket.send(data);
    }
    shutdown() {
        this.socket.close();
    }
    getEntityList() {
        return this.codec.entityList;
    }
    getPlayerByName(name) {
        for (const [uid, entity] of this.getEntityList()) {
            if (entity.tick?.Name === name)
                return entity;
        }
        return undefined;
    }
    getEnterWorldResponse() {
        return this.codec.enterWorldResponse;
    }
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
