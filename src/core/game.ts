import { EventEmitter } from "node:events";
import { WebSocket } from "ws";
import { Codec } from "./codec";
import { ApiServer } from "../types/api";
import {
    AccountSessionRpc,
    ACToClientRpc,
    AirDropRpc,
    CheatingDetectedRpc,
    CompressedDataRpc,
    DamageRpc,
    DataFinishedRpc,
    DataRpc,
    DayNightRpc,
    DeadRpc,
    EndOfGameStatsRpc,
    EnterWorldResponse,
    EnterWorldRequest,
    EntityType,
    EntityUpdate,
    GameStatusRpc,
    GameTimerRpc,
    GunGameWeaponRpc,
    InputRpc,
    InventoryUpdateEquipRpc,
    InventoryUpdateRpc,
    KillFeedRpc,
    LeaderboardRpc,
    LoadoutUserRpc,
    LoginResponseRpc,
    LootCategoryOverrideRpc,
    MetricsRpc,
    PacketId,
    PartyLeftRpc,
    PartyUpdateRpc,
    PlaceBuildingFailedRpc,
    PlanePathRpc,
    PlayerCountRpc,
    ReceiveChatMessageRpc,
    ResetGameRpc,
    SetClientLoadoutRpc,
    SetSkinRpc,
    ShutdownRpc,
    UpdateMarkerRpc,
    Vector2,
} from "../types/network";
import {
    SchemaAmmo,
    SchemaBuilding,
    SchemaEmote,
    SchemaGas,
    SchemaGeneral,
    SchemaGunGameGun,
    SchemaHealingItem,
    SchemaLoadout,
    SchemaMap,
    SchemaModifier,
    SchemaNpc,
    SchemaPlayer,
    SchemaPlayerBuilding,
    SchemaProjectile,
    SchemaProp,
    SchemaTier,
    SchemaVehicle,
    SchemaWeapon,
    SchemaZombie,
} from "../types/schema";

interface GameEvents {
    // --- Misc ---
    RawData: (data: Uint8Array) => void; // Any packet
    Rpc: (name: string, rpc: object) => void; // Any rpc
    EnterWorldResponse: (enterWorldResponse: EnterWorldResponse) => void;
    EntityUpdate: (entityUpdate: EntityUpdate) => void;
    /// --- Rpcs ---
    ACToClientRpc: (rpc: ACToClientRpc) => void;
    DamageRpc: (rpc: DamageRpc) => void;
    DeadRpc: (rpc: DeadRpc) => void;
    InventoryUpdateEquipRpc: (rpc: InventoryUpdateEquipRpc) => void;
    DayNightRpc: (rpc: DayNightRpc) => void;
    ResetGameRpc: (rpc: ResetGameRpc) => void;
    InventoryUpdateRpc: (rpc: InventoryUpdateRpc) => void;
    AccountSessionRpc: (rpc: AccountSessionRpc) => void;
    ShutdownRpc: (rpc: ShutdownRpc) => void;
    GameTimerRpc: (rpc: GameTimerRpc) => void;
    PartyLeftRpc: (rpc: PartyLeftRpc) => void;
    AirDropRpc: (rpc: AirDropRpc) => void;
    CheatingDetectedRpc: (rpc: CheatingDetectedRpc) => void;
    LootCategoryOverrideRpc: (rpc: LootCategoryOverrideRpc) => void;
    LeaderboardRpc: (rpc: LeaderboardRpc) => void;
    PlanePathRpc: (rpc: PlanePathRpc) => void;
    PartyUpdateRpc: (rpc: PartyUpdateRpc) => void;
    PlayerCountRpc: (rpc: PlayerCountRpc) => void;
    DataFinishedRpc: (rpc: DataFinishedRpc) => void;
    GunGameWeaponRpc: (rpc: GunGameWeaponRpc) => void;
    UpdateMarkerRpc: (rpc: UpdateMarkerRpc) => void;
    KillFeedRpc: (rpc: KillFeedRpc) => void;
    LoginResponseRpc: (rpc: LoginResponseRpc) => void;
    LoadoutUserRpc: (rpc: LoadoutUserRpc) => void;
    ReceiveChatMessageRpc: (rpc: ReceiveChatMessageRpc) => void;
    CompressedDataRpc: (rpc: CompressedDataRpc) => void;
    EndOfGameStatsRpc: (rpc: EndOfGameStatsRpc) => void;
    GameStatusRpc: (rpc: GameStatusRpc) => void;
    DataRpc: (rpc: DataRpc) => void;
    PlaceBuildingFailedRpc: (rpc: PlaceBuildingFailedRpc) => void;
    SetClientLoadoutRpc: (rpc: SetClientLoadoutRpc) => void;
    // --- Schemas ---
    SchemaAmmos: (data: SchemaAmmo[]) => void;
    SchemaBuildings: (data: SchemaBuilding[]) => void;
    SchemaEmotes: (data: SchemaEmote[]) => void;
    SchemaGas: (data: SchemaGas[]) => void;
    SchemaGeneral: (data: SchemaGeneral) => void;
    SchemaGunGameGuns: (data: SchemaGunGameGun[]) => void;
    SchemaHealingItems: (data: SchemaHealingItem[]) => void;
    SchemaLoadouts: (data: SchemaLoadout[]) => void;
    SchemaMaps: (data: SchemaMap[]) => void;
    SchemaModifiers: (data: SchemaModifier[]) => void;
    SchemaNpcs: (data: SchemaNpc[]) => void;
    SchemaPlane: (data: object) => void;
    SchemaPlayer: (data: SchemaPlayer[]) => void;
    SchemaPlayerBuildings: (data: SchemaPlayerBuilding[]) => void;
    SchemaProjectiles: (data: SchemaProjectile[]) => void;
    SchemaProps: (data: SchemaProp[]) => void;
    SchemaTiers: (data: SchemaTier[]) => void;
    SchemaVehicles: (data: SchemaVehicle[]) => void;
    SchemaWeapons: (data: SchemaWeapon[]) => void;
    SchemaZombies: (data: SchemaZombie[]) => void;
}

