"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Codec = void 0;
const Reader_1 = require("../../utility/Reader");
const Writer_1 = require("../../utility/Writer");
const Packets_1 = require("../../types/Packets");
const ZRCrypto_1 = require("./ZRCrypto");
class Codec {
    constructor(rpcMapping) {
        this.crypto = new ZRCrypto_1.ZRCrypto();
        this.entityMaps = [];
        this.enterWorldResponse = {};
        this.entityList = new Map();
        this.fragments = new Map();
        this.highestTickSeen = 0;
        this.rpcMapping = rpcMapping;
    }
    decodeEntityMapAttribute(reader, type) {
        switch (type) {
            case Packets_1.AttributeType.Uint32:
                return reader.u32();
            case Packets_1.AttributeType.Int32:
                return reader.i32();
            case Packets_1.AttributeType.Float:
                const value = reader.i32();
                if (value === undefined) {
                    return undefined;
                }
                return value / 100;
            case Packets_1.AttributeType.String:
                return reader.string();
            case Packets_1.AttributeType.Vector2: {
                const vector = reader.i32vec2();
                if (vector === undefined) {
                    return undefined;
                }
                vector.x /= 100;
                vector.y /= -100;
                return vector;
            }
            case Packets_1.AttributeType.ArrayVector2: {
                const array = reader.i32vec2arr32();
                if (array === undefined) {
                    return undefined;
                }
                for (let vector of array) {
                    vector.x /= 100;
                    vector.y /= -100;
                }
                return array;
            }
            case Packets_1.AttributeType.ArrayUint32:
                return reader.u32arr32();
            case Packets_1.AttributeType.Uint16:
                return reader.u16(false);
            case Packets_1.AttributeType.Uint8:
                return reader.u8();
            case Packets_1.AttributeType.Int16:
                return reader.i16(false);
            case Packets_1.AttributeType.Int8:
                return reader.i8();
            case Packets_1.AttributeType.ArrayInt32:
                return reader.i32arr32();
            case Packets_1.AttributeType.ArrayUint8:
                return reader.u8arr8();
        }
        return undefined;
    }
    encodeEntityMapAttribute(writer, type, value) {
        switch (type) {
            case Packets_1.AttributeType.Uint32:
                writer.u32(value || 0);
                break;
            case Packets_1.AttributeType.Int32:
                writer.i32(value || 0);
                break;
            case Packets_1.AttributeType.Float:
                writer.i32(value !== null ? Math.round(value * 100) : 0);
                break;
            case Packets_1.AttributeType.String:
                writer.string(value || "");
                break;
            case Packets_1.AttributeType.Vector2:
                if (value) {
                    writer.i32vec2({
                        x: Math.round(value.x * 100),
                        y: Math.round(value.y * -100),
                    });
                }
                else {
                    writer.i32vec2({ x: 0, y: 0 });
                }
                break;
            case Packets_1.AttributeType.ArrayVector2:
                if (Array.isArray(value)) {
                    const vectors = value.map((v) => ({
                        x: Math.round(v.x * 100),
                        y: Math.round(v.y * -100),
                    }));
                    writer.i32vec2arr32(vectors);
                }
                else {
                    writer.i32vec2arr32([]);
                }
                break;
            case Packets_1.AttributeType.ArrayUint32:
                writer.u32arr32(value || []);
                break;
            case Packets_1.AttributeType.Uint16:
                writer.u16(value || 0, false);
                break;
            case Packets_1.AttributeType.Uint8:
                writer.u8(value || 0);
                break;
            case Packets_1.AttributeType.Int16:
                writer.i16(value || 0, false);
                break;
            case Packets_1.AttributeType.Int8:
                writer.i8(value || 0);
                break;
            case Packets_1.AttributeType.ArrayInt32:
                writer.i32arr32(value || []);
                break;
            case Packets_1.AttributeType.ArrayUint8:
                writer.u8arr8(value || []);
                break;
            default:
                writer.u32(0);
        }
    }
    decodeRpcObject(rpc, def, reader) {
        let obj = {};
        for (const param of def.parameters) {
            const match = rpc?.Parameters.find((p) => p.NameHash === param.nameHash);
            const fieldName = match !== undefined && match.FieldName !== null
                ? match.FieldName
                : `P_0x${param.nameHash.toString(16)}`;
            let value;
            switch (param.type) {
                case Packets_1.ParameterType.Uint32: {
                    value = reader.u32();
                    break;
                }
                case Packets_1.ParameterType.Float:
                case Packets_1.ParameterType.Int32: {
                    value = reader.i32();
                    break;
                }
                case Packets_1.ParameterType.String: {
                    value = reader.string();
                    break;
                }
                case Packets_1.ParameterType.Uint64: {
                    value = reader.u64();
                    break;
                }
                case Packets_1.ParameterType.Int64: {
                    value = reader.i64();
                    break;
                }
                case Packets_1.ParameterType.Uint16: {
                    value = reader.u16();
                    break;
                }
                case Packets_1.ParameterType.Int16: {
                    value = reader.i16();
                    break;
                }
                case Packets_1.ParameterType.Uint8: {
                    value = reader.u8();
                    break;
                }
                case Packets_1.ParameterType.Int8: {
                    value = reader.i8();
                    break;
                }
                case Packets_1.ParameterType.VectorUint8: {
                    if (!reader.canRead(5)) {
                        value = reader.u8arr8();
                    }
                    else {
                        value = reader.u8arr32();
                    }
                    break;
                }
                case Packets_1.ParameterType.CompressedString: {
                    value = reader.compressedString();
                    break;
                }
            }
            if (value === undefined) {
                return undefined;
            }
            if (match !== undefined) {
                const mask = 2 ** paramTypeSizeMap[match.Type] - 1;
                if (match.Key !== null) {
                    value = (value ^ match.Key) & mask;
                }
                switch (match.Type) {
                    case Packets_1.ParameterType.Float: {
                        value /= 100;
                        break;
                    }
                    case Packets_1.ParameterType.Int16: {
                        value = value >>> 0;
                        if (value > 0x7fff) {
                            value -= 0x10000;
                        }
                        break;
                    }
                    case Packets_1.ParameterType.Int8: {
                        value = value >>> 0;
                        if (value > 0x7f) {
                            value -= 0x100;
                        }
                        break;
                    }
                }
                obj[fieldName] = value;
            }
        }
        return obj;
    }
    encodeRpcObject(rpc, def, writer, data) {
        for (const param of def.parameters) {
            const match = rpc.Parameters.find((p) => param.nameHash === p.NameHash);
            if (!match) {
                writer.u8(0);
            }
            else {
                const fieldName = match.FieldName !== null ? match.FieldName : `P_0x${match.NameHash.toString(16)}`;
                const bitmask = 2 ** paramTypeSizeMap[match.Type] - 1;
                let paramData = data[fieldName];
                switch (match.Type) {
                    case Packets_1.ParameterType.Float: {
                        paramData *= 100;
                        break;
                    }
                    case Packets_1.ParameterType.Int16: {
                        paramData = paramData >>> 0;
                        if (paramData < 0x7fff) {
                            paramData += 0x10000;
                        }
                        break;
                    }
                    case Packets_1.ParameterType.Int8: {
                        paramData = paramData >>> 0;
                        if (paramData < 0x7f) {
                            paramData += 0x100;
                        }
                        break;
                    }
                }
                if (match.Key !== null) {
                    paramData = (paramData ^ match.Key) & bitmask;
                }
                switch (match.Type) {
                    case Packets_1.ParameterType.Uint32: {
                        writer.u32(paramData);
                        break;
                    }
                    case Packets_1.ParameterType.Int32: {
                        writer.i32(paramData);
                        break;
                    }
                    case Packets_1.ParameterType.Float: {
                        writer.i32(paramData);
                        break;
                    }
                    case Packets_1.ParameterType.String: {
                        writer.string(paramData);
                        break;
                    }
                    case Packets_1.ParameterType.Uint64: {
                        writer.u64(paramData);
                        break;
                    }
                    case Packets_1.ParameterType.Int64: {
                        writer.i64(paramData);
                        break;
                    }
                    case Packets_1.ParameterType.Uint16: {
                        writer.u16(paramData);
                        break;
                    }
                    case Packets_1.ParameterType.Int16: {
                        writer.i16(paramData);
                        break;
                    }
                    case Packets_1.ParameterType.Uint8: {
                        writer.u8(paramData);
                        break;
                    }
                    case Packets_1.ParameterType.Int8: {
                        writer.i8(paramData);
                        break;
                    }
                    case Packets_1.ParameterType.VectorUint8: {
                        if (paramData.length <= 4) {
                            writer.u8arr8(paramData);
                        }
                        else {
                            writer.u8arr32(paramData);
                        }
                        break;
                    }
                    case Packets_1.ParameterType.CompressedString: {
                        writer.compressedString(paramData);
                        break;
                    }
                }
            }
        }
    }
    getAttributeName(nameHash) {
        const tickFieldMap = new Map([
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
    decodeEnterWorldResponse(data) {
        const reader = new Reader_1.BufferReader(data, 1);
        const response = {};
        response.version = reader.u32();
        if (response.version === undefined) {
            return undefined;
        }
        response.allowed = reader.u32();
        if (response.allowed === undefined) {
            return undefined;
        }
        response.uid = reader.u32();
        if (response.uid === undefined) {
            return undefined;
        }
        response.startingTick = reader.u32();
        if (response.startingTick === undefined) {
            return undefined;
        }
        response.tickRate = reader.u32();
        if (response.tickRate === undefined) {
            return undefined;
        }
        response.effectiveTickRate = reader.u32();
        if (response.effectiveTickRate === undefined) {
            return undefined;
        }
        response.players = reader.u32();
        if (response.players === undefined) {
            return undefined;
        }
        response.maxPlayers = reader.u32();
        if (response.maxPlayers === undefined) {
            return undefined;
        }
        response.chatChannel = reader.u32();
        if (response.chatChannel === undefined) {
            return undefined;
        }
        response.effectiveDisplayName = reader.string();
        if (response.effectiveDisplayName === undefined) {
            return undefined;
        }
        response.x1 = reader.i32();
        if (response.x1 === undefined) {
            return undefined;
        }
        response.y1 = reader.i32();
        if (response.y1 === undefined) {
            return undefined;
        }
        response.x2 = reader.i32();
        if (response.x2 === undefined) {
            return undefined;
        }
        response.y2 = reader.i32();
        if (response.y2 === undefined) {
            return undefined;
        }
        const entityMapCount = reader.u32();
        if (entityMapCount === undefined) {
            return undefined;
        }
        response.entities = [];
        for (let i = 0; i < entityMapCount; ++i) {
            let entityMap = {};
            entityMap.id = reader.u32();
            if (entityMap.id === undefined) {
                return undefined;
            }
            entityMap.attributes = [];
            entityMap.sortedUids = [];
            entityMap.defaultTick = {};
            const attributesCount = reader.u32();
            if (attributesCount === undefined) {
                return undefined;
            }
            for (let j = 0; j < attributesCount; ++j) {
                let entityMapAttribute = {};
                entityMapAttribute.nameHash = reader.u32();
                if (entityMapAttribute.nameHash === undefined) {
                    return undefined;
                }
                entityMapAttribute.type = reader.u32();
                if (entityMapAttribute.type === undefined) {
                    return undefined;
                }
                const value = this.decodeEntityMapAttribute(reader, entityMapAttribute.type);
                if (value === undefined) {
                    return undefined;
                }
                entityMap.defaultTick[this.getAttributeName(entityMapAttribute.nameHash)];
                entityMap.attributes.push(entityMapAttribute);
            }
            response.entities.push(entityMap);
        }
        const rpcCount = reader.u32();
        if (rpcCount === undefined) {
            return undefined;
        }
        response.rpcs = [];
        for (let i = 0; i < rpcCount; ++i) {
            let rpc = {};
            rpc.index = i;
            rpc.nameHash = reader.u32();
            if (rpc.nameHash === undefined) {
                return undefined;
            }
            const parameterCount = reader.u8();
            if (parameterCount === undefined) {
                return undefined;
            }
            const isArray = reader.u8();
            if (isArray === undefined) {
                return undefined;
            }
            rpc.isArray = isArray != 0;
            rpc.parameters = [];
            for (let j = 0; j < parameterCount; ++j) {
                let rpcParameter = {};
                rpcParameter.nameHash = reader.u32();
                rpcParameter.type = reader.u8();
                rpcParameter.internalIndex = -1;
                rpc.parameters.push(rpcParameter);
            }
            response.rpcs.push(rpc);
        }
        response.mode = reader.string();
        response.map = reader.string();
        response.udpCookie = reader.u32();
        response.udpPort = reader.u32();
        this.entityMaps = response.entities;
        return response;
    }
    encodeEnterWorldResponse(response) {
        const writer = new Writer_1.BufferWriter(0);
        writer.u8(Packets_1.PacketId.EnterWorld);
        writer.u32(response.version);
        writer.u32(response.allowed);
        writer.u32(response.uid);
        writer.u32(response.startingTick);
        writer.u32(response.tickRate);
        writer.u32(response.effectiveTickRate);
        writer.u32(response.players);
        writer.u32(response.maxPlayers);
        writer.u32(response.chatChannel);
        writer.string(response.effectiveDisplayName);
        writer.i32(response.x1);
        writer.i32(response.y1);
        writer.i32(response.x2);
        writer.i32(response.y2);
        writer.u32(response.entities.length);
        for (const entity of response.entities) {
            writer.u32(entity.id);
            writer.u32(entity.attributes.length);
            for (const attribute of entity.attributes) {
                writer.u32(attribute.nameHash);
                writer.u32(attribute.type);
                this.encodeEntityMapAttribute(writer, attribute.type, entity.defaultTick[this.getAttributeName(attribute.nameHash)]);
            }
        }
        writer.u32(response.rpcs.length);
        for (const rpc of response.rpcs) {
            writer.u32(rpc.nameHash);
            writer.u8(rpc.parameters.length);
            writer.u8(rpc.isArray ? 1 : 0);
            for (const param of rpc.parameters) {
                writer.u32(param.nameHash);
                writer.u8(param.type);
            }
        }
        if (response.mode !== undefined) {
            writer.string(response.mode);
        }
        if (response.map !== undefined) {
            writer.string(response.map);
        }
        if (response.udpCookie !== undefined) {
            writer.u32(response.udpCookie);
        }
        if (response.udpPort !== undefined) {
            writer.u32(response.udpPort);
        }
        return new Uint8Array(writer.view.buffer.slice(0, writer.offset));
    }
    decodeEntityUpdate(data) {
        const reader = new Reader_1.BufferReader(data, 1);
        const entityUpdate = {};
        entityUpdate.createdEntities = [];
        entityUpdate.deletedEntities = [];
        entityUpdate.updatedEntities = new Map();
        entityUpdate.tick = reader.u32();
        if (entityUpdate.tick === undefined) {
            return undefined;
        }
        const deletedEntitiesCount = reader.i8();
        if (deletedEntitiesCount === undefined) {
            return undefined;
        }
        for (let i = 0; i < deletedEntitiesCount; ++i) {
            const uid = reader.u32();
            if (uid === undefined) {
                return undefined;
            }
            entityUpdate.deletedEntities.push(uid);
            this.entityList.delete(uid);
        }
        const entityMapsCount = reader.i8();
        if (entityMapsCount === undefined) {
            return undefined;
        }
        for (let i = 0; i < entityMapsCount; ++i) {
            const newEntitiesCount = reader.i8();
            if (newEntitiesCount === undefined) {
                return undefined;
            }
            const entityMapId = reader.u32();
            if (entityMapId === undefined) {
                return undefined;
            }
            const entityMap = this.entityMaps.find((e) => e.id === entityMapId);
            if (entityMap === undefined) {
                return undefined;
            }
            for (let j = 0; j < newEntitiesCount; ++j) {
                const uid = reader.u32();
                if (uid === undefined) {
                    return undefined;
                }
                entityMap.sortedUids.push(uid);
                this.entityList.set(uid, {
                    uid: uid,
                    type: entityMapId,
                    tick: structuredClone(entityMap.defaultTick),
                });
                entityUpdate.createdEntities.push(uid);
            }
            entityMap.sortedUids.sort((a, b) => a - b);
        }
        for (const entityMap of this.entityMaps) {
            entityMap.sortedUids = entityMap.sortedUids.filter((uid) => !entityUpdate.deletedEntities.includes(uid));
        }
        while (reader.canRead()) {
            const entityMapId = reader.u32();
            if (entityMapId === undefined) {
                return undefined;
            }
            const entityMap = this.entityMaps.find((e) => e.id === entityMapId);
            if (entityMap === undefined) {
                return undefined;
            }
            const absentEntitiesFlags = [];
            for (let i = 0; i < Math.floor((entityMap.sortedUids.length + 7) / 8); ++i) {
                const flag = reader.u8();
                if (flag === undefined) {
                    return undefined;
                }
                absentEntitiesFlags.push(flag);
            }
            for (let i = 0; i < entityMap.sortedUids.length; ++i) {
                const uid = entityMap.sortedUids[i];
                if ((absentEntitiesFlags[Math.floor(i / 8)] & (1 << i % 8)) !== 0) {
                    continue;
                }
                const updatedEntityFlags = [];
                for (let j = 0; j < Math.ceil(entityMap.attributes.length / 8); ++j) {
                    const flag = reader.u8();
                    if (flag === undefined) {
                        return undefined;
                    }
                    updatedEntityFlags.push(flag);
                }
                const updatedAttributes = new Map();
                const tick = this.entityList.get(uid).tick;
                for (let j = 0; j < entityMap.attributes.length; ++j) {
                    const attribute = entityMap.attributes[j];
                    if (updatedEntityFlags[Math.floor(j / 8)] & (1 << j % 8)) {
                        const value = this.decodeEntityMapAttribute(reader, attribute.type);
                        if (value === undefined) {
                            return undefined;
                        }
                        const attributeName = this.getAttributeName(attribute.nameHash);
                        tick[attributeName] = value;
                        updatedAttributes[attributeName] = { type: attribute.type, value: value };
                    }
                }
                entityUpdate.updatedEntities.set(uid, updatedAttributes);
            }
        }
        return entityUpdate;
    }
    encodeEntityUpdate(entityUpdate) {
        const writer = new Writer_1.BufferWriter(0);
        writer.u8(Packets_1.PacketId.EntityUpdate);
        writer.u32(entityUpdate.tick);
        writer.i8(entityUpdate.deletedEntities.length);
        for (const uid of entityUpdate.deletedEntities)
            writer.u32(uid);
        const entityMaps = this.entityMaps.filter((map) => entityUpdate.createdEntities?.some((uid) => map.sortedUids?.includes(uid)));
        writer.i8(entityMaps.length);
        for (const entityMap of entityMaps) {
            const brandNewEntities = entityUpdate.createdEntities.filter((uid) => entityMap.sortedUids?.includes(uid));
            writer.i8(brandNewEntities.length);
            writer.u32(entityMap.id);
            for (const uid of brandNewEntities) {
                writer.u32(uid);
            }
        }
        for (const entityMap of this.entityMaps) {
            const filteredUids = entityMap.sortedUids.filter((uid) => !entityUpdate.deletedEntities.includes(uid));
            if (filteredUids.length === 0) {
                continue;
            }
            writer.u32(entityMap.id);
            for (let i = 0; i < Math.ceil(filteredUids.length / 8); ++i) {
                let byte = 0;
                for (let j = 0; j < 8; j++) {
                    const index = i * 8 + j;
                    if (index >= filteredUids.length) {
                        break;
                    }
                    const uid = filteredUids[index];
                    if (!entityUpdate.updatedEntities?.has(uid)) {
                        byte |= 1 << j;
                    }
                }
                writer.u8(byte);
            }
            for (const uid of filteredUids) {
                const entity = this.entityList.get(uid);
                if (entity === undefined) {
                    continue;
                }
                const updatedAttributes = entityUpdate.updatedEntities.get(uid);
                if (updatedAttributes === undefined) {
                    continue;
                }
                const updatedFlags = Array(Math.ceil(entityMap.attributes.length / 8)).fill(0);
                const updatedValues = [];
                for (let i = 0; i < entityMap.attributes.length; ++i) {
                    const attribute = entityMap.attributes[i];
                    const attributeName = this.getAttributeName(attribute.nameHash);
                    if (Array.from(updatedAttributes.keys()).includes(attributeName)) {
                        updatedFlags[Math.floor(i / 8)] |= 1 << i % 8;
                        updatedValues.push({
                            type: attribute.type,
                            value: entity.tick[attributeName],
                        });
                    }
                }
                if (!updatedFlags.some((f) => f !== 0)) {
                    continue;
                }
                for (const flag of updatedFlags)
                    writer.u8(flag);
                for (const { type, value } of updatedValues)
                    this.encodeEntityMapAttribute(writer, type, value);
            }
        }
        return new Uint8Array(writer.view.buffer.slice(0, writer.offset));
    }
    decodeEnterWorldRequest(data) {
        const reader = new Reader_1.BufferReader(data, 1);
        const displayName = reader.string();
        if (displayName === undefined) {
            return undefined;
        }
        const version = reader.u32();
        if (version === undefined) {
            return undefined;
        }
        const pow = reader.u8arr8();
        if (pow === undefined) {
            return undefined;
        }
        const proofOfWork = new Uint8Array(pow);
        return { displayName, version, proofOfWork };
    }
    encodeEnterWorldRequest(request) {
        const writer = new Writer_1.BufferWriter();
        writer.u8(Packets_1.PacketId.EnterWorld);
        writer.string(request.displayName);
        writer.u32(request.version);
        writer.u8arr8(request.proofOfWork);
        return new Uint8Array(writer.view.buffer);
    }
    decodeRpc(def, data, udp) {
        const reader = new Reader_1.BufferReader(data, 1);
        let decoded;
        let metadata = { udpCookie: undefined, tick: undefined, transport: udp ? "udp" : "tcp" };
        if (udp) {
            metadata.udpCookie = reader.u32();
        }
        reader.offset += 4;
        const rpc = this.rpcMapping.Rpcs.find((r) => r.NameHash === def.nameHash);
        if (def.isArray) {
            const length = reader.u16();
            if (length === undefined) {
                return undefined;
            }
            decoded = new Array(length);
            for (let i = 0; i < length; ++i) {
                const obj = this.decodeRpcObject(rpc, def, reader);
                if (obj === undefined) {
                    return undefined;
                }
                decoded[i] = obj;
            }
        }
        else {
            decoded = this.decodeRpcObject(rpc, def, reader);
            if (decoded === undefined) {
                return undefined;
            }
            metadata.tick = reader.u32();
        }
        return { name: rpc?.ClassName ?? `R_0x${def.nameHash.toString(16)}`, data: decoded, metadata: metadata };
    }
    encodeRpc(name, data, udp = false, tick) {
        const writer = new Writer_1.BufferWriter();
        const rpc = this.rpcMapping.Rpcs.find((r) => r.ClassName === name);
        if (rpc === undefined) {
            return undefined;
        }
        const def = this.enterWorldResponse.rpcs.find((r) => r.nameHash === rpc.NameHash);
        if (def === undefined) {
            return undefined;
        }
        writer.u8(udp ? Packets_1.PacketId.UdpRpc : Packets_1.PacketId.Rpc);
        if (udp) {
            writer.u32(this.enterWorldResponse.udpCookie);
        }
        writer.u32(def.index);
        if (rpc.IsArray) {
            const dataArray = data;
            writer.u16(dataArray.length);
            for (const obj of dataArray) {
                this.encodeRpcObject(rpc, def, writer, obj);
            }
        }
        else {
            this.encodeRpcObject(rpc, def, writer, data);
            if (tick !== undefined) {
                writer.u32(tick);
            }
        }
        if (udp) {
            return new Uint8Array(writer.view.buffer);
        }
        else {
            return this.crypto.cryptRpc(new Uint8Array(writer.view.buffer));
        }
    }
    decodeUdpConnectRequest(data) {
        const reader = new Reader_1.BufferReader(data, 1);
        const request = {};
        request.cookie = reader.u32();
        if (request.cookie === undefined) {
            return undefined;
        }
        if (request.cookie !== this.enterWorldResponse.udpCookie) {
            return undefined;
        }
        return request;
    }
    encodeUdpConnectRequest(request) {
        const writer = new Writer_1.BufferWriter();
        writer.u8(Packets_1.PacketId.UdpConnect);
        writer.u32(request.cookie);
        return new Uint8Array(writer.view.buffer);
    }
    decodeUdpConnectResponse(data) {
        const reader = new Reader_1.BufferReader(data, 1);
        const response = {};
        response.cookie = reader.u32();
        if (response.cookie === undefined) {
            return undefined;
        }
        if (response.cookie !== this.enterWorldResponse.udpCookie) {
            return undefined;
        }
        response.mtu = reader.u32();
        if (response.mtu === undefined) {
            return undefined;
        }
        return response;
    }
    encodeUdpConnectResponse(request) {
        const writer = new Writer_1.BufferWriter();
        writer.u8(Packets_1.PacketId.UdpConnect);
        writer.u32(request.cookie);
        writer.u32(request.mtu);
        return new Uint8Array(writer.view.buffer);
    }
    // TODO: encodeUdpFragment()
    decodeUdpFragment(data) {
        const reader = new Reader_1.BufferReader(data, 1);
        const fragment = {};
        fragment.cookie = reader.u32();
        if (fragment.cookie === undefined) {
            return undefined;
        }
        if (fragment.cookie !== this.enterWorldResponse.udpCookie) {
            return undefined;
        }
        fragment.fragmentId = reader.u32();
        if (fragment.fragmentId === undefined) {
            return undefined;
        }
        fragment.fragmentNumber = reader.u8();
        if (fragment.fragmentNumber === undefined) {
            return undefined;
        }
        fragment.totalFragments = reader.u8();
        if (fragment.totalFragments === undefined) {
            return undefined;
        }
        fragment.fragmentLength = data.length - 11;
        fragment.fragment = reader.u8arr(fragment.fragmentLength);
        if (fragment.fragment === undefined) {
            return undefined;
        }
        let fragments = this.fragments.get(fragment.fragmentId);
        if (!fragments) {
            fragments = [];
            this.fragments.set(fragment.fragmentId, fragments);
        }
        fragments.push(fragment);
        let buffer;
        if (fragments.length === fragment.totalFragments) {
            let totalLength = fragments.reduce((v, f) => v + f.fragment.length, 0);
            buffer = new Uint8Array(totalLength);
            let offset = 0;
            fragments.sort((a, b) => a.fragmentNumber - b.fragmentNumber);
            for (const f of fragments) {
                buffer.set(f.fragment, offset);
                offset += f.fragment.length;
            }
            this.fragments.delete(fragment.fragmentId);
        }
        return { fragment: fragment, buffer: buffer };
    }
    // TODO: encodeUdpTick()
    decodeUdpTick(data, compressed) {
        const reader = new Reader_1.BufferReader(data, 1);
        const udpTick = {};
        udpTick.byteLength = reader.view.byteLength;
        udpTick.deletedEntities = [];
        udpTick.createdEntities = [];
        udpTick.updatedEntities = new Map();
        udpTick.cookie = reader.u32();
        if (udpTick.cookie === undefined) {
            return undefined;
        }
        if (udpTick.cookie !== this.enterWorldResponse.udpCookie) {
            return undefined;
        }
        udpTick.tick = reader.u32();
        if (udpTick.tick === undefined) {
            return undefined;
        }
        if (udpTick.tick < this.highestTickSeen) {
            return undefined;
        }
        const uidsReadTemporary = [];
        let uidCursor = 0;
        if (compressed) {
            const uidsReadTemporaryCount = reader.u16();
            if (uidsReadTemporaryCount === undefined) {
                return undefined;
            }
            let lastUid = 0;
            for (let i = 0; i < uidsReadTemporaryCount; ++i) {
                const delta = reader.i8();
                if (delta === undefined) {
                    return undefined;
                }
                if (delta === -128) {
                    const uid = reader.u32();
                    if (uid === undefined) {
                        return undefined;
                    }
                    lastUid = uid;
                }
                else {
                    lastUid += delta;
                }
                uidsReadTemporary.push(lastUid);
            }
        }
        const deletedEntitiesCount = reader.u16();
        if (deletedEntitiesCount === undefined) {
            return undefined;
        }
        for (let i = 0; i < deletedEntitiesCount; ++i) {
            const uid = compressed ? uidsReadTemporary[uidCursor++] : reader.u32();
            if (uid === undefined) {
                return undefined;
            }
            udpTick.deletedEntities.push(uid);
            this.entityList.delete(uid);
        }
        const newEntitiesCount = reader.u16();
        if (newEntitiesCount === undefined) {
            return undefined;
        }
        for (let i = 0; i < newEntitiesCount; ++i) {
            const entityMapIndex = reader.u8();
            if (entityMapIndex === undefined) {
                return undefined;
            }
            const entityMap = this.entityMaps[entityMapIndex];
            if (entityMap === undefined) {
                return undefined;
            }
            const uid = compressed ? uidsReadTemporary[uidCursor++] : reader.u32();
            if (uid === undefined) {
                return undefined;
            }
            if (!this.entityList.has(uid)) {
                udpTick.createdEntities.push(uid);
                this.entityList.set(uid, {
                    uid: uid,
                    type: entityMap.id,
                    tick: structuredClone(entityMap.defaultTick),
                });
            }
        }
        const updatedEntitiesCount = reader.u16();
        if (updatedEntitiesCount === undefined) {
            return undefined;
        }
        for (let i = 0; i < updatedEntitiesCount; ++i) {
            const uid = compressed ? uidsReadTemporary[uidCursor++] : reader.u32();
            if (uid === undefined) {
                return undefined;
            }
            const entity = this.entityList.get(uid);
            if (entity === undefined) {
                return undefined;
            }
            const entityMap = this.entityMaps.find((e) => e.id == entity.type);
            if (entityMap === undefined) {
                return undefined;
            }
            const updatedAttributesCount = reader.u8();
            if (updatedAttributesCount === undefined) {
                return undefined;
            }
            const updatedAttributes = new Map();
            for (let i = 0; i < updatedAttributesCount; ++i) {
                const attributeIndex = reader.u8();
                if (attributeIndex === undefined) {
                    return undefined;
                }
                const attribute = entityMap.attributes[attributeIndex];
                if (attribute === undefined) {
                    return undefined;
                }
                const value = this.decodeEntityMapAttribute(reader, attribute.type);
                if (value === undefined) {
                    return undefined;
                }
                const name = this.getAttributeName(attribute.nameHash);
                entity.tick[name] = value;
                updatedAttributes[name] = { type: attribute.type, value: value };
            }
            udpTick.updatedEntities.set(uid, updatedAttributes);
        }
        this.highestTickSeen = udpTick.tick;
        return udpTick;
    }
    decodeUdpAckTickRequest(data) {
        const reader = new Reader_1.BufferReader(data, 1);
        const request = {};
        request.cookie = reader.u32();
        if (request.cookie === undefined) {
            return undefined;
        }
        request.tick = reader.u32();
        if (request.tick === undefined) {
            return undefined;
        }
        return request;
    }
    encodeUdpAckTickRequest(request) {
        const writer = new Writer_1.BufferWriter();
        writer.u8(Packets_1.PacketId.UdpAckTick);
        writer.u32(request.cookie);
        writer.u32(request.tick);
        return new Uint8Array(writer.view.buffer);
    }
}
exports.Codec = Codec;
const paramTypeSizeMap = {
    [Packets_1.ParameterType.Uint32]: 32,
    [Packets_1.ParameterType.Int32]: 32,
    [Packets_1.ParameterType.Float]: 32,
    [Packets_1.ParameterType.String]: -1,
    [Packets_1.ParameterType.Uint64]: 64,
    [Packets_1.ParameterType.Int64]: 64,
    [Packets_1.ParameterType.Uint16]: 16,
    [Packets_1.ParameterType.Int16]: 16,
    [Packets_1.ParameterType.Uint8]: 8,
    [Packets_1.ParameterType.Int8]: 8,
    [Packets_1.ParameterType.VectorUint8]: -1,
    [Packets_1.ParameterType.CompressedString]: -1,
};
