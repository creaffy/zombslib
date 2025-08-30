import {
    ApiServer,
    EnterWorldResponse,
    Game,
    MasonService,
    ReceiveChatMessageRpc,
    SocketIOSessionData,
} from "zombslib";

const mason = new MasonService();

mason.on("socketIoSessionData", (d: SocketIOSessionData) => {
    setInterval(() => mason.sendPing(), d.pingInterval);
    mason.createParty();
    mason.setPartyTournamentCode("zcceusolo");
    mason.setPartyRegion("vultr-frankfurt");
    mason.setReady(true);
});

mason.on("partyJoinServer", (s: ApiServer) => {
    const game = new Game(s, { displayName: "Bot" });

    game.on("EnterWorldResponse", (r: EnterWorldResponse) => {
        if (r.allowed) {
            game.setPlatformRpc("android");
            game.startTcpStreamRpc(0, 0);
        }
    });

    game.on("ReceiveChatMessageRpc", (rpc: ReceiveChatMessageRpc) => {
        if (rpc.uid !== game.getMyUid()) {
            game.sendChatMessageRpc("Local", rpc.message);
            console.log(`${rpc.displayName}: ${rpc.message}`);
        }
    });
});
