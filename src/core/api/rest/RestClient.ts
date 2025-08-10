import {
    ApiBuyRewardTrackResponse,
    ApiGetConfigResponse,
    ApiGetUserResponse,
    ApiLeaderboardResponse,
    ApiPackOpenResponse,
    ApiPollAvailableResponse,
    ApiProfileResponse,
    ApiQuestAvailableResponse,
    ApiResponse,
    ApiShopAvailableResponse,
    ApiSkipRewardTrackResponse,
    ApiUserBuyItemResponse,
    ApiUserRewardsClaimResponse,
    ApiUserRewardsResponse,
    ApiValidateDeviceResponse,
} from "../../../types/Api";

export interface RestClientOptions {
    url?: string;
    unsafe?: boolean;
}

export class RestClient {
    private url: string;
    private unsafe: boolean;

    constructor(options?: RestClientOptions) {
        this.url = options?.url ?? "https://zombsroyale.io";
        this.unsafe = options?.unsafe ?? false;
    }

    public async makeRequest<T>(
        endpoint: string,
        options?: {
            method?: "GET" | "POST";
            queryParams?: Record<string, any>;
            body?: any;
        }
    ): Promise<T> {
        const { method = "GET", queryParams, body } = options || {};
        const queryString = queryParams
            ? "?" +
              Object.entries(queryParams)
                  .filter(([k, v]) => v !== undefined)
                  .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
                  .join("&")
            : "";
        const url = this.url + endpoint + queryString;
        const fetchOptions: any = { method };
        if (body) {
            fetchOptions.body = JSON.stringify(body);
            fetchOptions.headers = { "Content-Type": "application/json" };
        }
        const response = await fetch(url, fetchOptions);
        return (await response.json()) as T;
    }

    public async getUser(userKey: string) {
        return this.makeRequest<ApiGetUserResponse>(`/api/user/${userKey}`);
    }

    public async buyItem(
        userKey: string,
        options: {
            quantity: number;
            timedDealId?: number;
            itemId?: number;
            packId?: number;
        }
    ) {
        if (this.unsafe) {
            return this.makeRequest<ApiUserBuyItemResponse>(`/api/user/${userKey}/buy`, {
                method: "POST",
                queryParams: options,
            });
        } else {
            throw new Error("RestClient.buyItem() is not allowed in safe mode.");
        }
    }

    public async clearSessions(userKey: string) {
        if (this.unsafe) {
            return this.makeRequest<ApiResponse>(`/api/user/${userKey}/clear-sessions`, {
                method: "POST",
            });
        } else {
            throw new Error("RestClient.clearSessions() is not allowed in safe mode.");
        }
    }

    public async deleteAccount(userKey: string, confirmationKey: string) {
        if (this.unsafe) {
            return this.makeRequest<ApiResponse>(`/api/user/${userKey}/delete-account`, {
                method: "POST",
                queryParams: { confirmationKey: confirmationKey },
            });
        } else {
            throw new Error("RestClient.deleteAccount() is not allowed in safe mode.");
        }
    }

    public async updateFriendCode(userKey: string, name: string) {
        if (this.unsafe) {
            return this.makeRequest<ApiGetUserResponse>(`/api/user/${userKey}/friend-code/update`, {
                method: "POST",
                queryParams: { name: name },
            });
        } else {
            throw new Error("RestClient.updateFriendCode() is not allowed in safe mode.");
        }
    }

    public async openPack(userKey: string, packId: number) {
        if (this.unsafe) {
            return this.makeRequest<ApiPackOpenResponse>(`/api/user/${userKey}/pack/open`, {
                method: "POST",
                queryParams: { packId: packId },
            });
        } else {
            throw new Error("RestClient.openPack() is not allowed in safe mode.");
        }
    }

    public async getRewards(userKey: string) {
        return this.makeRequest<ApiUserRewardsResponse>(`/api/user/${userKey}/rewards`);
    }

