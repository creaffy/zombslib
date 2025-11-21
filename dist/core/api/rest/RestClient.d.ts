import { ApiBuyRewardTrackResponse, ApiGetConfigResponse, ApiGetUserResponse, ApiLeaderboardResponse, ApiPackOpenResponse, ApiPollAvailableResponse, ApiProfileResponse, ApiQuestAvailableResponse, ApiResponse, ApiShopAvailableResponse, ApiSkipRewardTrackResponse, ApiUserBuyItemResponse, ApiUserRewardsClaimResponse, ApiUserRewardsResponse, ApiValidateDeviceResponse } from "../../../types/Api";
export interface RestClientOptions {
    url?: string;
    unsafe?: boolean;
}
export declare class RestClient {
    private url;
    private unsafe;
    constructor(options?: RestClientOptions);
    makeRequest<T>(endpoint: string, options?: {
        method?: "GET" | "POST";
        queryParams?: Record<string, any>;
        body?: any;
    }): Promise<T>;
    getUser(userKey: string): Promise<ApiGetUserResponse>;
    buyItem(userKey: string, options: {
        quantity: number;
        timedDealId?: number;
        itemId?: number;
        packId?: number;
    }): Promise<ApiUserBuyItemResponse>;
    clearSessions(userKey: string): Promise<ApiResponse>;
    deleteAccount(userKey: string, confirmationKey: string): Promise<ApiResponse>;
    updateFriendCode(userKey: string, name: string): Promise<ApiGetUserResponse>;
    openPack(userKey: string, packId: number): Promise<ApiPackOpenResponse>;
    getRewards(userKey: string): Promise<ApiUserRewardsResponse>;
    claimRewards(userKey: string, type: "first" | "gift" | "recurring" | "bonus" | "instagram" | "nitro" | "coming_soon"): Promise<ApiUserRewardsClaimResponse>;
    getProfile(friendCode: string, userKey: string): Promise<ApiProfileResponse>;
    getTournamentStatus(tournamentCode: string, userKey: string): Promise<ApiResponse>;
    getQuests(userKey?: string): Promise<ApiQuestAvailableResponse>;
    getConfig(options?: {
        platform?: string;
        version?: string;
        version2?: number;
        userKey?: string;
        isPolledUpdate?: boolean;
    }): Promise<ApiGetConfigResponse>;
    getLeaderboard(options?: {
        userKey?: string;
        mode?: "solo" | "duo" | "squad" | "limited";
        time?: "24h" | "7d" | "1m" | "all";
        category?: "wins" | "kills" | "kills_per_round" | "winrate" | "time_alive" | "rounds" | "top10";
    }): Promise<ApiLeaderboardResponse>;
    getPolls(userKey: string): Promise<ApiPollAvailableResponse>;
    voteInPoll(pollId: number, optionId: number, userKey: string): Promise<ApiResponse>;
    getShop(options?: {
        userKey?: string;
        sections?: "all" | "items" | "iaps" | "packs" | "timedDeals";
    }): Promise<ApiShopAvailableResponse>;
    buyTrack(trackId: number, userKey: string): Promise<ApiBuyRewardTrackResponse>;
    skipTrack(trackId: number, tiers: number, userKey: string): Promise<ApiSkipRewardTrackResponse>;
    getTracks(userKey?: string): Promise<ApiBuyRewardTrackResponse>;
    validateDevice(deviceId: string): Promise<ApiValidateDeviceResponse>;
}
