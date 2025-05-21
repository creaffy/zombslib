import { EventEmitter } from "node:events";
import { RawData, WebSocket } from "ws";
import { Codec } from "./codec";
import { ApiServer } from "../types/api";
import { InputRpc, MetricsRpc, PacketId, SetSkinRpc } from "../types/rpc";

export class Game extends EventEmitter {
    private socket: WebSocket;
    private codec = new Codec("./rpcs.json");

    public constructor(
        server: ApiServer,
        platform: string,
        codecVersion: number,
        displayName: string
    ) {
        super();

        const url = `wss://${server.hostnameV4}/${server.endpoint}`;
        this.socket = new WebSocket(url);
        this.socket.binaryType = "arraybuffer";

        this.socket.on("open", () => {
            const pow = this.codec.generateProofOfWork(
                server.endpoint,
                platform,
                server.discreteFourierTransformBias
            );

            const enterWorldRequest = Buffer.alloc(
                7 + Buffer.byteLength(displayName) + pow.length
            );
            enterWorldRequest.writeUint8(4, 0);
            enterWorldRequest.writeUint8(Buffer.byteLength(displayName), 1);
            enterWorldRequest.write(displayName, 2);
            enterWorldRequest.writeUint32LE(
                codecVersion,
                2 + Buffer.byteLength(displayName)
            );
            enterWorldRequest.writeUint8(
                pow.length,
                6 + Buffer.byteLength(displayName)
            );
            enterWorldRequest.set(pow, 7 + Buffer.byteLength(displayName));

            this.socket.send(new Uint8Array(enterWorldRequest));

            this.codec.computeRpcKey(
                codecVersion,
                new TextEncoder().encode("/" + server.endpoint),
                pow
            );
        });

        this.socket.on("message", (data: ArrayBuffer) => {
            const view = new DataView(data);
            switch (view.getUint8(0) as PacketId) {
                case PacketId.EnterWorld: {
                    this.codec.enterWorldResponse =
                        this.codec.decodeEnterWorldResponse(
                            new Uint8Array(data)
                        );

                    this.emit(
                        "EnterWorldResponse",
                        this.codec.enterWorldResponse
                    );

                    break;
                }
                case PacketId.EntityUpdate: {
                    const entityUpdate = this.codec.decodeEntityUpdate(
                        new Uint8Array(data)
                    );
                    this.emit("EntityUpdate", entityUpdate);
                    break;
                }
                case PacketId.Rpc: {
                    const decrypedData = this.codec.cryptRpc(
                        new Uint8Array(data)
                    );

                    this.emit("Rpc", decrypedData);

                    const definition = this.codec.enterWorldResponse.rpcs!.find(
                        (rpc) => rpc.index === decrypedData[1]
                    );

                    const rpc = this.codec.decodeRpc(definition!, decrypedData);

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

    public send(data: Uint8Array | undefined) {
        if (data) this.socket.send(data);
    }

    public shutdown() {
        this.socket.close();
    }

    public getEntityList() {
        return this.codec.entityList;
    }

    public getPlayerByName(name: string) {
        for (const [uid, entity] of this.getEntityList()) {
            if (entity.tick?.Name === name) return entity;
        }
        return undefined;
    }

    public getEnterWorldResponse() {
        return this.codec.enterWorldResponse;
    }

    public acToServerRpc(data: number[]) {
        this.send(this.codec.encodeRpc("ACToServerRpc", { data: data }));
    }

    public startUdpStreamRpc() {
        this.send(this.codec.encodeRpc("StartUdpStreamRpc", {}));
    }

    public setPlatformRpc(platform: string) {
        this.send(
            this.codec.encodeRpc("SetPlatformRpc", { platform: platform })
        );
    }

    public interactDoorRpc(
        buildingUid: number,
        doorIndex: number,
        close: number
    ) {
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

    public sendChatMessageRpc(channel: string, message: string) {
        this.send(
            this.codec.encodeRpc("SendChatMessageRpc", {
                channel: channel,
                message: message,
            })
        );
    }

    public joinTeamRpc(key: string, players: number) {
        this.send(
            this.codec.encodeRpc("JoinTeamRpc", { key: key, players: players })
        );
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
        this.send(
            this.codec.encodeRpc("DropAmmoRpc", { ammoIndex: ammoIndex })
        );
    }

    public setEmoteRpc(emote2: number) {
        this.send(this.codec.encodeRpc("SetEmoteRpc", { emote2: emote2 }));
    }

    public startLobbyRpc() {
        this.send(this.codec.encodeRpc("StartLobbyRpc", {}));
    }

    public setMarkerRpc(x: number, y: number, valid: number) {
        this.send(
            this.codec.encodeRpc("SetMarkerRpc", { x: x, y: y, valid: valid })
        );
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
