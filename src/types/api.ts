export interface ApiServer {
    version: number;
    mode: string;
    status: string;
    players: number;
    ipv4: string;
    ipv6: string;
    enabled: boolean;
    proxyIndex: number;
    hostname: string;
    hostnameV4: string;
    endpoint: string;
    endpoints: string[];
    hostnames: string[];
    hostnamesV4: string[];
    discreteFourierTransformBias: number;
    id: string;
}

export interface ApiPartyPlayer {
    id: string;
    name: string;
    ready: boolean;
    leader: boolean;
    level: number;
    inRound: boolean;
}

export interface ApiParty {
    key: string;
    created: number;
    updated: number;
    state: string;
    version: string;
    gameMode: string;
    metadata: string;
    region: string;
    autofill: boolean;
    players: ApiPartyPlayer[];
}

export interface ApiUserReward {
    type: string;
    itemId: number;
    itemSku: string;
    packId: number;
    packSku: string;
    quantity: number;
    duplicateItemId: number;
}

export interface ApiUserUpcomingReward extends ApiUserReward {
    level: number;
}

export interface ApiUserProgression {
    currentExperience: number;
    requiredExperience: number;
    rewards: ApiUserUpcomingReward[];
}

export interface ApiClanMember {
    id: string;
    friend_code: string;
    name: string;
    avatar: string;
    status: string;
}

export interface ApiChatMessage {
    type: string;
    clan_id: string;
    user_id: string;
    friend_code: string;
    sent: string;
    body: string;
}

export interface ApiClan {
    id: string;
    creator_id: string;
    tag: string;
    name: string;
    description: string;
    privacy: string;
    region: string;
    total_members: string;
    max_members: string;
    members: ApiClanMember[];
    messages: ApiChatMessage[];
}

export interface ApiUserLicense {
    id: number;
    user_id: number;
    item_id: number;
    quantity: number;
}

export interface ApiUserPack {
    id: number;
    user_id: number;
    pack_id: number;
    quantity: number;
}

export interface ApiUserSubscription {
    id: number;
    user_id: number;
    iap_id: number;
}

export interface ApiUserIapTransaction {
    id: number;
    user_id: number;
    iap_id: number;
    cost_dollars: number;
}

export interface ApiUser {
    id: number;
    provider: string;
    identifier: string;
    name: string;
    avatar: string;
    email: string;
    friend_code: string;
    status: string;
    experience: number;
    level: number;
    coins: number;
    gems: number;
    key: string;
    encryptedKey: string;
    progression: ApiUserProgression;
    nextLevelRewards: ApiUserReward[];
    clans: ApiClan[];
    licenses: ApiUserLicense[];
    packs: ApiUserPack[];
    subscriptions: ApiUserSubscription[];
    iaps: ApiUserIapTransaction[];
}

export interface ApiResponse {
    status: string;
    message: string;
}

export interface ApiBuyRewardTrackResponse extends ApiResponse {
    user: ApiUser;
    rewards: ApiUserReward[];
}

export interface ApiClanAvailableResponse extends ApiResponse {
    clans: ApiClan[];
}

export interface ApiClanResponse extends ApiResponse {
    clan: ApiClan;
    user: ApiUser;
}

export interface ApiIap {
    id: number;
    sku: string;
    name: string;
    type: string;
    xsolla_id: number | null;
    apple_id: string;
    google_id: string;
    cost_dollars: number;
    can_purchase: boolean;
    rewards: ApiUserReward[];
}

export interface ApiCoinPackage extends ApiIap {
    quantity: number;
}

export interface ApiConfig {
    maintenance: boolean;
    update_required: boolean;
    disable_udp: boolean;
    version: string;
    environment: string;
    endpoint: string;
}

export interface ApiConfigABTest {
    id: string;
    group: string;
}

export interface ApiConfigAnnouncement {
    type: string;
    title: string;
    message: string;
    action: string;
}

export interface ApiDate {
    date: string;
    timezone: string;
}

export interface ApiConfigLimitedEvent {
    name: string;
    type: string;
    tagline: string;
    ends: ApiDate;
}

export interface ApiConfigPatchNotesItem {
    title: string;
    description: string;
    image: string;
}

export interface ApiConfigPatchNotes {
    id: string;
    title: string;
    items: ApiConfigPatchNotesItem[];
}

export interface ApiConfigFeaturedYoutuber {
    name: string;
    channel: string;
    video: string;
}

export interface ApiConfigSeasonPreview {
    season: string;
    current_day: number;
    timer_ends: string;
}

export interface ApiConfigGiveawayGroup {
    name: string;
    starts_at: string;
    ends_at: string;
    rewards: ApiUserReward[];
}

export interface ApiConfigGiveaway {
    id: string;
    name: string;
    description: string;
    groups: ApiConfigGiveawayGroup[];
}

