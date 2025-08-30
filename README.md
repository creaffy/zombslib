# zombslib

Create and manage artificial connections to [ZombsRoyale.io](https://zombsroyale.io/) servers.

## Installation

Zombslib is not in the npm registry, however you can still easily install it like so:

```properties
npm i https://github.com/creaffy/zombslib
```

Full guide/documentation for this library is available on [ZR Wiki](https://zombsroyale.wiki/zombslib/home/). In case something is not clearly explained there, consider joining our [Discord server](https://discord.gg/E5QWPx6TrX).

## Examples

You can find some simple usage examples in this repo:<br/>
**[examples/echo.ts](examples/echo.ts)** - Repeat all chat messages coming from other players.<br/>
**[examples/leaderboard.ts](examples/leaderboard.ts)** - Fetch and print the leaderboard.<br/>
**[examples/leaderboard.ts](examples/cosmetics.ts)** - Query cosmetic id's in the shop and equip them in-game.

## Status quo

As of right now, we support the following:

-   `API`: Wrapper for the ZR REST API.
-   `In-game`: Reimplementation of the in-game protocol with a powerful API.
-   `MasonService`: Wrapper for the ZR Social and Matchmaking platform.

What we're missing:

-   `UDP support`: Zombslib has no support for communicating with the in-game server over UDP.
-   `Error checking`: This library is admittedly not the greatest code we've ever written. In most places, we're assuming that everything went smoothly without running almost any checks on what the server has sent.

## Future

Will this be maintained in the future? We don't know, maybe, if we feel like it. No promises.
