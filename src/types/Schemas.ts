export interface SchemaAmmo {
    Name?: string;
    FriendlyName?: string;
}

export interface SchemaBuildingWall {
    Name?: string;
}

export interface SchemaBuildingWindow {
    Name?: string;
}

export interface SchemaBuildingSensor {
    DefinedBoundary?: boolean;
}

export interface SchemaBuildingDoor {
    Name?: string;
    PropClass?: string;
    Rotation?: number;
    IsSliding?: boolean;
    IsFlipped?: boolean;
    ClosedX1?: number;
    ClosedY1?: number;
    ClosedX2?: number;
    ClosedY2?: number;
    OpenedX1?: number;
    OpenedY1?: number;
    OpenedX2?: number;
    OpenedY2?: number;
    OpenedInwardX1?: number;
    OpenedInwardY1?: number;
    OpenedInwardX2?: number;
    OpenedInwardY2?: number;
    OpenedOutwardX1?: number;
    OpenedOutwardY1?: number;
    OpenedOutwardX2?: number;
    OpenedOutwardY2?: number;
}

export interface SchemaBuildingProp {
    Name?: string;
    Rotation?: number;
    PercentChance?: number;
    Slot?: string;
    Grouping?: string;
}

export interface SchemaBuilding {
    Name?: string;
    Width?: number;
    Height?: number;
    Walls?: SchemaBuildingWall[];
    Windows?: SchemaBuildingWindow[];
    Sensors?: SchemaBuildingSensor[];
    Doors?: SchemaBuildingDoor[];
    Props?: SchemaBuildingProp[];
}

export interface SchemaEmote {
    Name?: string;
    FriendlyName?: string;
    Duration?: number;
    Sku?: string;
}

export interface SchemaGas {
    MsUntilStart?: number;
    MovesOverMs?: number;
    Radius?: number;
    DamagePerSecond?: number;
}

export interface SchemaGeneral {
    Width?: number;
    ItemCollisionRadius?: number;
}

export interface SchemaGunGameGun {
    Name?: string;
    Kills?: number;
}

export interface SchemaHealingItem {
    Name?: string;
    FriendlyName?: string;
    Type?: string;
    Description?: string;
    UseTime?: number;
    InitialAmmo?: number;
    MaxAmmo?: number;
    SoundUse?: number;
}

export interface SchemaLoadoutItem {
    ItemName?: string;
    Tier?: number;
}

export interface SchemaLoadout {
    Name?: string;
    Description?: string;
    Items?: SchemaLoadoutItem[];
}

export interface SchemaMapZone {
    Name?: string;
    X1?: number;
    Y1?: number;
    X2?: number;
    Y2?: number;
}

export interface SchemaMap {
    Name?: string;
    Version?: number;
    Zones?: SchemaMapZone[];
}

export interface SchemaModifier {
    Name?: string;
    FriendlyName?: string;
    Description?: string;
    Color?: string;
    CameraZoomFactorMultiplier?: number;
}

export interface SchemaNpc {
    Name?: string;
    FriendlyName?: string;
    PropClass?: string;
    Material?: string;
    Health?: number;
    CollisionRadius?: number;
    Width?: number;
    Height?: number;
    LootCategories?: string[];
    IsInteractable?: boolean;
    IsAutoInteractable?: boolean;
}

export interface SchemaPlayer {
    Damping?: number;
    Mass?: number;
    BaseSpeed?: number;
    CollisionRadius?: number;
    RotationDegreesPerMillisecond?: number;
    Health?: number;
    MaxShield?: number;
}

export interface SchemaPlayerBuilding {
    Name?: string;
    Health?: number;
    WoodCost?: number;
    WoodReward?: number;
    Width?: number;
    Height?: number;
    BuildTime?: number;
    InitialHealthPercent?: number;
}

export interface SchemaPosition {
    X?: number;
    Y?: number;
}

export interface SchemaProjectileCustomDamageDropoff {
    PathPercent?: number;
    DamagePercent?: number;
}

export interface SchemaProjectile {
    Name?: string;
    Type?: string;
    BlastVelocity?: number[];
    CollisionDamage?: number[];
    CollisionRadius?: number;
    AoeRadius?: number;
    AoeCount?: number;
    AoePeriod?: number;
    LifetimeMs?: number;
    LingeringMs?: number;
    StickyLifetimeMs?: number;
    MaxDistance?: number;
    Damping?: number;
    DamagePercentLostAtEndOfPath?: number;
    DamagePercentLostAtBeginningOfPath?: number;
    CustomDamageDropOff?: SchemaProjectileCustomDamageDropoff[];
}

export interface SchemaWeaponProjectile {
    Name?: string;
    DefaultWeapon?: string;
    RandomYawOffset?: number;
    YawOffset?: number;
    Delay?: number;
}

export interface SchemaProp {
    Name?: string;
    FriendlyName?: string;
    PropClass?: string;
    Material?: string;
    Health?: number;
    CollisionRadius?: number;
    Width?: number;
    Height?: number;
    LootCategories?: string[];
    Projectiles?: SchemaWeaponProjectile[];
}

export interface SchemaRect {
    X1?: number;
    Y1?: number;
    X2?: number;
    Y2?: number;
}

export interface SchemaSpawn {
    PropName?: string;
    X?: number;
    Y?: number;
    Rotation?: number;
}

export interface SchemaTier {
    Name?: string;
    Color?: string;
}

export interface SchemaVehicle {
    Name?: string;
    FriendlyName?: string;
    Health?: number;
}

export interface SchemaWeapon {
    Name?: string;
    FriendlyName?: string;
    Type?: string;
    Ammo?: string;
    Projectiles?: SchemaWeaponProjectile[];
    InitialAmmo?: number[];
    MaxAmmo?: number[];
    MsPerFire?: number[];
    MsPerRecharge?: number;
    MsPerCock?: number;
    ChargeUpMs?: number;
    RechargeAmount?: number;
    FiringCost?: number;
    MinRampUpTimeBeforeFiring?: number;
    CameraZoomFactor?: number;
    SoundFire?: string;
    SoundReload?: string;
    SoundEquip?: string;
}

export interface SchemaZombie {
    Name?: string;
    Health?: number;
}

export interface SchemaZone extends SchemaRect {
    Name?: string;
}
