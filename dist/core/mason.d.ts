import { EventEmitter } from "node:events";
import {
    ApiClan,
    ApiFriend,
    ApiFriendRequest,
    ApiParty,
    ApiPartyInvite,
    ApiPartyMetadata,
    ApiPartyPlayer,
    ApiServer,
    ApiUser,
} from "../types/api";
import { Agent } from "node:http";
interface MasonEvents {
    clansData: (clans: ApiClan[]) => void;
    partyInviteReceived: (partyInvites: ApiPartyInvite) => void;
    partyData: (party: ApiParty) => void;
    friendsData: (friends: ApiFriend[]) => void;
    partyStateUpdated: (state: string) => void;
    partyLeft: () => void;
    partyPlayerJoined: (player: ApiPartyPlayer) => void;
    partyVersionUpdated: (version: string) => void;
    partyMetadataUpdated: (metadata: ApiPartyMetadata) => void;
    partyGameModeUpdated: (gameMode: string) => void;
    friendUpdated: (friend: ApiFriend) => void;
    partyJoinServer: (party: ApiServer) => void;
    friendRequestRejected: (friendRequest: ApiFriendRequest) => void;
    partyPlayerUpdated: (player: ApiPartyPlayer) => void;
    friendDeleted: (friend: ApiFriend) => void;
    friendRequests: (friendRequests: ApiFriendRequest[]) => void;
    partyPlayerLeft: (player: ApiPartyPlayer) => void;
    loggedIn: (userData: ApiUser) => void;
    partyAutofillUpdated: (autofill: boolean) => void;
    friendRequestReceived: (friendRequest: ApiFriendRequest) => void;
    partyRegionUpdated: (region: string) => void;
    any: (event: string, data: any) => void;
}
export interface MasonServiceOptions {
    url?: string;
    proxy?: Agent;
}
export declare class MasonService extends EventEmitter {
    private socket;
    on<K extends keyof MasonEvents>(event: K, listener: MasonEvents[K]): this;
    on(event: string, listener: (...args: any[]) => void): this;
    constructor(options?: MasonServiceOptions);
    shutdown(): void;
    sendPing(): void;
    acceptFriendRequest(friendCode: string): void;
    setStatus(status: "online" | "ingame"): void;
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
    setPartyGameMode(
        gameMode:
            | "Solo"
            | "Duo"
            | "Squad"
            | "Limited"
            | "CrystalClash"
            | "Hangout"
            | "PrivateZombieDuo"
            | "PrivateZombieSquad"
    ): void;
    setPartyRegion(region: "vultr-frankfurt" | "vultr-miami" | "vultr-la" | "vultr-singapore" | "i3d-oceania"): void;
    setPartyTournamentCode(code: string): void;
    setPartyVersion(version: string): void;
    setPlatform(platform: "android" | "web" | "windows" | "ios"): void;
    setReady(ready: boolean): void;
    setVersion(version: string): void;
}
export {};
