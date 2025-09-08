# zombslib

Create and manage artificial connections to [ZombsRoyale.io](https://zombsroyale.io/) servers.

## Installation

Zombslib is not in the npm registry, however you can still easily install it like so:

```
npm i https://github.com/creaffy/zombslib
```

Full guide/documentation for this library is available on [ZR Wiki](https://zombsroyale.wiki/zombslib/home/). In case something is not clearly explained there, consider joining our [Discord server](https://discord.gg/E5QWPx6TrX).

## Examples

You can find some simple usage examples in this repo:<br/>
**[echo.ts](examples/echo.ts)** - Repeat all chat messages coming from other players.<br/>
**[leaderboard.ts](examples/leaderboard.ts)** - Fetch and print the leaderboard.<br/>
**[cosmetics.ts](examples/cosmetics.ts)** - Query cosmetic id's in the shop and equip them in-game.

## Features

As of right now, we support the following:

-   **API** - Wrapper for the ZR REST API.
-   **In-Game** - Reimplementation of the in-game protocol with a powerful API.
-   **Mason** - Wrapper for the ZR Social and Matchmaking platform.

What we're missing:

-   **UDP** - There is currently no support for UDP communication with the in-game server.
-   **Good Code :(** - This library is admittedly not the greatest code we've ever written. In most places, no validity checks are ran on server-sent packets and we are too lazy to fix that.

## Future

Will this repo be maintained in the future? We don't know, maybe, if we feel like it. No promises.
