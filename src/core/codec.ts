import { sha1 } from "js-sha1";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BinaryReader } from "../utility/reader";
import { BinaryWriter } from "../utility/writer";
import {
    AttributeType,
    EnterWorldResponse,
    EntityMap,
    EntityMapAttribute,
    Rpc,
    RpcParameter,
    NetworkEntity,
    EntityUpdate,
    ParameterType,
} from "../types/rpc";

export class Codec {
    private rpcKey = new Uint8Array(8);
    private entityMaps: EntityMap[] = [];
    private rpcMapping: DumpedData;
    public enterWorldResponse: EnterWorldResponse = {};
    public entityList = new Map<number, NetworkEntity>();

    public constructor(path: string) {
        this.rpcMapping = JSON.parse(
            readFileSync(join(__dirname, "../../", path), {
                encoding: "utf-8",
            })
        );
    }

    public computeRpcKey(
        codecVersion: number,
        targetUrl: Uint8Array,
        proofOfWork: Uint8Array
    ) {
        for (let i = 0; i < proofOfWork.length; ++i)
            this.rpcKey[i % this.rpcKey.length] ^= proofOfWork[i];

        for (let i = 0; i < this.rpcKey.length; ++i)
            this.rpcKey[i] ^= codecVersion;

        for (let i = 0; i < targetUrl.length; ++i)
            this.rpcKey[i % this.rpcKey.length] ^= targetUrl[i];
    }

    public generateProofOfWork(
        endpoint: string,
        platform: string = "android",
        difficulty: number = 16,
        size: number = 24
    ): Buffer<ArrayBuffer> {
        const pathBytes = Buffer.from("/" + endpoint, "utf8");
        const powBuffer = Buffer.alloc(size + pathBytes.length);
        powBuffer.set(pathBytes, size);

        let platformLogic;
        let hashState;

        switch (platform) {
            case "windows": {
                hashState = {
                    h0: 0xcde4bac7,
                    h1: 0xb6217224,
                    h2: 0x872a5994,
                    h3: 0xcf538f47,
                    h4: 0xec8dc5a1,
                };

                platformLogic = () => {
                    powBuffer[7] |= 8;
                    powBuffer[6] &= 239;
                    powBuffer[3] &= 127;
                };

                break;
            }
            case "web": {
                hashState = {
                    h0: 0x04c82ad0,
                    h1: 0x2beacb85,
                    h2: 0x4ccc8e6b,
                    h3: 0x849ad64a,
                    h4: 0x57ada298,
                };

                platformLogic = () => {
                    powBuffer[7] &= 247;
                    powBuffer[6] |= 16;
                    powBuffer[3] &= 127;
                };

                break;
            }
            case "android": {
                hashState = {
                    h0: 0xa9c9f023,
                    h1: 0x14f071e7,
                    h2: 0xc2d99914,
                    h3: 0x8e8dda42,
                    h4: 0xb8acc665,
                };

                platformLogic = () => {
                    powBuffer[7] &= 247;
                    powBuffer[6] &= 239;
                    powBuffer[3] |= 128;
                };

                break;
            }
        }

        let state =
            Math.random() * 0xffffffff ||
            Math.floor(Math.random() * Math.pow(2, 32));

        while (true) {
            for (let i = 0; i < size; ++i) {
                state ^= state << 13;
                state ^= state >>> 17;
                state ^= state << 5;
                powBuffer[i] = state;
            }

            platformLogic!();
            powBuffer[4] &= 253;
            powBuffer[2] &= 254;
            powBuffer[5] &= 223;
            powBuffer[8] |= 32;
            powBuffer[9] &= 251;

            const hash = sha1.create();
            Object.assign(hash, hashState);
            hash.update(powBuffer);

            const digest = Buffer.from(hash.digest()).swap32();

            let d = 0;
            while (true) {
                if ((digest[Math.floor(d / 8)] & (128 >> d % 8)) == 0) break;
                if (++d === difficulty) return powBuffer.subarray(0, size);
            }
        }
    }

    public cryptRpc(data: Uint8Array): Uint8Array {
        let rpc = new Uint8Array(data);

        for (let i = 1; i < rpc.length; ++i)
            rpc[i] ^= this.rpcKey[i % this.rpcKey.length];

        return rpc;
    }