export class Game extends EventEmitter {
    private socket: WebSocket;
    private codec = new Codec("./rpcs.json");

    override on<K extends keyof GameEvents>(
        event: K,
        listener: GameEvents[K]
    ): this;

    override on(event: string, listener: (...args: any[]) => void): this;

    override on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    public constructor(server: ApiServer, displayName: string) {
        super();

        const url = `wss://${server.hostnameV4}/${server.endpoint}`;
        this.socket = new WebSocket(url);
        this.socket.binaryType = "arraybuffer";

        this.socket.on("open", () => {
            const pow = this.codec.generateProofOfWork(
                server.endpoint,
                this.codec.rpcMapping.Platform,
                server.discreteFourierTransformBias
            );

            const enterWorldRequest: EnterWorldRequest | undefined = {
                displayName: displayName,
                version: this.codec.rpcMapping.Codec,
                proofOfWork: pow,
            };
            this.socket.send(
                this.codec.encodeEnterWorldRequest(enterWorldRequest)
            );

            this.codec.computeRpcKey(
                this.codec.rpcMapping.Codec,
                new TextEncoder().encode("/" + server.endpoint),
                pow
            );
        });

        this.socket.on("message", (data: ArrayBuffer) => {
            const view = new DataView(data);
            const data2 = new Uint8Array(data);

            this.emit("RawData", data2);

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
                    const entityUpdate = this.codec.decodeEntityUpdate(data2);
                    this.emit("EntityUpdate", entityUpdate);

                    break;
                }
                case PacketId.Rpc: {
                    const decrypedData = this.codec.cryptRpc(data2);

                    const definition = this.codec.enterWorldResponse.rpcs!.find(
                        (rpc) => rpc.index === decrypedData[1]
                    );

                    const rpc = this.codec.decodeRpc(definition!, decrypedData);

                    if (rpc !== undefined && rpc.name !== null) {
                        this.emit("Rpc", rpc.name, rpc.data);
                        this.emit(rpc.name, rpc.data);
                    }

                    break;
                }
            }
        });

        this.socket.on("close", (code) => {
            this.emit("close", code);
        });

        this.on("CompressedDataRpc", (rpc: CompressedDataRpc) => {
            this.emit(`Schema${rpc.dataName}`, JSON.parse(rpc.json));
        });
    }

    public send(data: Uint8Array | undefined) {
        if (data) this.socket.send(data);
    }

    public shutdown() {
        this.socket.close();
    }

    // --- Utility ---

    public getEnterWorldResponse() {
        return this.codec.enterWorldResponse;
    }

    public getEntityList() {
        return this.codec.entityList;
    }

    public getEntitiesByType(type: EntityType) {
        return new Map(
            Array.from(this.codec.entityList).filter(
                ([k, v]) => v.type === type
            )
        );
    }

    public getMyUid() {
        return this.codec.enterWorldResponse.uid!;
    }

    public getEntityByUid(uid: number) {
        return this.getEntityList().get(uid);
    }

    public getPlayerByName(name: string) {
        for (const [uid, entity] of this.getEntityList()) {
            if (entity.currentTick?.Name === name) return entity;
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

    public sendChatMessageRpc(channel: "Local" | "Party", message: string) {
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
