import { EventEmitter } from "node:events";
import { RawData, WebSocket } from "ws";
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
    // privateMessageReceived: () => void;
    friendUpdated: (friend: ApiFriend) => void;
    partyJoinServer: (party: ApiServer) => void;
    friendRequestRejected: (friendRequest: ApiFriendRequest) => void;
    partyPlayerUpdated: (player: ApiPartyPlayer) => void;
    friendDeleted: (friend: ApiFriend) => void;
    friendRequests: (friendRequests: ApiFriendRequest[]) => void;
    partyPlayerLeft: (player: ApiPartyPlayer) => void;
    // clanMessageReceived: () => void;
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

export class MasonService extends EventEmitter {
    private socket: WebSocket;

    override on<K extends keyof MasonEvents>(event: K, listener: MasonEvents[K]): this;

    override on(event: string, listener: (...args: any[]) => void): this;

    override on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    public constructor(options?: MasonServiceOptions) {
        super();

        const url = options?.url ?? "wss://mason-ipv4.zombsroyale.io/gateway/?EIO=4&transport=websocket";
        const proxy = options?.proxy;

        this.socket = new WebSocket(url, { agent: proxy });

        this.socket.on("error", (err: Error) => {
            this.emit("error", err);
        });

        this.socket.on("open", () => {
            this.emit("open");
        });

        this.socket.on("close", (code: number, reason: Buffer) => {
            this.emit("close", code, reason);
        });

        this.socket.on("message", (data: RawData, isBinary: boolean) => {
            if (!isBinary && data.toString().startsWith("42")) {
                const parsed = JSON.parse(data.toString().slice(2));
                const event = parsed[0];
                let parameter = parsed[1];

                if (event === "partyMetadataUpdated") parameter = JSON.parse(parameter);
                else if (event === "loggedIn") parameter = parameter.userData;

                this.emit("any", event, parameter);
                this.emit(event, parameter);
            }
        });
    }

    public shutdown(): void {
        this.socket.close();
    }

    public sendPing(): void {
        this.socket.send("2");
    }

    public acceptFriendRequest(friendCode: string): void {
        this.socket.send(`42["acceptFriendRequest", "${friendCode}"]`);
    }

    public setStatus(status: "online" | "ingame"): void {
        this.socket.send(`42["setStatus", "${status}"]`);
    }

    public createParty(): void {
        this.socket.send(`42["createParty"]`);
    }

    public deleteFriend(friendId: string): void {
        this.socket.send(`42["deleteFriend", "${friendId}"]`);
    }

    public logout(): void {
        this.socket.send(`42["logout"]`);
    }

    public joinParty(partyKey: string): void {
        this.socket.send(`42["joinParty", "${partyKey}"]`);
    }

    public leaveParty(): void {
        this.socket.send(`42["leaveParty"]`);
    }

    public login(userKey: string) {
        this.socket.send(`42["login", "${userKey}"]`);
    }

    public refresh() {
        this.socket.send(`42["refresh"]`);
    }

    public rejectFriendRequest(friendCode: string): void {
        this.socket.send(`42["rejectFriendRequest", "${friendCode}"]`);
    }

    public restartPartyMatchmaking(): void {
        this.socket.send(`42["restartPartyMatchmaking"]`);
    }

    public sendClanMessage(clanId: string, message: string): void {
        this.socket.send(`42["sendClanMessage", "${clanId}", "${message}"]`);
    }

    public sendFriendRequest(friendCode: string): void {
        this.socket.send(`42["sendFriendRequest", "${friendCode}"]`);
    }

    public sendPartyInvite(userId: string): void {
        this.socket.send(`42["sendPartyInvite", "${userId}"]`);
    }

    public sendPrivateMessage(friendId: string, message: string): void {
        this.socket.send(`42["sendPrivateMessage", "${friendId}", "${message}"]`);
    }

    public setIsInRound(inRound: boolean): void {
        this.socket.send(`42["setIsInRound", "${inRound}"]`);
    }

    public setName(name: string): void {
        this.socket.send(`42["setName", "${name}"]`);
    }

    public setPartyAutofill(autofill: boolean): void {
        this.socket.send(`42["setPartyAutofill", "${autofill}"]`);
    }

    public setPartyGameMode(
        gameMode:
            | "Solo"
            | "Duo"
            | "Squad"
            | "Limited"
            | "CrystalClash"
            | "Hangout"
            | "PrivateZombieDuo"
            | "PrivateZombieSquad"
    ): void {
        this.socket.send(`42["setPartyGameMode", "${gameMode}"]`);
    }

    public setPartyRegion(
        region: "vultr-frankfurt" | "vultr-miami" | "vultr-la" | "vultr-singapore" | "i3d-oceania"
    ): void {
        this.socket.send(`42["setPartyRegion", "${region}"]`);
    }

    public setPartyTournamentCode(code: string): void {
        this.socket.send(`42["setPartyTournamentCode", "${code}"]`);
    }

    public setPartyVersion(version: string): void {
        this.socket.send(`42["setPartyVersion", "${version}"]`);
    }

    public setPlatform(platform: "android" | "web" | "windows" | "ios"): void {
        this.socket.send(`42["setPlatform", "${platform}"]`);
    }

    public setReady(ready: boolean): void {
        this.socket.send(`42["setReady", "${ready}"]`);
    }

    public setVersion(version: string): void {
        this.socket.send(`42["setVersion", "${version}"]`);
    }
}
