"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestClient = void 0;
class RestClient {
    constructor(options) {
        this.url = options?.url ?? "https://zombsroyale.io";
        this.unsafe = options?.unsafe ?? false;
    }
    async makeRequest(endpoint, options) {
        const { method = "GET", queryParams, body } = options || {};
        const queryString = queryParams
            ? "?" +
                Object.entries(queryParams)
                    .filter(([k, v]) => v !== undefined)
                    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
                    .join("&")
            : "";
        const url = this.url + endpoint + queryString;
        const fetchOptions = { method };
        if (body) {
            fetchOptions.body = JSON.stringify(body);
            fetchOptions.headers = { "Content-Type": "application/json" };
        }
        const response = await fetch(url, fetchOptions);
        return (await response.json());
    }
    async getUser(userKey) {
        return this.makeRequest(`/api/user/${userKey}`);
    }
    async buyItem(userKey, options) {
        if (this.unsafe) {
            return this.makeRequest(`/api/user/${userKey}/buy`, {
                method: "POST",
                queryParams: options,
            });
        }
        else {
            throw new Error("RestClient.buyItem() is not allowed in safe mode.");
        }
    }
    async clearSessions(userKey) {
        if (this.unsafe) {
            return this.makeRequest(`/api/user/${userKey}/clear-sessions`, {
                method: "POST",
            });
        }
        else {
            throw new Error("RestClient.clearSessions() is not allowed in safe mode.");
        }
    }
    async deleteAccount(userKey, confirmationKey) {
        if (this.unsafe) {
            return this.makeRequest(`/api/user/${userKey}/delete-account`, {
                method: "POST",
                queryParams: { confirmationKey: confirmationKey },
            });
        }
        else {
            throw new Error("RestClient.deleteAccount() is not allowed in safe mode.");
        }
    }
    async updateFriendCode(userKey, name) {
        if (this.unsafe) {
            return this.makeRequest(`/api/user/${userKey}/friend-code/update`, {
                method: "POST",
                queryParams: { name: name },
            });
        }
        else {
            throw new Error("RestClient.updateFriendCode() is not allowed in safe mode.");
        }
    }
    async openPack(userKey, packId) {
        if (this.unsafe) {
            return this.makeRequest(`/api/user/${userKey}/pack/open`, {
                method: "POST",
                queryParams: { packId: packId },
            });
        }
        else {
            throw new Error("RestClient.openPack() is not allowed in safe mode.");
        }
    }
    async getRewards(userKey) {
        return this.makeRequest(`/api/user/${userKey}/rewards`);
    }
    async claimRewards(userKey, type) {
        if (this.unsafe) {
            return this.makeRequest(`/api/user/${userKey}/rewards/claim`, {
                method: "POST",
                queryParams: { type: type },
            });
        }
        else {
            throw new Error("RestClient.claimRewards() is not allowed in safe mode.");
        }
    }
    async getProfile(friendCode, userKey) {
        return this.makeRequest(`/api/profile/${friendCode}`, {
            queryParams: { userKey: userKey },
        });
    }
    async getTournamentStatus(tournamentCode, userKey) {
        return this.makeRequest(`/api/tournament/${tournamentCode}/join`, {
            queryParams: { userKey: userKey },
        });
    }
    async getQuests(userKey) {
        return this.makeRequest(`/api/quest/available`, {
            queryParams: { userKey: userKey },
        });
    }
    async getConfig(options) {
        return this.makeRequest("/api/config", {
            queryParams: options,
        });
    }
    async getLeaderboard(options) {
        return this.makeRequest("/api/leaderboard/live", {
            queryParams: options,
        });
    }
    async getPolls(userKey) {
        return this.makeRequest("/api/poll/available", {
            queryParams: { userKey: userKey },
        });
    }
    async voteInPoll(pollId, optionId, userKey) {
        if (this.unsafe) {
            return this.makeRequest(`/api/poll/vote/${pollId}`, {
                method: "POST",
                queryParams: { optionId: optionId, userKey: userKey },
            });
        }
        else {
            throw new Error("RestClient.voteInPoll() is not allowed in safe mode.");
        }
    }
    async getShop(options) {
        return this.makeRequest("/api/shop/available", {
            queryParams: options,
        });
    }
    async buyTrack(trackId, userKey) {
        if (this.unsafe) {
            return this.makeRequest(`/api/reward/track/${trackId}/buy`, {
                method: "POST",
                queryParams: { userKey: userKey },
            });
        }
        else {
            throw new Error("RestClient.buyTrack() is not allowed in safe mode.");
        }
    }
    async skipTrack(trackId, tiers, userKey) {
        if (this.unsafe) {
            return this.makeRequest(`/api/reward/track/${trackId}/skip`, {
                method: "POST",
                queryParams: { tiers: tiers, userKey: userKey },
            });
        }
        else {
            throw new Error("RestClient.skipTrack() is not allowed in safe mode.");
        }
    }
    async getTracks(userKey) {
        return this.makeRequest(`/api/reward/tracks`, {
            queryParams: { userKey: userKey },
        });
    }
    async validateDevice(deviceId) {
        return this.makeRequest(`/api/validate/device/${deviceId}`, {
            method: "POST",
        });
    }
}
exports.RestClient = RestClient;
