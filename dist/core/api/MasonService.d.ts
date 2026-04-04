import { Agent } from "node:http";
import { WebSocket } from "ws";
import { MasonEvents } from "./MasonEvents";
import { ServerRegion } from "../../types/Api";
import { TypedEmitter } from "../../utility/TypedEmitter";
export interface MasonServiceOptions {
    url?: string;
    proxy?: Agent;
}
export declare class MasonService extends TypedEmitter<MasonEvents> {
    socket: WebSocket;
    constructor(options?: MasonServiceOptions);
    static parse(message: string): {
        event: string;
        parameter: any;
    } | undefined;
    static stringify(event: string, data: any): string;
    send(data: string): void;
    shutdown(): void;
    sendPing(): void;
    acceptFriendRequest(friendCode: string): void;
    setStatus(status: "online" | "ingame" | "offline"): void;
    createParty(): void;
    deleteFriend(friendId: string): void;
    logout(): void;
    joinParty(partyKey: string): void;
    leaveParty(): void;
    login(userKey: string): void;
    refresh(): void;
    rejectFriendRequest(friendCode: string): void;
    restartPartyMatchmaking(): void;
    sendClanMessage(clanId: string, message: string): void;
    sendFriendRequest(friendCode: string): void;
    sendPartyInvite(userId: string): void;
    sendPrivateMessage(friendId: string, message: string): void;
    setIsInRound(inRound: boolean): void;
    setName(name: string): void;
    setPartyAutofill(autofill: boolean): void;
    setPartyGameMode(gameMode: "Solo" | "Duo" | "Squad" | "Limited" | "CrystalClash" | "Hangout" | "PrivateZombieDuo" | "PrivateZombieSquad"): void;
    setPartyRegion(region: "vultr-frankfurt" | "vultr-miami" | "vultr-la" | "vultr-singapore" | "i3d-oceania" | ServerRegion): void;
    setPartyTournamentCode(code: string): void;
    setPartyVersion(version: string): void;
    setPlatform(platform: "android" | "web" | "windows" | "ios"): void;
    setReady(ready: boolean): void;
    setVersion(version: string): void;
}
