import { EventEmitter } from "node:events";
import { RawData, WebSocket } from "ws";

export class MasonService extends EventEmitter {
    private socket: WebSocket;

    public constructor() {
        super();

        this.socket = new WebSocket(
            "wss://mason-ipv4.zombsroyale.io/gateway/?EIO=4&transport=websocket"
        );

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
                const parsed: any = JSON.parse(data.toString().slice(2));
                this.emit("any", [parsed[0], parsed[1]]);
                this.emit(parsed[0], parsed[1]);
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
        this.socket.send(
            `42["sendPrivateMessage", "${friendId}", "${message}"]`
        );
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

    public setPartyGameMode(gameMode: string): void {
        this.socket.send(`42["setPartyGameMode", "${gameMode}"]`);
    }

    public setPartyRegion(region: string): void {
        this.socket.send(`42["setPartyRegion", "${region}"]`);
    }

    public setPartyTournamentCode(code: string): void {
        this.socket.send(`42["setPartyTournamentCode", "${code}"]`);
    }

    public setPartyVersion(version: string): void {
        this.socket.send(`42["setPartyVersion", "${version}"]`);
    }

    public setPlatform(platform: string): void {
        this.socket.send(`42["setPlatform", "${platform}"]`);
    }

    public setReady(ready: boolean): void {
        this.socket.send(`42["setReady", "${ready}"]`);
    }

    public setVersion(version: string): void {
        this.socket.send(`42["setVersion", "${version}"]`);
    }
}
