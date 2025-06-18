import { sha1 } from "js-sha1";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BinaryReader } from "../utility/reader";
import { BinaryWriter } from "../utility/writer";
import {
    AttributeType,
    EnterWorldResponse,
    EnterWorldRequest,
    EntityMap,
    EntityMapAttribute,
    Rpc,
    RpcParameter,
    NetworkEntity,
    EntityUpdate,
    ParameterType,
    PacketId,
} from "../types/network";

export class Codec {
    private rpcKey = new Uint8Array(8);
    public entityMaps: EntityMap[] = [];
    public enterWorldResponse: EnterWorldResponse = {};
    public readonly rpcMapping: DumpedData;
    public readonly entityList = new Map<number, NetworkEntity>();

    public constructor(path: string) {
        this.rpcMapping = JSON.parse(
            readFileSync(join(__dirname, "../../", path), {
                encoding: "utf-8",
            })
        );
    }

    public computeRpcKey(codecVersion: number, targetUrl: Uint8Array, proofOfWork: Uint8Array) {
        for (let i = 0; i < proofOfWork.length; ++i) this.rpcKey[i % this.rpcKey.length] ^= proofOfWork[i];
        for (let i = 0; i < this.rpcKey.length; ++i) this.rpcKey[i] ^= codecVersion;
        for (let i = 0; i < targetUrl.length; ++i) this.rpcKey[i % this.rpcKey.length] ^= targetUrl[i];
    }

    private applyCommonMask(buf: Buffer): void {
        buf[4] &= 253;
        buf[2] &= 254;
        buf[5] &= 223;
        buf[8] |= 32;
        buf[9] &= 251;
    }

    public generateProofOfWork(
        endpoint: string,
        platform: string = "Android",
        difficulty: number = 13,
        size: number = 24
    ): Buffer<ArrayBuffer> {
        const config = platformConfigs[platform];
        const pathBytes = Buffer.from("/" + endpoint, "utf8");
        const powBuffer = Buffer.alloc(size + pathBytes.length);
        powBuffer.set(pathBytes, size);

        let state = Math.random() * 0xffffffff || Math.floor(Math.random() * Math.pow(2, 32));

        while (true) {
            for (let i = 0; i < size; ++i) {
                state ^= state << 13;
                state ^= state >>> 17;
                state ^= state << 5;
                powBuffer[i] = state;
            }

            config.logic(powBuffer);
            this.applyCommonMask(powBuffer);

            const hash = sha1.create();
            Object.assign(hash, config.hashState);
            hash.update(powBuffer);

            const digest = Buffer.from(hash.digest()).swap32();

            let d = 0;
            while (true) {
                if ((digest[Math.floor(d / 8)] & (128 >> d % 8)) == 0) break;
                if (++d === difficulty) return powBuffer.subarray(0, size);
            }
        }
    }

    public validateProofOfWork(
        proofOfWork: Uint8Array,
        endpoint: string,
        difficulty: number = 13,
        size: number = 24
    ): { valid: boolean; platform: string | null } {
        const powBuffer = Buffer.from(proofOfWork);
        const pathBytes = Buffer.from("/" + endpoint, "utf8");

        for (const [platformName, { hashState, logic }] of Object.entries(platformConfigs)) {
            const fullBuffer = Buffer.alloc(size + pathBytes.length);
            powBuffer.copy(fullBuffer, 0, 0, size);
            pathBytes.copy(fullBuffer, size);

            logic(fullBuffer);
            this.applyCommonMask(fullBuffer);

            const hash = sha1.create();
            Object.assign(hash, hashState);
            hash.update(fullBuffer);

            const digest = Buffer.from(hash.digest()).swap32();

            let d = 0;
            while (true) {
                if ((digest[Math.floor(d / 8)] & (128 >> d % 8)) == 0) break;
                if (++d === difficulty) return { valid: true, platform: platformName };
            }
        }

        return { valid: false, platform: null };
    }