export interface ApiConfigExtras {
    announcement: ApiConfigAnnouncement;
    limited_event: ApiConfigLimitedEvent;
    patch_notes: ApiConfigPatchNotes;
    ab_test: ApiConfigABTest;
    ab_test_2: ApiConfigABTest;
    ab_test_3: ApiConfigABTest;
    featured_youtuber: ApiConfigFeaturedYoutuber;
    season_preview: ApiConfigSeasonPreview;
    giveaway: ApiConfigGiveaway;
    changelog: string;
}

export interface ApiConfigUDPToggle {
    is_enabled: boolean;
}

export interface ApiFirstRewardAvailabilityResponse extends ApiResponse {
    available: boolean;
}

export interface ApiFirstRewardClaimResponse extends ApiResponse {
    user: ApiUser;
    reward: ApiUserReward;
}

export interface ApiFriend {
    id: string;
    friend_code: string;
    name: string;
    avatar: string;
    status: string;
}

export interface ApiFriendRequest {
    friend_code: string;
    name: string;
    avatar: string;
    sent: string;
}

export interface ApiGemPackage extends ApiIap {
    quantity: number;
}

export interface ApiGetConfigResponse extends ApiResponse {
    config: ApiConfig;
    extras: ApiConfigExtras;
}

export interface ApiGetServerResponse extends ApiResponse {
    server: ApiServer;
}

export interface ApiGetUserResponse extends ApiResponse {
    user: ApiUser;
    is_banned: boolean;
    rewards: ApiUserReward[];
}

export interface ApiGiftRewardAvailabilityResponse extends ApiResponse {
    available: boolean;
    next_at: ApiDate;
}

export interface ApiGiftRewardClaimResponse extends ApiResponse {
    user: ApiUser;
    reward: ApiUserReward;
    next_at: ApiDate;
}

export interface ApiHandleDiscordIapReceiptResponse extends ApiResponse {
    user: ApiUser;
    rewards: ApiUserReward[];
}

export interface ApiHandleUnityIapReceiptResponse extends ApiResponse {
    user: ApiUser;
    rewards: ApiUserReward[];
}

export interface ApiIapDeal extends ApiIap {}

export interface ApiInstagramRewardAvailabilityResponse extends ApiResponse {
    available: boolean;
}

export interface ApiInstagramRewardClaimResponse extends ApiResponse {
    user: ApiUser;
    reward: ApiUserReward;
}

export interface ApiItem {
    id: number;
    sku: string;
    name: string;
    type: string;
    category: string;
    rarity: string;
    cost_coins: number;
    cost_gems: number;
    is_stock: boolean;
    can_purchase: boolean;
    order: number;
}

export interface ApiJoinTournamentResponse extends ApiResponse {
    mode: string;
}

export interface ApiLeaderboardPlayer {
    name: string;
    rounds: number;
    wins: number;
    top10: number;
    winrate: number;
    kills: number;
    kills_per_round: number;
    time_alive: number;
}

export interface ApiLeaderboardResponse extends ApiResponse {
    players: ApiLeaderboardPlayer[];
    user: ApiUser;
}

export interface ApiLeaderboardUser extends ApiLeaderboardPlayer {
    rank: number;
}

export interface ApiLoggedIn {}

export interface ApiMidSeasonRewardTrackResponse extends ApiResponse {
    is_available: boolean;
    cost_gems: number;
}

export interface ApiPackReward {
    id: number;
    pack_id: number;
    item_id: number;
    item_sku: string;
    weighting: number;
}

export interface ApiPack {
    id: number;
    sku: string;
    name: string;
    cost_coins: number;
    cost_gems: number;
    can_purchase: boolean;
    rewards: ApiPackReward[];
}

export interface ApiPackOpenReward extends ApiUserReward {}

export interface ApiPackOpenResponse extends ApiResponse {
    user: ApiUser;
    rewards: ApiPackOpenReward[];
}

export interface ApiPartyInvite {
    name: string;
    key: string;
}

export interface ApiPartyMetadata {
    tournamentName: string;
    tournamentCode: string;
}

export interface ApiPollOption {
    id: number;
    name: string;
    color_code: string;
}

export interface ApiPoll {
    id: number;
    question: string;
    options: ApiPollOption[];
}

export interface ApiPollAvailableResponse extends ApiResponse {
    poll: ApiPoll[];
}

export interface ApiProfileResponse extends ApiResponse {
    user: ApiUser;
    stats: Map<string, Map<string, Map<string, string>>>;
}

export interface ApiQuestReward extends ApiUserReward {}

export interface ApiUserQuest {
    id: number;
    uiser_id: number;
    quest_id: number;
    value: number;
    is_completed: boolean;
}

export interface ApiQuest {
    id: number;
    name: string;
    stat_key: string;
    required: number;
    reward: ApiQuestReward;
    created: ApiDate;
    ends: ApiDate;
    personal: ApiUserQuest;
}

export interface ApiQuestAvailableResponse extends ApiResponse {
    quests: ApiQuest[];
}

export interface ApiRecentPlayer {
    name: string;
    friend_code: string;
    last_seen: number;
}