    private decodeEntityMapAttribute(
        reader: BinaryReader,
        type: AttributeType
    ) {
        switch (type) {
            case AttributeType.Uint32:
                return reader.readUint32();
            case AttributeType.Int32:
                return reader.readInt32();
            case AttributeType.Float:
                return reader.readFloat() / 100;
            case AttributeType.String:
                return reader.readString();
            case AttributeType.Vector2: {
                const v = reader.readVector2();
                v.x /= 100;
                v.y /= -100;
                return v;
            }
            case AttributeType.ArrayVector2: {
                const v = reader.readArrayVector2();
                for (let e of v) {
                    e.x /= 100;
                    e.y /= -100;
                }
                return v;
            }
            case AttributeType.ArrayUint32:
                return reader.readArrayUint32();
            case AttributeType.Uint16:
                return reader.readUint16();
            case AttributeType.Uint8:
                return reader.readUint8();
            case AttributeType.Int16:
                return reader.readInt16();
            case AttributeType.Int8:
                return reader.readInt8();
            case AttributeType.ArrayInt32:
                return reader.readArrayInt32();
            case AttributeType.ArrayUint8:
                return reader.readArrayUint8();
        }
        return undefined;
    }

    public decodeEnterWorldResponse(data: Uint8Array) {
        const reader = new BinaryReader(data, 1);

        let enterWorldResponse: EnterWorldResponse = {};
        enterWorldResponse.version = reader.readUint32();
        enterWorldResponse.allowed = reader.readUint32();
        enterWorldResponse.uid = reader.readUint32();
        enterWorldResponse.startingTick = reader.readUint32();
        enterWorldResponse.tickRate = reader.readUint32();
        enterWorldResponse.effectiveTickRate = reader.readUint32();
        enterWorldResponse.players = reader.readUint32();
        enterWorldResponse.maxPlayers = reader.readUint32();
        enterWorldResponse.chatChannel = reader.readUint32();
        enterWorldResponse.effectiveDisplayName = reader.readString();
        enterWorldResponse.x1 = reader.readInt32();
        enterWorldResponse.y1 = reader.readInt32();
        enterWorldResponse.x2 = reader.readInt32();
        enterWorldResponse.y2 = reader.readInt32();

        const entityMapCount = reader.readUint32();
        enterWorldResponse.entities = [];
        for (let i = 0; i < entityMapCount; ++i) {
            let entityMap: EntityMap = {};
            entityMap.id = reader.readUint32();
            entityMap.attributes = [];
            entityMap.sortedUids = [];
            entityMap.defaultTick = {};

            const attributesCount = reader.readUint32();
            for (let j = 0; j < attributesCount; ++j) {
                let entityMapAttribute: EntityMapAttribute = {};
                entityMapAttribute.nameHash = reader.readUint32();
                entityMapAttribute.type = reader.readUint32();

                entityMap.defaultTick[
                    tickFieldMap.get(entityMapAttribute.nameHash)!
                ] = this.decodeEntityMapAttribute(
                    reader,
                    entityMapAttribute.type
                );

                entityMap.attributes.push(entityMapAttribute);
            }

            enterWorldResponse.entities.push(entityMap);
        }

        const rpcCount = reader.readUint32();
        enterWorldResponse.rpcs = [];
        for (let i = 0; i < rpcCount; ++i) {
            let rpc: Rpc = {};
            rpc.index = i;
            rpc.nameHash = reader.readUint32();

            const parameterCount = reader.readUint8();
            rpc.isArray = reader.readUint8() != 0;
            rpc.parameters = [];
            for (let j = 0; j < parameterCount; ++j) {
                let rpcParameter: RpcParameter = {};
                rpcParameter.nameHash = reader.readUint32();
                rpcParameter.type = reader.readUint8();
                rpcParameter.internalIndex = -1;
                rpc.parameters.push(rpcParameter);
            }

            enterWorldResponse.rpcs.push(rpc);
        }

        if (reader.canRead()) enterWorldResponse.mode = reader.readString();

        if (reader.canRead()) enterWorldResponse.map = reader.readString();

        if (reader.canRead())
            enterWorldResponse.udpCookie = reader.readUint32();

        if (reader.canRead()) enterWorldResponse.udpPort = reader.readUint32();

        this.entityMaps = enterWorldResponse.entities;

        return enterWorldResponse;
    }