    public cryptRpc(data: Uint8Array): Uint8Array {
        let rpc = new Uint8Array(data);

        for (let i = 1; i < rpc.length; ++i) rpc[i] ^= this.rpcKey[i % this.rpcKey.length];

        return rpc;
    }

    private decodeEntityMapAttribute(reader: BinaryReader, type: AttributeType) {
        switch (type) {
            case AttributeType.Uint32:
                return reader.readUint32();
            case AttributeType.Int32:
                return reader.readInt32();
            case AttributeType.Float:
                const v = reader.readFloat();
                return v === undefined ? undefined : v / 100;
            case AttributeType.String:
                return reader.readString();
            case AttributeType.Vector2: {
                const v = reader.readVector2();
                if (v === undefined) return undefined;
                v.x /= 100;
                v.y /= -100;
                return v;
            }
            case AttributeType.ArrayVector2: {
                const v = reader.readArrayVector2();
                if (v === undefined) return undefined;
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

    private encodeEntityMapAttribute(writer: BinaryWriter, type: AttributeType | undefined, value: any) {
        switch (type) {
            case AttributeType.Uint32:
                writer.writeUint32(value || 0);
                break;
            case AttributeType.Int32:
                writer.writeInt32(value || 0);
                break;
            case AttributeType.Float:
                writer.writeFloat(value !== null ? Math.round(value * 100) : 0);
                break;
            case AttributeType.String:
                writer.writeString(value || "");
                break;
            case AttributeType.Vector2:
                if (value) {
                    writer.writeVector2({
                        x: Math.round(value.x * 100),
                        y: Math.round(value.y * -100),
                    });
                } else {
                    writer.writeVector2({ x: 0, y: 0 });
                }
                break;
            case AttributeType.ArrayVector2:
                if (Array.isArray(value)) {
                    const vectors = value.map((v) => ({
                        x: Math.round(v.x * 100),
                        y: Math.round(v.y * -100),
                    }));
                    writer.writeArrayVector2(vectors);
                } else {
                    writer.writeArrayVector2([]);
                }
                break;
            case AttributeType.ArrayUint32:
                writer.writeArrayUint32(value || []);
                break;
            case AttributeType.Uint16:
                writer.writeUint16(value || 0);
                break;
            case AttributeType.Uint8:
                writer.writeUint8(value || 0);
                break;
            case AttributeType.Int16:
                writer.writeInt16(value || 0);
                break;
            case AttributeType.Int8:
                writer.writeInt8(value || 0);
                break;
            case AttributeType.ArrayInt32:
                writer.writeArrayInt32(value || []);
                break;
            case AttributeType.ArrayUint8:
                writer.writeArrayUint8(value || []);
                break;
            default:
                writer.writeUint32(0);
        }
    }

    public getAttributeName(nameHash: number) {
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
        return tickFieldMap.get(nameHash) ?? `A_0x${nameHash.toString(16)}`;
    }

    private encodeRpcParams(rpc: DumpedRpc, def: Rpc, writer: BinaryWriter, data: object) {
        for (const param of def.parameters!) {
            const match = rpc.Parameters.find((p) => param.nameHash === p.NameHash);

            if (!match) {
                writer.writeUint8(0);
            } else {
                const fieldName = match.FieldName !== null ? match.FieldName : `P_0x${match.NameHash.toString(16)}`;

                const mask = 2 ** paramTypeSizeMap[match.Type] - 1;
                let paramData = data[fieldName];

                switch (match.Type) {
                    case ParameterType.Float: {
                        paramData *= 100;
                        break;
                    }
                    case ParameterType.Int16: {
                        paramData = paramData >>> 0;
                        if (paramData < 0x7fff) paramData += 0x10000;
                        break;
                    }
                    case ParameterType.Int8: {
                        paramData = paramData >>> 0;
                        if (paramData < 0x7f) paramData += 0x100;
                        break;
                    }
                }

                if (match.Key !== null) paramData = (paramData ^ match.Key) & mask;

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
                        writer.writeUint16LE(paramData);
                        break;
                    }
                    case ParameterType.Int16: {
                        writer.writeInt16LE(paramData);
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
                    case ParameterType.CompressedString: {
                        writer.writeCompressedString(paramData);
                        break;
                    }
                }
            }
        }
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

        const entityMapCount = reader.readUint32()!;
        enterWorldResponse.entities = [];
        for (let i = 0; i < entityMapCount; ++i) {
            let entityMap: EntityMap = {};
            entityMap.id = reader.readUint32();
            entityMap.attributes = [];
            entityMap.sortedUids = [];
            entityMap.defaultTick = {};

            const attributesCount = reader.readUint32()!;
            for (let j = 0; j < attributesCount; ++j) {
                let entityMapAttribute: EntityMapAttribute = {};
                entityMapAttribute.nameHash = reader.readUint32()!;
                entityMapAttribute.type = reader.readUint32()!;

                entityMap.defaultTick[this.getAttributeName(entityMapAttribute.nameHash)] =
                    this.decodeEntityMapAttribute(reader, entityMapAttribute.type);

                entityMap.attributes.push(entityMapAttribute);
            }

            enterWorldResponse.entities.push(entityMap);
        }

        const rpcCount = reader.readUint32()!;
        enterWorldResponse.rpcs = [];
        for (let i = 0; i < rpcCount; ++i) {
            let rpc: Rpc = {};
            rpc.index = i;
            rpc.nameHash = reader.readUint32();

            const parameterCount = reader.readUint8()!;
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

        if (reader.canRead()) enterWorldResponse.udpCookie = reader.readUint32();

        if (reader.canRead()) enterWorldResponse.udpPort = reader.readUint32();

        this.entityMaps = enterWorldResponse.entities;

        return enterWorldResponse;
    }

    public encodeEnterWorldResponse(response: EnterWorldResponse): Uint8Array {
        const writer = new BinaryWriter(0);

        writer.writeUint8(PacketId.EnterWorld);
        writer.writeUint32(response.version!);
        writer.writeUint32(response.allowed!);
        writer.writeUint32(response.uid!);
        writer.writeUint32(response.startingTick!);
        writer.writeUint32(response.tickRate!);
        writer.writeUint32(response.effectiveTickRate!);
        writer.writeUint32(response.players!);
        writer.writeUint32(response.maxPlayers!);
        writer.writeUint32(response.chatChannel!);
        writer.writeString(response.effectiveDisplayName!);
        writer.writeInt32(response.x1!);
        writer.writeInt32(response.y1!);
        writer.writeInt32(response.x2!);
        writer.writeInt32(response.y2!);

        writer.writeUint32(response.entities!.length);
        for (const entity of response.entities!) {
            writer.writeUint32(entity.id!);

            writer.writeUint32(entity.attributes!.length);
            for (const attribute of entity.attributes!) {
                writer.writeUint32(attribute.nameHash!);
                writer.writeUint32(attribute.type!);

                this.encodeEntityMapAttribute(
                    writer,
                    attribute.type!,
                    entity.defaultTick![this.getAttributeName(attribute.nameHash!)]
                );
            }
        }

        writer.writeUint32(response.rpcs!.length);
        for (const rpc of response.rpcs!) {
            writer.writeUint32(rpc.nameHash!);
            writer.writeUint8(rpc.parameters!.length);
            writer.writeUint8(rpc.isArray ? 1 : 0);
            for (const param of rpc.parameters!) {
                writer.writeUint32(param.nameHash!);
                writer.writeUint8(param.type!);
            }
        }

        if (response.mode !== undefined) writer.writeString(response.mode);
        if (response.map !== undefined) writer.writeString(response.map);
        if (response.udpCookie !== undefined) writer.writeUint32(response.udpCookie);
        if (response.udpPort !== undefined) writer.writeUint32(response.udpPort);

        return new Uint8Array(writer.view.buffer.slice(0, writer.offset));
    }

    public decodeEntityUpdate(data: Uint8Array): EntityUpdate {
        const reader = new BinaryReader(data, 1);

        const entityUpdate: EntityUpdate = {};
        entityUpdate.createdEntities = [];
        entityUpdate.deletedEntities = [];
        entityUpdate.updatedEntities = new Map();
        entityUpdate.tick = reader.readUint32();

        const deletedEntitiesCount = reader.readInt8();
        if (deletedEntitiesCount === undefined) return entityUpdate;

        for (let i = 0; i < deletedEntitiesCount; ++i) {
            const uid = reader.readUint32();
            if (uid === undefined) return entityUpdate;

            entityUpdate.deletedEntities.push(uid);
            this.entityList.delete(uid);
        }

        const entityMapsCount = reader.readInt8();
        if (entityMapsCount === undefined) return entityUpdate;
        for (let i = 0; i < entityMapsCount; ++i) {
            const brandNewEntitiesCount = reader.readInt8();
            if (brandNewEntitiesCount === undefined) return entityUpdate;

            const entityMapId = reader.readUint32();
            if (entityMapId === undefined) return entityUpdate;

            const entityMap = this.entityMaps.find((e) => e.id === entityMapId);
            if (entityMap === undefined) return entityUpdate;

            for (let j = 0; j < brandNewEntitiesCount; ++j) {
                const uid = reader.readUint32();
                if (uid === undefined) return entityUpdate;

                entityMap.sortedUids!.push(uid);
                this.entityList.set(uid, {
                    uid: uid,
                    type: entityMapId,
                    tick: structuredClone(entityMap.defaultTick),
                });
                entityUpdate.createdEntities.push(uid);
            }
            entityMap.sortedUids!.sort((a, b) => a - b);
        }

        for (const entityMap of this.entityMaps) {
            entityMap.sortedUids = entityMap.sortedUids!.filter((uid) => !entityUpdate.deletedEntities!.includes(uid));
        }

        while (reader.canRead()) {
            const entityMapId = reader.readUint32();
            if (entityMapId === undefined) return entityUpdate;

            const entityMap = this.entityMaps.find((e) => e.id === entityMapId);
            if (entityMap === undefined) return entityUpdate;

            const absentEntitiesFlags: number[] = [];
            for (let i = 0; i < Math.floor((entityMap.sortedUids!.length + 7) / 8); ++i) {
                const flag = reader.readUint8();
                if (flag === undefined) return entityUpdate;

                absentEntitiesFlags.push(flag);
            }

            for (let i = 0; i < entityMap.sortedUids!.length; ++i) {
                const uid = entityMap.sortedUids![i];

                if ((absentEntitiesFlags[Math.floor(i / 8)] & (1 << i % 8)) !== 0) {
                    continue;
                }

                const updatedEntityFlags: number[] = [];
                for (let j = 0; j < Math.ceil(entityMap.attributes!.length / 8); ++j) {
                    const flag = reader.readUint8();
                    if (flag === undefined) return entityUpdate;

                    updatedEntityFlags.push(flag);
                }

                const updatedAttributes: string[] = [];
                const tick = this.entityList.get(uid)!.tick!;
                for (let j = 0; j < entityMap.attributes!.length; ++j) {
                    const attribute = entityMap.attributes![j];
                    if (updatedEntityFlags[Math.floor(j / 8)] & (1 << j % 8)) {
                        const value = this.decodeEntityMapAttribute(reader, attribute.type!);
                        if (value === undefined) return entityUpdate;

                        const attributeName = this.getAttributeName(attribute.nameHash!);
                        tick[attributeName] = value;
                        updatedAttributes.push(attributeName);
                    }
                }
                entityUpdate.updatedEntities.set(uid, updatedAttributes);
            }
        }

        return entityUpdate;
    }

    public encodeEntityUpdate(entityUpdate: EntityUpdate): Uint8Array {
        const writer = new BinaryWriter(0);

        writer.writeUint8(PacketId.EntityUpdate);
        writer.writeUint32(entityUpdate.tick!);

        writer.writeInt8(entityUpdate.deletedEntities!.length);
        for (const uid of entityUpdate.deletedEntities!) writer.writeUint32(uid);

        const entityMaps = this.entityMaps.filter((map) =>
            entityUpdate.createdEntities?.some((uid) => map.sortedUids?.includes(uid))
        );

        writer.writeInt8(entityMaps.length);

        for (const entityMap of entityMaps) {
            const brandNewEntities = entityUpdate.createdEntities!.filter((uid) => entityMap.sortedUids?.includes(uid));
            writer.writeInt8(brandNewEntities.length);
            writer.writeUint32(entityMap.id!);
            for (const uid of brandNewEntities) writer.writeUint32(uid);
        }

        for (const entityMap of this.entityMaps) {
            const filteredUids = entityMap.sortedUids!.filter((uid) => !entityUpdate.deletedEntities!.includes(uid));
            if (filteredUids.length === 0) continue;

            writer.writeUint32(entityMap.id!);

            for (let i = 0; i < Math.ceil(filteredUids.length / 8); ++i) {
                let byte = 0;
                for (let j = 0; j < 8; j++) {
                    const index = i * 8 + j;
                    if (index >= filteredUids.length) break;
                    const uid = filteredUids[index];
                    if (!entityUpdate.updatedEntities?.has(uid)) byte |= 1 << j;
                }
                writer.writeUint8(byte);
            }

            for (const uid of filteredUids) {
                const entity = this.entityList.get(uid);
                if (entity === undefined) continue;

                const updatedAttributes = entityUpdate.updatedEntities!.get(uid);
                if (updatedAttributes === undefined) continue;

                const updatedFlags: number[] = Array(Math.ceil(entityMap.attributes!.length / 8)).fill(0);

                const updatedValues: { type: number; value: any }[] = [];

                for (let i = 0; i < entityMap.attributes!.length; ++i) {
                    const attribute = entityMap.attributes![i];
                    const attributeName = this.getAttributeName(attribute.nameHash!);

                    if (updatedAttributes.includes(attributeName)) {
                        updatedFlags[Math.floor(i / 8)] |= 1 << i % 8;

                        updatedValues.push({
                            type: attribute.type!,
                            value: entity.tick![attributeName],
                        });
                    }
                }

                if (!updatedFlags.some((f) => f !== 0)) continue;

                for (const flag of updatedFlags) writer.writeUint8(flag);

                for (const { type, value } of updatedValues) this.encodeEntityMapAttribute(writer, type, value);
            }
        }

        return new Uint8Array(writer.view.buffer.slice(0, writer.offset));
    }

    public decodeEnterWorldRequest(data: Uint8Array): EnterWorldRequest | undefined {
        const reader = new BinaryReader(data, 1);

        const displayName = reader.readString();
        if (displayName === undefined) return undefined;

        const version = reader.readUint32();
        if (version === undefined) return undefined;

        const pow = reader.readArrayUint8();
        if (pow === undefined) return undefined;

        const proofOfWork = new Uint8Array(pow);

        return { displayName, version, proofOfWork };
    }

    public encodeEnterWorldRequest(request: EnterWorldRequest): Uint8Array {
        const writer = new BinaryWriter(0);
        writer.writeUint8(PacketId.EnterWorld);
        writer.writeString(request.displayName);
        writer.writeUint32(request.version);
        writer.writeArrayUint8(request.proofOfWork);
        return new Uint8Array(writer.view.buffer.slice(0, writer.offset));
    }

    public decodeRpc(def: Rpc, data: Uint8Array) {
        const reader = new BinaryReader(data, 5);
        let obj = {};

        const rpc = this.rpcMapping.Rpcs.find((r) => r.NameHash === def.nameHash);
        if (rpc === undefined) return undefined;

        if (rpc.IsArray) {
            return undefined;
        } else {
            for (const param of def.parameters!) {
                const match = rpc.Parameters.find((p) => p.NameHash === param.nameHash);

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

                if (value === undefined) return undefined;

                if (match !== undefined) {
                    const mask = 2 ** paramTypeSizeMap[match.Type] - 1;
                    if (match.Type === ParameterType.Uint16) value = swap16(value & mask);
                    if (match.Type === ParameterType.Int16) value = swap16(value & mask);

                    if (match.Key !== null) value = (value ^ match.Key) & mask;

                    switch (match.Type) {
                        case ParameterType.Float: {
                            value /= 100;
                            break;
                        }
                        case ParameterType.Int16: {
                            value = value >>> 0;
                            if (value > 0x7fff) value -= 0x10000;
                            break;
                        }
                        case ParameterType.Int8: {
                            value = value >>> 0;
                            if (value > 0x7f) value -= 0x100;
                            break;
                        }
                    }
                    obj[fieldName] = value;
                }
            }

            return { name: rpc.ClassName, data: obj };
        }
    }

    public encodeRpc(name: string, data: object | object[]) {
        const writer = new BinaryWriter(0);

        const rpc = this.rpcMapping.Rpcs.find((r) => r.ClassName === name);
        if (rpc === undefined) return undefined;

        const def = this.enterWorldResponse.rpcs!.find((r) => r.nameHash === rpc.NameHash);
        if (def === undefined) return undefined;

        writer.writeUint8(9);
        writer.writeUint32(def.index!);

        if (rpc.IsArray) {
            const dataArray = data as object[];
            writer.writeUint16LE(dataArray.length);
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
    Codec: number;
    Platform: string;
    Rpcs: DumpedRpc[];
}

function swap16(value: number) {
    return ((value & 0xff) << 8) | ((value >> 8) & 0xff);
}

const paramTypeSizeMap = {
    [ParameterType.Uint32]: 32,
    [ParameterType.Int32]: 32,
    [ParameterType.Float]: 32,
    [ParameterType.String]: -1,
    [ParameterType.Uint64]: 64,
    [ParameterType.Int64]: 64,
    [ParameterType.Uint16]: 16,
    [ParameterType.Int16]: 16,
    [ParameterType.Uint8]: 8,
    [ParameterType.Int8]: 8,
    [ParameterType.VectorUint8]: -1,
    [ParameterType.CompressedString]: -1,
};

const platformConfigs = {
    Windows: {
        hashState: {
            h0: 0xcde4bac7,
            h1: 0xb6217224,
            h2: 0x872a5994,
            h3: 0xcf538f47,
            h4: 0xec8dc5a1,
        },
        logic(buf: Buffer) {
            buf[7] |= 8;
            buf[6] &= 239;
            buf[3] &= 127;
        },
    },
    Web: {
        hashState: {
            h0: 0x04c82ad0,
            h1: 0x2beacb85,
            h2: 0x4ccc8e6b,
            h3: 0x849ad64a,
            h4: 0x57ada298,
        },
        logic(buf: Buffer) {
            buf[7] &= 247;
            buf[6] |= 16;
            buf[3] &= 127;
        },
    },
    Android: {
        hashState: {
            h0: 0xa9c9f023,
            h1: 0x14f071e7,
            h2: 0xc2d99914,
            h3: 0x8e8dda42,
            h4: 0xb8acc665,
        },
        logic(buf: Buffer) {
            buf[7] &= 247;
            buf[6] &= 239;
            buf[3] |= 128;
        },
    },
};
