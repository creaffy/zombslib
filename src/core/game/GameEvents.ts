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
    // --- Misc ---
    RawData: (data: Uint8Array) => void; // Any packet
    Rpc: (name: string, rpc: object, tick?: number) => void; // Any rpc
    RpcRawData: (namehash: number, decryptedData: Uint8Array) => void; // Any rpc
    EnterWorldResponse: (enterWorldResponse: EnterWorldResponse) => void;
    EntityUpdate: (entityUpdate: EntityUpdate) => void;
    /// --- Rpcs ---
    ObserverRpc: (rpc: ObserverRpc, tick?: number) => void;
    ACInitRpc: (rpc: ACInitRpc, tick?: number) => void;
    ACToClientRpc: (rpc: ACToClientRpc, tick?: number) => void;
    DamageRpc: (rpc: DamageRpc, tick?: number) => void;
    DeadRpc: (rpc: DeadRpc, tick?: number) => void;
    InventoryUpdateEquipRpc: (rpc: InventoryUpdateEquipRpc, tick?: number) => void;
    DayNightRpc: (rpc: DayNightRpc, tick?: number) => void;
    ResetGameRpc: (rpc: ResetGameRpc, tick?: number) => void;
    InventoryUpdateRpc: (rpc: InventoryUpdateRpc, tick?: number) => void;
    AccountSessionRpc: (rpc: AccountSessionRpc, tick?: number) => void;
    ShutdownRpc: (rpc: ShutdownRpc, tick?: number) => void;
    GameTimerRpc: (rpc: GameTimerRpc, tick?: number) => void;
    PartyLeftRpc: (rpc: PartyLeftRpc, tick?: number) => void;
    AirDropRpc: (rpc: AirDropRpc, tick?: number) => void;
    CheatingDetectedRpc: (rpc: CheatingDetectedRpc, tick?: number) => void;
    LootCategoryOverrideRpc: (rpc: LootCategoryOverrideRpc, tick?: number) => void;
    LeaderboardRpc: (rpc: LeaderboardRpc, tick?: number) => void;
    PlanePathRpc: (rpc: PlanePathRpc, tick?: number) => void;
    PartyUpdateRpc: (rpc: PartyUpdateRpc, tick?: number) => void;
    PlayerCountRpc: (rpc: PlayerCountRpc, tick?: number) => void;
    DataFinishedRpc: (rpc: DataFinishedRpc, tick?: number) => void;
    GunGameWeaponRpc: (rpc: GunGameWeaponRpc, tick?: number) => void;
    UpdateMarkerRpc: (rpc: UpdateMarkerRpc, tick?: number) => void;
    KillFeedRpc: (rpc: KillFeedRpc, tick?: number) => void;
    LoginResponseRpc: (rpc: LoginResponseRpc, tick?: number) => void;
    LoadoutUserRpc: (rpc: LoadoutUserRpc, tick?: number) => void;
    ReceiveChatMessageRpc: (rpc: ReceiveChatMessageRpc, tick?: number) => void;
    CompressedDataRpc: (rpc: CompressedDataRpc, tick?: number) => void;
    EndOfGameStatsRpc: (rpc: EndOfGameStatsRpc, tick?: number) => void;
    GameStatusRpc: (rpc: GameStatusRpc, tick?: number) => void;
    DataRpc: (rpc: DataRpc, tick?: number) => void;
    PlaceBuildingFailedRpc: (rpc: PlaceBuildingFailedRpc, tick?: number) => void;
    SetClientLoadoutRpc: (rpc: SetClientLoadoutRpc, tick?: number) => void;
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