    public decodeEntityUpdate(data: Uint8Array) {
        const reader = new BinaryReader(data, 1);

        let entityUpdate: EntityUpdate = {};
        entityUpdate.createdEntities = [];
        entityUpdate.tick = reader.readUint32();

        const deletedEntitiesCount = reader.readInt8();
        entityUpdate.deletedEntities = [];
        for (let i = 0; i < deletedEntitiesCount; ++i) {
            const uid = reader.readUint32();
            entityUpdate.deletedEntities.push(uid);
            this.entityList.delete(uid);
        }

        const entityMapsCount = reader.readInt8();
        for (let i = 0; i < entityMapsCount; ++i) {
            const brandNewEntitiesCount = reader.readInt8();
            const entityMapId = reader.readUint32();
            let entityMap = this.entityMaps.find((e) => e.id === entityMapId);
            if (entityMap === undefined) {
                entityMap = {
                    sortedUids: [],
                    defaultTick: {},
                };
            }
            for (let j = 0; j < brandNewEntitiesCount; ++j) {
                const uid = reader.readUint32();
                entityMap.sortedUids!.push(uid);
                this.entityList.set(uid, {
                    uid: uid,
                    modelHash: entityMapId,
                    tick: structuredClone(entityMap.defaultTick),
                });
                entityUpdate.createdEntities.push(uid);
            }
            entityMap.sortedUids!.sort((a, b) => a - b);
        }

        for (const entityMap of this.entityMaps) {
            entityMap.sortedUids = entityMap.sortedUids!.filter(
                (uid) => !entityUpdate.deletedEntities!.includes(uid)
            );
        }

        while (reader.canRead()) {
            const entityMapId = reader.readUint32();
            const entityMap = this.entityMaps.find((e) => e.id === entityMapId);

            if (entityMap === undefined || entityMap.sortedUids === undefined)
                return entityUpdate;

            let absentEntitiesFlags: number[] = [];
            for (
                let i = 0;
                i < Math.floor((entityMap.sortedUids.length + 7) / 8);
                ++i
            ) {
                absentEntitiesFlags.push(reader.readUint8());
            }

            for (let i = 0; i < entityMap.sortedUids.length; ++i) {
                const uid = entityMap.sortedUids[i];

                if (
                    (absentEntitiesFlags[Math.floor(i / 8)] & (1 << i % 8)) !==
                    0
                ) {
                    continue;
                }

                let updatedEntityFlags: number[] = [];
                for (
                    let j = 0;
                    j < Math.ceil(entityMap.attributes!.length / 8);
                    ++j
                ) {
                    updatedEntityFlags.push(reader.readUint8());
                }

                let entityTick = this.entityList.get(uid)!.tick!;
                for (let j = 0; j < entityMap.attributes!.length; ++j) {
                    const attribute = entityMap.attributes![j];
                    if (updatedEntityFlags[Math.floor(j / 8)] & (1 << j % 8)) {
                        const value = this.decodeEntityMapAttribute(
                            reader,
                            attribute.type!
                        );

                        const key = tickFieldMap.get(attribute.nameHash!)!;
                        if (key !== undefined) {
                            entityTick[key] = value;
                        } else {
                            entityTick[attribute.nameHash?.toString()!] = value;
                        }
                    }
                }
            }
        }

        return entityUpdate;
    }

    public decodeRpc(def: Rpc, data: Uint8Array) {
        const reader = new BinaryReader(data, 5);
        let obj = {};

        const rpc = this.rpcMapping.Rpcs.find(
            (r) => r.NameHash === def.nameHash
        );
        if (rpc === undefined) return undefined;

        if (rpc.IsArray) {
            return undefined;
        } else {
            for (const param of def.parameters!) {
                const match = rpc.Parameters.find(
                    (p) => p.NameHash === param.nameHash
                );

                const fieldName =
                    match !== undefined && match.FieldName !== null
                        ? match.FieldName
                        : `P_0x${param.nameHash!.toString(16)}`;

                let value: any;

                switch (param.type!) {
                    case ParameterType.Uint32: {
                        value = reader.readUint32();
                        break;
                    }
                    case ParameterType.Int32: {
                        value = reader.readInt32();
                        break;
                    }
                    case ParameterType.Float: {
                        value = reader.readFloat();
                        break;
                    }
                    case ParameterType.String: {
                        value = reader.readString();
                        break;
                    }
                    case ParameterType.Uint64: {
                        value = reader.readUint64();
                        break;
                    }
                    case ParameterType.Int64: {
                        value = reader.readInt64();
                        break;
                    }
                    case ParameterType.Uint16: {
                        value = reader.readUint16();
                        break;
                    }
                    case ParameterType.Int16: {
                        value = reader.readInt16();
                        break;
                    }
                    case ParameterType.Uint8: {
                        value = reader.readUint8();
                        break;
                    }
                    case ParameterType.Int8: {
                        value = reader.readInt8();
                        break;
                    }
                    case ParameterType.VectorUint8: {
                        value = reader.readUint8Vector2();
                        break;
                    }
                    case ParameterType.CompressedString: {
                        value = reader.readCompressedString();
                        break;
                    }
                }

                if (match !== undefined) {
                    obj[fieldName] = value;
                    if (match.Key !== null) obj[fieldName] ^= match.Key;
                    if (match.Type === ParameterType.Float)
                        obj[fieldName] /= 100;
                }
            }

            return { name: rpc.ClassName, data: obj };
        }
    }

