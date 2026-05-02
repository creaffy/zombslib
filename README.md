# DISCONTINUED ❌

Following recent game updates, dumping the protocol has become a task far more complex and time-intensive than we can reasonably sustain. As a result, we have unfortunately been forced to abandon this project. 

Thanks for stopping by. <br/>
_\~ xor&pray_

# zombslib

Easily create interactive bots for [ZombsRoyale.io](https://zombsroyale.io/).

## Installation

Zombslib is not available through the npm registry, however you can still easily install it like so:

```
npm install creaffy/zombslib
```

A more detailed documentation for this library is available on [ZR Wiki](https://zombs.wiki/zombslib/home/). In case something is not clearly explained there, consider joining our [Discord server](https://discord.gg/E5QWPx6TrX).

## Features

- **Game Session** <br/>
  Establish and manage live connections to the in-game servers.

- **High-Level Events** <br/>
  Subscribe to world updates, RPCs, and social events through a unified event system.

- **Protocol Reimplementation** <br/>
  Encode or decode all kinds of packets.

- **Mason Service** <br/>
  Manage parties, friends and enter matchmaking via the MasonService wrapper.

- **REST API** <br/>
  Simple wrapper for all endpoints.

- **Entity Utilities** <br/>
  Query players and other world entities by type, UID, or name with convenient lookups.

## Usage

Basic in-game bot example:

```ts
import {
    ApiServer,
    EnterWorldResponse,
    Game,
    KillFeedRpc,
    MasonService,
    SocketIOSessionData,
    UdpConnectResponse,
    UdpTick,
    ServerRegion,
} from "zombslib";

const mason = new MasonService();
mason.once("socketIoSessionData", (d: SocketIOSessionData) => {
    mason.createParty();
    mason.setPartyGameMode("Solo");
    mason.setPartyRegion(ServerRegion.USWest);
    mason.setReady(true);
});

mason.once("partyJoinServer", (server: ApiServer) => {
    const game = new Game(server, { displayName: "Example", udp: true });

    game.once("EnterWorldResponse", (r: EnterWorldResponse) => game.setPlatformRpc("android"));
    game.once("UdpConnectResponse", (r: UdpConnectResponse) => game.startUdpStreamRpc());

    game.on("EntityUpdate", (u: UdpTick) => {
        const bot = game.getSelf();
        if (bot?.tick?.currentAmmo === 0) {
            game.reloadRpc();
        }
    });

    game.on("KillFeedRpc", (rpc: KillFeedRpc) => {
        game.sendChatMessageRpc("Party", `${rpc.killer} killed ${rpc.victim}`);
    });
});
```

Here are some more simple usage examples: <br/>

- **[examples/echo.ts](examples/echo.ts)** - Repeat all chat messages coming from other players.<br/>
- **[examples/leaderboard.ts](examples/leaderboard.ts)** - Fetch from the API and print the leaderboard.<br/>
- **[examples/cosmetics.ts](examples/cosmetics.ts)** - Query cosmetics' data by name and equip them in-game.

## Disclaimer

This project is unofficial and not affiliated with Zombs Royale or Endgame.
Use responsibly and at your own risk.