    public async claimRewards(
        userKey: string,
        type: "first" | "gift" | "recurring" | "bonus" | "instagram" | "nitro" | "coming_soon"
    ) {
        if (this.unsafe) {
            return this.makeRequest<ApiUserRewardsClaimResponse>(`/api/user/${userKey}/rewards/claim`, {
                method: "POST",
                queryParams: { type: type },
            });
        } else {
            throw new Error("RestClient.claimRewards() is not allowed in safe mode.");
        }
    }

    public async getProfile(friendCode: string, userKey: string) {
        return this.makeRequest<ApiProfileResponse>(`/api/profile/${friendCode}`, {
            queryParams: { userKey: userKey },
        });
    }

    public async getTournamentStatus(tournamentCode: string, userKey: string) {
        return this.makeRequest<ApiResponse>(`/api/tournament/${tournamentCode}/join`, {
            queryParams: { userKey: userKey },
        });
    }

    public async getQuests(userKey?: string) {
        return this.makeRequest<ApiQuestAvailableResponse>(`/api/quest/available`, {
            queryParams: { userKey: userKey },
        });
    }

    public async getConfig(options?: {
        platform?: string;
        version?: string;
        version2?: number;
        userKey?: string;
        isPolledUpdate?: boolean;
    }) {
        return this.makeRequest<ApiGetConfigResponse>("/api/config", {
            queryParams: options,
        });
    }

    public async getLeaderboard(options?: {
        userKey?: string;
        mode?: "solo" | "duo" | "squad" | "limited";
        time?: "24h" | "7d" | "1m" | "1y" | "all";
        category?: "wins" | "kills" | "kills_per_round" | "winrate" | "time_alive" | "rounds" | "top10";
    }) {
        return this.makeRequest<ApiLeaderboardResponse>("/api/leaderboard/live", {
            queryParams: options,
        });
    }

    public async getPolls(userKey: string) {
        return this.makeRequest<ApiPollAvailableResponse>("/api/poll/available", {
            queryParams: { userKey: userKey },
        });
    }

    public async voteInPoll(pollId: number, optionId: number, userKey: string) {
        if (this.unsafe) {
            return this.makeRequest<ApiResponse>(`/api/poll/vote/${pollId}`, {
                method: "POST",
                queryParams: { optionId: optionId, userKey: userKey },
            });
        } else {
            throw new Error("RestClient.voteInPoll() is not allowed in safe mode.");
        }
    }

    public async getShop(options?: { userKey?: string; sections?: "all" | "items" | "iaps" | "packs" | "timedDeals" }) {
        return this.makeRequest<ApiShopAvailableResponse>("/api/shop/available", {
            queryParams: options,
        });
    }

    public async buyTrack(trackId: number, userKey: string) {
        if (this.unsafe) {
            return this.makeRequest<ApiBuyRewardTrackResponse>(`/api/reward/track/${trackId}/buy`, {
                method: "POST",
                queryParams: { userKey: userKey },
            });
        } else {
            throw new Error("RestClient.buyTrack() is not allowed in safe mode.");
        }
    }

    public async skipTrack(trackId: number, tiers: number, userKey: string) {
        if (this.unsafe) {
            return this.makeRequest<ApiSkipRewardTrackResponse>(`/api/reward/track/${trackId}/skip`, {
                method: "POST",
                queryParams: { tiers: tiers, userKey: userKey },
            });
        } else {
            throw new Error("RestClient.skipTrack() is not allowed in safe mode.");
        }
    }

    public async getTracks(userKey?: string) {
        return this.makeRequest<ApiBuyRewardTrackResponse>(`/api/reward/tracks`, {
            queryParams: { userKey: userKey },
        });
    }

    public async validateDevice(deviceId: string) {
        return this.makeRequest<ApiValidateDeviceResponse>(`/api/validate/device/${deviceId}`, {
            method: "POST",
        });
    }
}