    private encodeRpcParams(
        rpc: DumpedRpc,
        def: Rpc,
        writer: BinaryWriter,
        data: object
    ) {
        for (const param of def.parameters!) {
            const match = rpc.Parameters.find(
                (p) => param.nameHash === p.NameHash
            );

            if (!match) {
                writer.writeUint8(0);
            } else {
                const fieldName =
                    match.FieldName !== null
                        ? match.FieldName
                        : `P_0x${match.NameHash.toString(16)}`;

                let paramData = data[fieldName];

                if (match.Key !== null) paramData ^= match.Key;

                switch (match.Type) {
                    case ParameterType.Uint32: {
                        writer.writeUint32(paramData);
                        break;
                    }
                    case ParameterType.Int32: {
                        writer.writeInt32(paramData);
                        break;
                    }
                    case ParameterType.Float: {
                        writer.writeFloat(paramData);
                        break;
                    }
                    case ParameterType.String: {
                        writer.writeString(paramData);
                        break;
                    }
                    case ParameterType.Uint64: {
                        writer.writeUint64(paramData);
                        break;
                    }
                    case ParameterType.Int64: {
                        writer.writeInt64(paramData);
                        break;
                    }
                    case ParameterType.Uint16: {
                        writer.writeUint16(paramData);
                        break;
                    }
                    case ParameterType.Int16: {
                        writer.writeInt16(paramData);
                        break;
                    }
                    case ParameterType.Uint8: {
                        writer.writeUint8(paramData);
                        break;
                    }
                    case ParameterType.Int8: {
                        writer.writeInt8(paramData);
                        break;
                    }
                    case ParameterType.VectorUint8: {
                        writer.writeUint8Vector2(paramData);
                        break;
                    }
                }
            }
        }
    }

    public encodeRpc(name: string, data: object | object[]) {
        const writer = new BinaryWriter(0);

        const rpc = this.rpcMapping.Rpcs.find((r) => r.ClassName === name);
        if (rpc === undefined) return undefined;

        const def = this.enterWorldResponse.rpcs!.find(
            (r) => r.nameHash === rpc.NameHash
        );
        if (def === undefined) return undefined;

        writer.writeUint8(9);
        writer.writeUint32(def.index!);

        if (rpc.IsArray) {
            const dataArray = data as object[];
            writer.writeUint16(dataArray.length);
            for (const obj of dataArray) {
                this.encodeRpcParams(rpc, def, writer, obj);
            }
        } else {
            this.encodeRpcParams(rpc, def, writer, data);
        }

        return this.cryptRpc(new Uint8Array(writer.view.buffer));
    }
}

interface DumpedRpcParam {
    InternalIndex: number;
    Key: number | null;
    NameHash: number;
    Offset: number;
    Type: number;
    XFieldName: string | null;
    FieldName: string | null;
}

interface DumpedRpc {
    IsArray: boolean;
    NameHash: number;
    Parameters: DumpedRpcParam[];
    XClassName: string;
    XParentName: string;
    ClassName: string | null;
    ParentName: string;
}

interface DumpedData {
    Version: number;
    Platform: string;
    Rpcs: DumpedRpc[];
}

