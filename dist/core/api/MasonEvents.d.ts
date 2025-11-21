import { ApiClan, ApiFriend, ApiFriendRequest, ApiParty, ApiPartyInvite, ApiPartyMetadata, ApiPartyPlayer, ApiServer, ApiUser, SocketIOSessionData } from "../../types/Api";
export interface MasonEvents {
    clansData: (clans: ApiClan[]) => void;
    partyInviteReceived: (partyInvite: ApiPartyInvite) => void;
    partyData: (party: ApiParty) => void;
    friendsData: (friends: ApiFriend[]) => void;
    partyStateUpdated: (state: string) => void;
    partyLeft: () => void;
    partyPlayerJoined: (partyPlayer: ApiPartyPlayer) => void;
    partyVersionUpdated: (version: string) => void;
    partyMetadataUpdated: (metadata: ApiPartyMetadata) => void;
    partyPlatformUpdated: (platform: string) => void;
    partyGameModeUpdated: (gameMode: string) => void;
    friendUpdated: (friend: ApiFriend) => void;
    partyJoinServer: (server: ApiServer) => void;
    friendRequestRejected: (friendRequest: ApiFriendRequest) => void;
    partyPlayerUpdated: (partyPlayer: ApiPartyPlayer) => void;
    friendDeleted: (friend: ApiFriend) => void;
    friendRequests: (friendRequests: ApiFriendRequest[]) => void;
    partyPlayerLeft: (partyPlayer: ApiPartyPlayer) => void;
    loggedIn: (userData: ApiUser) => void;
    partyAutofillUpdated: (autoFill: boolean) => void;
    friendRequestReceived: (friendRequest: ApiFriendRequest) => void;
    partyRegionUpdated: (region: string) => void;
    socketIoSessionData: (data: SocketIOSessionData) => void;
    any: (event: string, data: any) => void;
}
