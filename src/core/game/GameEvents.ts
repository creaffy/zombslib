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
    EntityUpdate,
    GameStatusRpc,
    GameTimerRpc,
    GunGameWeaponRpc,
    InventoryUpdateEquipRpc,
    InventoryUpdateRpc,
    KillFeedRpc,
    LeaderboardRpc,
    LoadoutUserRpc,
    LoginResponseRpc,
    LootCategoryOverrideRpc,
    PartyLeftRpc,
    PartyUpdateRpc,
    PlaceBuildingFailedRpc,
    PlanePathRpc,
    PlayerCountRpc,
    ReceiveChatMessageRpc,
    ResetGameRpc,
    SetClientLoadoutRpc,
    ShutdownRpc,
    UpdateMarkerRpc,
    ACInitRpc,
    ObserverRpc,
    RpcExtra,
    UdpConnectResponse,
    PacketId,
    UdpFragment,
    UdpTick,
} from "../../types/Packets";
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
} from "../../types/Schemas";

export interface GameEvents {
    RawData: (data: Uint8Array, transport: "tpc" | "udp", packetId: PacketId) => void;
    EnterWorldResponse: (enterWorldResponse: EnterWorldResponse) => void;
    EntityUpdate: (entityUpdate: EntityUpdate | UdpTick, packetId: PacketId) => void; // PACKET_ENTITY_UPDATE, PACKET_UDP_TICK, PACKET_UDP_TICK_WITH_COMPRESSED_UIDS
    Rpc: (name: string, rpc: object, extra: RpcExtra) => void; // PACKET_RPC, PACKET_UDP_RPC
    UdpConnectResponse: (udpConnectResponse: UdpConnectResponse, packetId: PacketId) => void; // PACKET_UDP_CONNECT, PACKET_UDP_CONNECT_500, PACKET_UDP_CONNECT_1300

    ObserverRpc: (rpc: ObserverRpc, extra: RpcExtra) => void;
    ACInitRpc: (rpc: ACInitRpc, extra: RpcExtra) => void;
    ACToClientRpc: (rpc: ACToClientRpc, extra: RpcExtra) => void;
    DamageRpc: (rpc: DamageRpc, extra: RpcExtra) => void;
    DeadRpc: (rpc: DeadRpc, extra: RpcExtra) => void;
    InventoryUpdateEquipRpc: (rpc: InventoryUpdateEquipRpc, extra: RpcExtra) => void;
    DayNightRpc: (rpc: DayNightRpc, extra: RpcExtra) => void;
    ResetGameRpc: (rpc: ResetGameRpc, extra: RpcExtra) => void;
    InventoryUpdateRpc: (rpc: InventoryUpdateRpc, extra: RpcExtra) => void;
    AccountSessionRpc: (rpc: AccountSessionRpc, extra: RpcExtra) => void;
    ShutdownRpc: (rpc: ShutdownRpc, extra: RpcExtra) => void;
    GameTimerRpc: (rpc: GameTimerRpc, extra: RpcExtra) => void;
    PartyLeftRpc: (rpc: PartyLeftRpc, extra: RpcExtra) => void;
    AirDropRpc: (rpc: AirDropRpc, extra: RpcExtra) => void;
    CheatingDetectedRpc: (rpc: CheatingDetectedRpc, extra: RpcExtra) => void;
    LootCategoryOverrideRpc: (rpc: LootCategoryOverrideRpc, extra: RpcExtra) => void;
    LeaderboardRpc: (rpc: LeaderboardRpc, extra: RpcExtra) => void;
    PlanePathRpc: (rpc: PlanePathRpc, extra: RpcExtra) => void;
    PartyUpdateRpc: (rpc: PartyUpdateRpc, extra: RpcExtra) => void;
    PlayerCountRpc: (rpc: PlayerCountRpc, extra: RpcExtra) => void;
    DataFinishedRpc: (rpc: DataFinishedRpc, extra: RpcExtra) => void;
    GunGameWeaponRpc: (rpc: GunGameWeaponRpc, extra: RpcExtra) => void;
    UpdateMarkerRpc: (rpc: UpdateMarkerRpc, extra: RpcExtra) => void;
    KillFeedRpc: (rpc: KillFeedRpc, extra: RpcExtra) => void;
    LoginResponseRpc: (rpc: LoginResponseRpc, extra: RpcExtra) => void;
    LoadoutUserRpc: (rpc: LoadoutUserRpc, extra: RpcExtra) => void;
    ReceiveChatMessageRpc: (rpc: ReceiveChatMessageRpc, extra: RpcExtra) => void;
    CompressedDataRpc: (rpc: CompressedDataRpc, extra: RpcExtra) => void;
    EndOfGameStatsRpc: (rpc: EndOfGameStatsRpc, extra: RpcExtra) => void;
    GameStatusRpc: (rpc: GameStatusRpc, extra: RpcExtra) => void;
    DataRpc: (rpc: DataRpc, extra: RpcExtra) => void;
    PlaceBuildingFailedRpc: (rpc: PlaceBuildingFailedRpc, extra: RpcExtra) => void;
    SetClientLoadoutRpc: (rpc: SetClientLoadoutRpc, extra: RpcExtra) => void;

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
