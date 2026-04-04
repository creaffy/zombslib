import { EventEmitter } from "node:events";
import { Agent } from "node:http";
import { RawData, WebSocket } from "ws";
import { MasonEvents } from "./MasonEvents";
import { ServerRegion } from "../../types/Api";
import { TypedEmitter } from "../../utility/TypedEmitter";

export interface MasonServiceOptions {
    url?: string;
    proxy?: Agent;
}

export class MasonService extends TypedEmitter<MasonEvents> {
    public socket: WebSocket;

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
            if (isBinary) {
                return;
            }

            const message = data.toString();
            const parsed = MasonService.parse(message);
            if (parsed === undefined) {
                return;
            }

            this.emit("any", parsed.event, parsed.parameter, message);
            this.emit(parsed.event, parsed.parameter);
        });
    }

    public static parse(message: string) {
        try {
            if (message.startsWith("42")) {
                const jsonData = JSON.parse(message.slice(2));
                const event = jsonData[0] as string;
                let parameter = jsonData[1];
                if (event === "partyMetadataUpdated") {
                    parameter = JSON.parse(parameter);
                } else if (event === "loggedIn") {
                    parameter = parameter.userData;
                }
                return { event, parameter };
            } else if (message.startsWith("0")) {
                const jsonData = JSON.parse(message.slice(1));
                return { event: "socketIoSessionData", parameter: jsonData };
            }
        } catch (e) {
            return undefined;
        }
    }

    // Only supports message payloads (42)
    public static stringify(event: string, data: any) {
        let message = `42["${event}",`;
        if (event === "partyMetadataUpdated") {
            message += `${JSON.stringify(JSON.stringify(data))}`;
        } else if (event === "loggedIn") {
            message += JSON.stringify({ userData: data });
        } else {
            message += JSON.stringify(data);
        }
        message += "]";
        return message;
    }

    public send(data: string): void {
        this.socket.send(data);
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

    public setStatus(status: "online" | "ingame" | "offline"): void {
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
            | "PrivateZombieSquad",
    ): void {
        this.socket.send(`42["setPartyGameMode", "${gameMode}"]`);
    }

    public setPartyRegion(
        region: "vultr-frankfurt" | "vultr-miami" | "vultr-la" | "vultr-singapore" | "i3d-oceania" | ServerRegion,
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