const tickFieldMap = new Map<number, string>([
    [3965757274, "Name"],
    [2045070744, "Position"],
    [2112680891, "Scale"],
    [1899079302, "EntityClass"],
    [3370100680, "ModelHash"],
    [338163296, "Yaw"],
    [2038511229, "InterpolatedYaw"],
    [396231043, "AimingYaw"],
    [2232061803, "Health"],
    [3411739057, "MaxHealth"],
    [1658281879, "Energy"],
    [2837959133, "MaxEnergy"],
    [664883256, "ReconnectSecret"],
    [2228735555, "Score"],
    [1998601136, "Armor"],
    [537809156, "SpeedAttribute"],
    [1166125470, "Damage"],
    [463881754, "AvailableSkillPoints"],
    [1419758453, "CollisionRadius"],
    [2789835959, "Width"],
    [4139697398, "Height"],
    [164904981, "Level"],
    [2065533638, "Kills"],
    [487111411, "Dead"],
    [1776350289, "TimeAlive"],
    [1168516394, "EntityMap"],
    [1134913306, "NextPooledTick"],
    [3940594818, "deathTick"],
    [2460616447, "firingTick"],
    [1325424963, "firingSequence"],
    [2883383757, "lastDamagedTick"],
    [129999719, "equippedCategoryId"],
    [1506661530, "equippedDataIndex"],
    [3284448976, "equippedTier"],
    [2076321484, "equippedInventorySlot"],
    [1364116198, "equippedSkinId"],
    [3044274584, "shield"],
    [4223951838, "maxShield"],
    [9937773, "healthDamageTaken"],
    [3707014400, "shieldDamageTaken"],
    [1804627392, "effect"],
    [2650249996, "knockDowns"],
    [1205522264, "currentAmmo"],
    [1767079171, "maxAmmo"],
    [1312790758, "smallAmmo"],
    [4117515090, "mediumAmmo"],
    [3527174458, "largeAmmo"],
    [752369509, "shotgunAmmo"],
    [2516899740, "wood"],
    [4272078913, "startChargingTick"],
    [3740327455, "startChargeUpTick"],
    [1657309942, "reloadStartedTick"],
    [4095913789, "reloadEndsTick"],
    [2391951737, "actionStartedTick"],
    [3013078650, "actionEndsTick"],
    [1854863057, "cockingMsRemaining"],
    [4081874656, "canParachute"],
    [1987892684, "parachuteStartedTick"],
    [2426740830, "parachuteMsRemaining"],
    [34162050, "isFreefalling"],
    [1918353449, "emoteIndex"],
    [3821095497, "emoteIndex2"],
    [3239833222, "emoteTick"],
    [570200045, "parachuteId"],
    [957099820, "bodyId"],
    [2724486410, "backpackId"],
    [4127365483, "fistSkinId"],
    [2948797259, "spectatingUid"],
    [1918570631, "spectateCount"],
    [2666157490, "partyId"],
    [1803613228, "partyColor"],
    [2950326362, "reviveStartedTick"],
    [1859733209, "reviveEndsTick"],
    [1553612668, "isKnockedDown"],
    [918024898, "knockedDownHealth"],
    [3724070810, "knockedDownMaxHealth"],
    [910088174, "isOnFire"],
    [3980301664, "isPoisoned"],
    [2173100889, "isSlowed"],
    [1069949249, "isHealing"],
    [1004238105, "isInWater"],
    [728513717, "isInBuildingMode"],
    [4223896640, "zombieKills"],
    [1349887677, "movementSpeedAffinityRocks"],
    [139502709, "defenseAffinityRocks"],
    [733149254, "bulletDamageAffinityRocks"],
    [1445646640, "bulletSpeedAffinityRocks"],
    [2256189882, "portalEnterTick"],
    [1779994739, "isGrappling"],
    [3115359844, "isVip"],
    [444524105, "isBoosted"],
    [4209796065, "lastBulletDataIndex"],
    [3076225077, "lastBulletLifetimePercent"],
    [2653271241, "grapplingHookPosition"],
    [1775539923, "vehicleUid"],
    [1184607771, "vehicleSlot"],
    [2034799789, "equippedModifierIndex"],
    [3257708849, "obtainableUids"],
    [2096278210, "interactableUids"],
    [485783130, "visibleBuildingUids"],
    [471584441, "dataIndex"],
    [441901997, "collisionUid"],
    [2729366668, "ownerUid"],
    [3886314514, "trailId"],
    [3423242791, "trailColorId"],
    [2549878347, "creationTick"],
    [2089316765, "stuckAtTick"],
    [2636873287, "effectiveLifetimeMs"],
    [3540988168, "categoryId"],
    [124913137, "tier"],
    [3866926138, "quantity"],
    [2240057735, "skinId"],
    [3707506636, "modifierIndex"],
    [2900975594, "weaponKills"],
    [145240268, "currentCircleRadius"],
    [1245424964, "nextCircleRadius"],
    [2941477767, "lastCircleRadius"],
    [3318715651, "currentCirclePosition"],
    [3095156091, "nextCirclePosition"],
    [3256293950, "lastCirclePosition"],
    [291542999, "currentCircleTick"],
    [1489880305, "openDoorIds"],
    [956693851, "openDoorDirections"],
    [2730579844, "brokenWindowIds"],
    [1574999092, "sprayIndex"],
    [2201028498, "airDropLandTick"],
    [791445081, "vehicleOccupants"],
]);
