# zombslib

Inspired by [Zombs.io Client Library](https://github.com/particle99/zombs-client-library-ts), **zombslib** allows you to create and manage artificial connections to [ZombsRoyale.io](https://zombsroyale.io/) servers.

## Main purpose

The idea behind zombslib is to lay the foundation for all future ZR network based projects. It is supposed to be a minimal library focused on delivering an easy-to-use artificial player controller API with little to none extra features in order to stay clean and reliable.

For more information regarding API, Mason and The Protocol, refer to the community-maintained [ZombsRoyale.io Wiki](https://zombsroyale.wiki).

## Example usage

### I. Matchmaking

In ZR, to enter matchmaking and get a connection url to a game server, you first need to go through Mason Service.

```ts
const mason = new MasonService();
mason.on("open", () => {
    setInterval(() => mason.sendPing(), 55 * 1000);
    mason.createParty();
    mason.setPartyRegion("vultr-frankfurt");
    mason.setPartyGameMode("Solo");
    mason.setReady(true);
});
```

### II. Entering the game

Upon registering in the matchmaking system, Mason will send you information regarding the server it has picked for you, you can then create a connection to the actual game server.

```ts
mason.on("partyJoinServer", (server: ApiServer) => {
    const game = new Game(server, "Player");
});
```

You must wait for the server to accept your connection and send you an EnterWorldResponse to begin sending RPC's.

```ts
game.on("EnterWorldResponse", (response: EnterWorldResponse) => {
    if (response.allowed) {
        game.setPlatformRpc("android");
        game.startTcpStreamRpc(0, 0);
        game.loginRpc("deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
    }
});
```

### III. Game API

The server will begin sending you entity updates once you've delivered it SetPlatformRpc and StartTcpStreamRpc. After sending those, you're free to do anything with your bot. **zombslib** offers a rich API designed for easy access to all RPC's and the entity list.

```ts
// Iterating players
game.on("EntityUpdate", (update: EntityUpdate) => {
    for (const [uid, entity] of game.getEntityList()) {
        if (entity.modelHash === ModelHash.PlayerHash) {
            // ...
        }
    }
});

// Echo example
game.on("ReceiveChatMessageRpc", (rpc: ReceiveChatMessageRpc) => {
    if (rpc.uid !== game.getUid()) {
        game.sendChatMessageRpc("Local", rpc.message);
    }
});
```

## Future goals

-   Platform support:

    -   Support multiple mapping files,
    -   Emulate anticheat's behavior (Windows).

-   Protocol support:

    -   Allow for game server connection over UDP.

-   API support:

    -   Add a complete module to make utilizing game's REST API easier.

-   Documentation:

    -   Create a detailed documentation of Mason, ZR API, in-game Protocol and all their components.
