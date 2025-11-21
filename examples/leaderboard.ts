import { ApiLeaderboardResponse, RestClient } from "zombslib";

const api = new RestClient({ unsafe: true });

api.getLeaderboard({
    mode: "duo",
    time: "all",
    category: "rounds",
}).then((r: ApiLeaderboardResponse) => {
    if (r.status === "success") {
        console.log(r.players);
    }
});
