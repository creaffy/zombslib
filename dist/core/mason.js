"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MasonService = void 0;
const node_events_1 = require("node:events");
const ws_1 = require("ws");
class MasonService extends node_events_1.EventEmitter {
    on(event, listener) {
        return super.on(event, listener);
    }
    constructor(url = "wss://mason-ipv4.zombsroyale.io/gateway/?EIO=4&transport=websocket") {
        super();
        this.socket = new ws_1.WebSocket(url);
        this.socket.on("error", (err) => {
            this.emit("error", err);
        });
        this.socket.on("open", () => {
            this.emit("open");
        });
        this.socket.on("close", (code, reason) => {
            this.emit("close", code, reason);
        });
        this.socket.on("message", (data, isBinary) => {
            if (!isBinary && data.toString().startsWith("42")) {
                const parsed = JSON.parse(data.toString().slice(2));
                const event = parsed[0];
                let parameter = parsed[1];
                if (event === "partyMetadataUpdated")
                    parameter = JSON.parse(parameter);
                else if (event === "loggedIn")
                    parameter = parameter.userData;
                this.emit("any", event, parameter);
                this.emit(event, parameter);
            }
        });
    }
    shutdown() {
        this.socket.close();
    }
    sendPing() {
        this.socket.send("2");
    }
    acceptFriendRequest(friendCode) {
        this.socket.send(`42["acceptFriendRequest", "${friendCode}"]`);
    }
    setStatus(status) {
        this.socket.send(`42["setStatus", "${status}"]`);
    }
    createParty() {
        this.socket.send(`42["createParty"]`);
    }
    deleteFriend(friendId) {
        this.socket.send(`42["deleteFriend", "${friendId}"]`);
    }
    logout() {
        this.socket.send(`42["logout"]`);
    }
    joinParty(partyKey) {
        this.socket.send(`42["joinParty", "${partyKey}"]`);
    }
    leaveParty() {
        this.socket.send(`42["leaveParty"]`);
    }
    login(userKey) {
        this.socket.send(`42["login", "${userKey}"]`);
    }
    refresh() {
        this.socket.send(`42["refresh"]`);
    }
    rejectFriendRequest(friendCode) {
        this.socket.send(`42["rejectFriendRequest", "${friendCode}"]`);
    }
    restartPartyMatchmaking() {
        this.socket.send(`42["restartPartyMatchmaking"]`);
    }
    sendClanMessage(clanId, message) {
        this.socket.send(`42["sendClanMessage", "${clanId}", "${message}"]`);
    }
    sendFriendRequest(friendCode) {
        this.socket.send(`42["sendFriendRequest", "${friendCode}"]`);
    }
    sendPartyInvite(userId) {
        this.socket.send(`42["sendPartyInvite", "${userId}"]`);
    }
    sendPrivateMessage(friendId, message) {
        this.socket.send(`42["sendPrivateMessage", "${friendId}", "${message}"]`);
    }
    setIsInRound(inRound) {
        this.socket.send(`42["setIsInRound", "${inRound}"]`);
    }
    setName(name) {
        this.socket.send(`42["setName", "${name}"]`);
    }
    setPartyAutofill(autofill) {
        this.socket.send(`42["setPartyAutofill", "${autofill}"]`);
    }
    setPartyGameMode(gameMode) {
        this.socket.send(`42["setPartyGameMode", "${gameMode}"]`);
    }
    setPartyRegion(region) {
        this.socket.send(`42["setPartyRegion", "${region}"]`);
    }
    setPartyTournamentCode(code) {
        this.socket.send(`42["setPartyTournamentCode", "${code}"]`);
    }
    setPartyVersion(version) {
        this.socket.send(`42["setPartyVersion", "${version}"]`);
    }
    setPlatform(platform) {
        this.socket.send(`42["setPlatform", "${platform}"]`);
    }
    setReady(ready) {
        this.socket.send(`42["setReady", "${ready}"]`);
    }
    setVersion(version) {
        this.socket.send(`42["setVersion", "${version}"]`);
    }
}
exports.MasonService = MasonService;
