export interface EntityMap {
    id?: number;
    attributes?: EntityMapAttribute[];
    sortedUids?: number[];
    defaultTick?: Tick;
}
export interface EntityMapAttribute {
    nameHash?: number;
    type?: AttributeType;
}
export interface RpcParameter {
    nameHash?: number;
    type?: number;
    internalIndex?: number;
}
export interface NetworkEntity {
    uid?: number;
    tick?: Tick;
    type?: EntityType;
}
export declare enum EntityType {
    ZombieEntity = 249036071,
    SprayEntity = 504903628,
    PortalEntity = 580082061,
    PlayerEntity = 1112845922,
    CrystalEntity = 1491795389,
    VehicleEntity = 1561019755,
    PhysicsEntity = 2383969827,
    PlaneEntity = 2414203739,
    ItemEntity = 2817316692,
    ProjectileEntity = 3067001770,
    BuildingEntity = 3750051221,
    PropEntity = 3970592772,
    GasEntity = 4049394616,
    NpcEntity = 4108209120,
    GunGamePlayerEntity = 4124010558,
    PlayerBuildingEntity = 4131010518
}
export declare enum ModelHash {
    BaseHash = 3189039072,
    BuildingHash = 3750051221,
    GasHash = 4049394616,
    ItemHash = 2817316692,
    NpcHash = 4108209120,
    PlaneHash = 2414203739,
    PlayerBuildingHash = 4131010518,
    PlayerHash = 1112845922,
    PortalHash = 580082061,
    ProjectileHash = 3067001770,
    PropHash = 3970592772,
    SprayHash = 504903628,
    ZombieHash = 249036071
}
export interface Rpc {
    nameHash?: number;
    parameters?: RpcParameter[];
    index?: number;
    isArray?: boolean;
}
export declare enum PacketId {
    EntityUpdate = 0,
    PlayerCounterUpdate = 1,
    SetWorldDimensions = 2,
    Input = 3,
    EnterWorld = 4,
    Ping = 7,
    Rpc = 9,
    UdpConnect = 10,
    UdpTick = 11,
    UdpAckTick = 12,
    UdpPong = 13,
    UdpPingWithCompressedUids = 14,
    UdpFragment = 15,
    UdpConnect1300 = 16,
    UdpConnect500 = 17,
    UdpRpc = -1
}
export declare enum ParameterType {
    Uint32 = 0,
    Int32 = 1,
    Float = 2,
    String = 3,
    Uint64 = 4,
    Int64 = 5,
    Uint16 = 6,
    Int16 = 7,
    Uint8 = 8,
    Int8 = 9,
    VectorUint8 = 10,
    CompressedString = 11
}
export declare enum AttributeType {
    Uninitialized = 0,
    Uint32 = 1,
    Int32 = 2,
    Float = 3,
    String = 4,
    Vector2 = 5,
    EntityType = 6,
    ArrayVector2 = 7,
    ArrayUint32 = 8,
    Uint16 = 9,
    Uint8 = 10,
    Int16 = 11,
    Int8 = 12,
    Uint64 = 13,
    Int64 = 14,
    Double = 15,
    ArrayInt32 = 16,
    ArrayUint8 = 17
}
export interface EnterWorldResponse {
    version?: number;
    allowed?: number;
    uid?: number;
    startingTick?: number;
    tickRate?: number;
    effectiveTickRate?: number;
    players?: number;
    maxPlayers?: number;
    chatChannel?: number;
    effectiveDisplayName?: string;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    entities?: EntityMap[];
    rpcs?: Rpc[];
    mode?: string;
    map?: string;
    udpCookie?: number;
    udpPort?: number;
}
export interface EnterWorldRequest {
    displayName: string;
    version: number;
    proofOfWork: Uint8Array;
}
export interface EntityUpdate {
    tick?: number;
    deletedEntities?: number[];
    createdEntities?: number[];
    updatedEntities?: Map<number, number[]>;
}
export interface Vector2 {
    x: number;
    y: number;
}
export interface Tick {
    Uid?: number;
    Name?: string;
    Position?: Vector2;
    Scale?: number;
    EntityClass?: string;
    ModelHash?: number;
    Yaw?: number;
    InterpolatedYaw?: number;
    AimingYaw?: number;
    Health?: number;
    MaxHealth?: number;
    Energy?: number;
    MaxEnergy?: number;
    ReconnectSecret?: string;
    Score?: number;
    Armor?: number;
    SpeedAttribute?: number;
    Damage?: number;
    AvailableSkillPoints?: number;
    CollisionRadius?: number;
    Width?: number;
    Height?: number;
    Level?: number;
    Kills?: number;
    Dead?: number;
    TimeAlive?: number;
    EntityMap?: any;
    NextPooledTick?: any;
    lastFieldRequested?: number;
    deathTick?: number;
    firingTick?: number;
    firingSequence?: number;
    lastDamagedTick?: number;
    equippedCategoryId?: number;
    equippedDataIndex?: number;
    equippedTier?: number;
    equippedInventorySlot?: number;
    equippedSkinId?: number;
    shield?: number;
    maxShield?: number;
    healthDamageTaken?: number;
    shieldDamageTaken?: number;
    effect?: number;
    knockDowns?: number;
    currentAmmo?: number;
    maxAmmo?: number;
    smallAmmo?: number;
    mediumAmmo?: number;
    largeAmmo?: number;
    shotgunAmmo?: number;
    wood?: number;
    startChargingTick?: number;
    startChargeUpTick?: number;
    reloadStartedTick?: number;
    reloadEndsTick?: number;
    actionStartedTick?: number;
    actionEndsTick?: number;
    cockingMsRemaining?: number;
    canParachute?: number;
    parachuteStartedTick?: number;
    parachuteMsRemaining?: number;
    isFreefalling?: number;
    emoteIndex?: number;
    emoteIndex2?: number;
    emoteTick?: number;
    parachuteId?: number;
    bodyId?: number;
    backpackId?: number;
    fistSkinId?: number;
    spectatingUid?: number;
    spectateCount?: number;
    partyId?: number;
    partyColor?: number;
    reviveStartedTick?: number;
    reviveEndsTick?: number;
    isKnockedDown?: number;
    knockedDownHealth?: number;
    knockedDownMaxHealth?: number;
    isOnFire?: number;
    isPoisoned?: number;
    isSlowed?: number;
    isHealing?: number;
    isInWater?: number;
    isInBuildingMode?: number;
    zombieKills?: number;
    movementSpeedAffinityRocks?: number;
    defenseAffinityRocks?: number;
    bulletDamageAffinityRocks?: number;
    bulletSpeedAffinityRocks?: number;
    portalEnterTick?: number;
    isGrappling?: number;
    isVip?: number;
    isBoosted?: number;
    lastBulletDataIndex?: number;
    lastBulletLifetimePercent?: number;
    grapplingHookPosition?: Vector2;
    vehicleUid?: number;
    vehicleSlot?: number;
    equippedModifierIndex?: number;
    obtainableUids?: number[];
    interactableUids?: number[];
    visibleBuildingUids?: number[];
    dataIndex?: number;
    collisionUid?: number;
    ownerUid?: number;
    trailId?: number;
    trailColorId?: number;
    creationTick?: number;
    stuckAtTick?: number;
    effectiveLifetimeMs?: number;
    categoryId?: number;
    tier?: number;
    quantity?: number;
    skinId?: number;
    modifierIndex?: number;
    weaponKills?: number;
    currentCircleRadius?: number;
    nextCircleRadius?: number;
    lastCircleRadius?: number;
    currentCirclePosition?: Vector2;
    nextCirclePosition?: Vector2;
    lastCirclePosition?: Vector2;
    currentCircleTick?: number;
    openDoorIds?: number[];
    openDoorDirections?: number[];
    brokenWindowIds?: number[];
    sprayIndex?: number;
    airDropLandTick?: number;
    isVehicle?: number;
    vehicleOccupants?: number[];
}
export interface DataRpc {
    dataName: string;
    json: string;
}
export interface ACToClientRpc {
    data: number[];
}
export interface ACToServerRpc {
    data: number[];
}
export interface DamageRpc {
    uid: number;
    healthDamage: number;
    shieldDamage: number;
    knockedDownDamage: number;
}
export interface DeadRpc {
    rank: number;
    kills: number;
    lifetime: number;
    respawnAllowedAt: number;
}
export interface InventoryUpdateEquipRpc {
    inventorySlot: number;
}
export interface StartUdpStreamRpc {
}
export interface SetPlatformRpc {
    platform: string;
}
export interface InteractDoorRpc {
    buildingUid: number;
    doorIndex: number;
    close: number;
}
export interface EnterVehicleRpc {
    uid: number;
}
export interface DayNightRpc {
    startTick: number;
    endTick: number;
    isDay: number;
}
export interface ResetGameRpc {
}
export interface AutoFillRpc {
}
export interface InventoryUpdateRpc {
    inventorySlot: number;
    categoryId: number;
    dataIndex: number;
    tier: number;
    stacks: number;
    skinId: number;
    modifierIndex: number;
}
export interface AccountSessionRpc {
    json: number;
}
export interface StartCircleRpc {
}
export interface SendChatMessageRpc {
    channel: string;
    message: string;
}
export interface ShutdownRpc {
    shutdownUnix: number;
    reason: string;
}
export interface JoinTeamRpc {
    key: string;
    players: number;
}
export interface GameTimerRpc {
    startTick: number;
    endTick: number;
}
export interface PlaceBuildingRpc {
    dataIndex: number;
    x: number;
    y: number;
}
export interface SwapItemRpc {
    inventorySlot1: number;
    inventorySlot2: number;
}
export interface SetBuildingModeRpc {
    isBuilding: number;
}
export interface StartReviveRpc {
    uid: number;
}
export interface LoginRpc {
    token: string;
}
export interface PartyLeftRpc {
}
export interface RespawnRpc {
    respawnWithHalf: number;
}
export interface AirDropRpc {
    landingTick: number;
    airDropUid: number;
    x: number;
    y: number;
}
export interface CheatingDetectedRpc {
}
export interface ConsumeRpc {
}
export interface LootCategoryOverrideRpc {
}
export interface LeaderboardRpc {
    uid: number;
    rank: number;
    playerName: string;
    kills: number;
}
export interface PlanePathRpc {
    x: number;
    y: number;
    yaw: number;
}
export interface PartyUpdateRpc {
    joined: number;
    uid: number;
    playerName: string;
    friendCode: string;
}
export interface PlayerCountRpc {
    playersAlive: number;
    totalPlayers: number;
    partiesAlive: number;
    totalParties: number;
    team1Alive: number;
    team2Alive: number;
}
export interface DropAmmoRpc {
    ammoIndex: number;
}
export interface SetEmoteRpc {
    emote2: number;
}
export interface DataFinishedRpc {
}
export interface StartLobbyRpc {
}
export interface SetMarkerRpc {
    x: number;
    y: number;
    valid: number;
}
export interface PickupItemRpc {
    itemUid: number;
    inventorySlot: number;
}
export interface SetSkinRpc {
    slot: number;
    subSlot: number;
    skinId: number;
}
export interface EquipItemRpc {
    inventorySlot: number;
}
export interface GunGameWeaponRpc {
    index: number;
    killsTowardsNextGun: number;
    killsRequiredForNextGun: number;
}
export interface SetPartyColorRpc {
    party: number;
}
export interface SprayRpc {
    sprayIndex2: number;
    x: number;
    y: number;
}
export interface SetLoadoutRpc {
    index: number;
}
export interface DropItemRpc {
    inventorySlot: number;
    x: number;
    y: number;
}
export interface UpdateMarkerRpc {
    x: number;
    y: number;
    uid: number;
    valid: number;
}
export interface RespawnPendingRpc {
}
export interface ReloadServerRpc {
}
export interface KillFeedRpc {
    killer: string;
    killerUid: number;
    killerColor: number;
    victim: string;
    victimUid: number;
    victimColor: number;
    category: number;
    weaponIndex: number;
    knockedDown: number;
    isZombie: number;
}
export interface ExitVehicleRpc {
}
export interface InputRpc {
    inputUid: number;
    acknowledgedTickNumber: number;
    isPing: number;
    left: number;
    right: number;
    down: number;
    up: number;
    space: number;
    moveDirection: number;
    use: number;
    worldX: number;
    worldY: number;
    distance: number;
    yaw: number;
    mouseDown: number;
    mouseMovedWhileDown: number;
    mouseMoved: number;
    mouseUp: number;
    moveSpeed: number;
    rightMouseDown: number;
    zoomFactor: number;
    unknown: number;
}
export interface LoginResponseRpc {
    json: string;
}
export interface LoadoutUserRpc {
    index: number;
    count: number;
    limit: number;
}
export interface ReloadRpc {
}
export interface ReceiveChatMessageRpc {
    displayName: string;
    channel: string;
    message: string;
    uid: number;
}
export interface CompressedDataRpc {
    dataName: string;
    json: string;
}
export interface EndOfGameStatsRpc {
    rank: number;
    kills: number;
    lifetime: number;
    zombieKills: number;
    analytics: string;
    resetTick: number;
}
export interface GameStatusRpc {
    status: string;
    countDownEndsTick: number;
}
export interface SpectateRpc {
    uid: number;
}
export interface DataRpc {
    dataName: string;
}
export interface StartTcpStreamRpc {
    attemptedUdp: number;
    received500: number;
}
export interface PlaceBuildingFailedRpc {
    reason: number;
}
export interface CancelActionRpc {
}
export interface LootChestRpc {
    chestUid: number;
}
export interface MetricsRpc {
    minFps: number;
    maxFps: number;
    averageFps: number;
    currentFps: number;
    framesRendered: number;
    framesInterpolated: number;
    framesExtrapolated: number;
    allocatedNetworkEntities: number;
    currentClientLag: number;
    minClientLag: number;
    maxClientLag: number;
    currentPing: number;
    minPing: number;
    maxPing: number;
    averagePing: number;
    longFrames: number;
    stutters: number;
    timeResets: number;
    maxExtrapolationTime: number;
    extrapolationIncidents: number;
    totalExtrapolationTime: number;
    differenceInClientTime: number;
    currentTickSize: number;
    maxTickSize: number;
    averageTickSize: number;
    packetLossPercent: number;
    pingRequestSentTick: number;
    pingResponseSentTick: number;
    pingResponseReceivedTick: number;
    usingUdp: number;
    group: number;
    stage: number;
    isMobile: number;
}
export interface SetClientLoadoutRpc {
    index: number;
}
export interface ParachuteRpc {
}