export interface ApiRecurringRewardAvailabilityResponse extends ApiResponse {
    available: boolean;
    claimed: number;
    total: number;
}

export interface ApiRecurringRewardClaimResponse extends ApiResponse {
    user: ApiUser;
    reward: ApiUserReward;
    available: boolean;
    claimed: number;
    total: number;
}

export interface ApiRewardTrackTierReward extends ApiUserReward {}

export interface ApiRewardTrackTier {
    id: number;
    track_id: number;
    tier: number;
    rewards: ApiRewardTrackTierReward[];
}

export interface ApiUserRewardTrackChallenge {
    id: number;
    user_id: number;
    challenge_id: number;
    value: number;
    is_completed: boolean;
}

export interface ApiRewardTrackChallenge {
    id: number;
    track_id: number;
    name: string;
    stat_key: string;
    required: number;
    created: ApiDate;
    reward: ApiRewardTrackTierReward;
    personal: ApiUserRewardTrackChallenge;
}

export interface ApiRewardTrackEvolution extends ApiRewardTrackChallenge {
    required_item_sku: string;
}

export interface ApiUserRewardTrackProgressionTier {
    currentStars: number;
    requiredStars: number;
}

export interface ApiUserRewardTrackProgressionLevel {
    currentExperience: number;
    requiredExperience: number;
}

export interface ApiUserRewardTrack {
    id: number;
    user_id: number;
    track_id: number;
    experience: number;
    level: number;
    stars: number;
    tier: number;
    has_discount_available: boolean;
    progressionTier: ApiUserRewardTrackProgressionTier;
    progressionLevel: ApiUserRewardTrackProgressionLevel;
}

export interface ApiRewardTrack {
    id: number;
    name: string;
    season: number;
    max_level: number;
    max_tier: number;
    cost_coins: number;
    cost_gems: number;
    cost_gems_per_tier: number;
    is_stock: boolean;
    is_repeatable: boolean;
    created: ApiDate;
    expires: ApiDate;
    tiers: ApiRewardTrackTier[];
    challenges: ApiRewardTrackChallenge[];
    evolutions: ApiRewardTrackEvolution;
    personal: ApiUserRewardTrack;
}

export interface ApiRewardType {
    name: string;
    is_available: boolean;
    next_at: ApiDate;
    claimed: number;
    total: number;
}

export interface ApiSession {
    experienceGained: number;
    levelsGained: number;
    coinsGained: number;
    gemsGained: number;
    packsGained: number[];
    itemsGained: number[];
}

export interface ApiTimedDeal {
    id: number;
    sku: string;
    name: string;
    cost_coins: number;
    cost_gems: number;
    undiscounted_cost_coins: number;
    undiscounted_cost_gems: number;
    can_purchase: boolean;
    rewards: ApiUserReward[];
    created: ApiDate;
    expires: ApiDate;
}

export interface ApiShopAvailableResponse extends ApiResponse {
    itemsSignature: string;
    items: ApiItem[];
    packs: ApiPack[];
    timedDeals: ApiTimedDeal[];
    iaps: ApiIap[];
}

export interface ApiSkipRewardTrackResponse extends ApiResponse {
    user: ApiUser;
    rewards: ApiUserReward[];
}

export interface ApiSubscription extends ApiResponse {}

export interface ApiUpdatePartyResponse extends ApiResponse {
    party: ApiParty;
}

export interface ApiUserBuyItemResponse extends ApiResponse {
    user: ApiUser;
    rewards: ApiUserReward[];
}

export interface ApiUserClan {
    id: number;
    clan_id: number;
}

export interface ApiUserExperienceResponse extends ApiResponse {
    user: ApiUser;
    session: ApiSession;
}

export interface ApiUserRewardsClaimResponse extends ApiResponse {
    user: ApiUser;
    rewards: ApiUserReward[];
    is_available: boolean;
    claimed: number;
    total: number;
    next_at: ApiDate;
}

export interface ApiUserRewardsResponse {
    types: ApiRewardType[];
}

export interface ApiUserStats {
    wins: number;
    kills: number;
    top10: number;
    rounds: number;
}

export interface ApiValidateLoginResponse extends ApiResponse {
    user: ApiUser;
    firstLogin: boolean;
}

export interface ApiValidateAppleResponse extends ApiValidateLoginResponse {}

export interface ApiValidateDeviceResponse extends ApiValidateLoginResponse {}

export interface ApiValidateDiscordResponse extends ApiValidateLoginResponse {}

export interface ApiValidateFacebookResponse extends ApiValidateLoginResponse {}

export interface ApiValidateGameCenterResponse
    extends ApiValidateLoginResponse {}

export interface ApiValidateGoogleResponse extends ApiValidateLoginResponse {}

export interface ApiVideoRewardAvailabilityResponse extends ApiResponse {
    available: boolean;
    next_at: ApiDate;
}

export interface ApiVideoRewardClaimResponse extends ApiResponse {
    user: ApiUser;
    reward: ApiUserReward;
    next_at: ApiDate;
}
