import { EventEmitter } from "node:events";
import { Agent } from "node:http";
import { MasonEvents } from "./MasonEvents";
export interface MasonServiceOptions {
    url?: string;
    proxy?: Agent;
}
export declare class MasonService extends EventEmitter {
    private socket;
    on<K extends keyof MasonEvents>(event: K, listener: MasonEvents[K]): this;
    on(event: string, listener: (...args: any[]) => void): this;
    constructor(options?: MasonServiceOptions);
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
    setPartyRegion(region: "vultr-frankfurt" | "vultr-miami" | "vultr-la" | "vultr-singapore" | "i3d-oceania"): void;
    setPartyTournamentCode(code: string): void;
    setPartyVersion(version: string): void;
    setPlatform(platform: "android" | "web" | "windows" | "ios"): void;
    setReady(ready: boolean): void;
    setVersion(version: string): void;
}
