import {
    ApiServer,
    EnterWorldResponse,
    Game,
    MasonService,
    LoginResponseRpc,
    SocketIOSessionData,
    ItemSkinSlot,
    RestClient,
    ApiItem,
} from "zombslib";

const mason = new MasonService();
const api = new RestClient();

mason.on("socketIoSessionData", (d: SocketIOSessionData) => {
    setInterval(() => mason.sendPing(), d.pingInterval);
    mason.createParty();
    mason.setPartyGameMode("Solo");
    mason.setPartyRegion("vultr-frankfurt");
    mason.setReady(true);
});

mason.on("partyJoinServer", (s: ApiServer) => {
    const game = new Game(s, { displayName: "Donald Tusk" });

    game.on("EnterWorldResponse", (r: EnterWorldResponse) => {
        if (r.allowed) {
            game.setPlatformRpc("android");
            game.startTcpStreamRpc(0, 0);
            game.loginRpc("deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
        }
    });

    game.on("LoginResponseRpc", (rpc: LoginResponseRpc) => {
        api.getShop().then((s: ApiShop) => {
            game.setSkinRpc([
                {
                    slot: ItemSkinSlot.Weapon,
                    subSlot: 0,
                    skinId: s.items.find((i: ApiItem) => i.name === "Noobhammer")!.id!,
                },
                {
                    slot: ItemSkinSlot.PlayerParachute,
                    subSlot: 0,
                    skinId: s.items.find((i: ApiItem) => i.name === "Umbrella (Blue)")!.id!,
                },
            ]);
        });
    });
});
