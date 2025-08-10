import { ApiClan, ApiFriend, ApiFriendRequest, ApiParty, ApiPartyInvite, ApiPartyMetadata, ApiPartyPlayer, ApiServer, ApiUser } from "../../../types/Api";
export interface MasonEvents {
    clansData: (clans: ApiClan[]) => void;
    partyInviteReceived: (partyInvite: ApiPartyInvite) => void;
    partyData: (party: ApiParty) => void;
    friendsData: (friends: ApiFriend[]) => void;
    partyStateUpdated: (state: string) => void;
    partyLeft: () => void;
    partyPlayerJoined: (player: ApiPartyPlayer) => void;
    partyVersionUpdated: (version: string) => void;
    partyMetadataUpdated: (metadata: ApiPartyMetadata) => void;
    partyGameModeUpdated: (gameMode: string) => void;
    friendUpdated: (friend: ApiFriend) => void;
    partyJoinServer: (party: ApiServer) => void;
    friendRequestRejected: (friendRequest: ApiFriendRequest) => void;
    partyPlayerUpdated: (player: ApiPartyPlayer) => void;
    friendDeleted: (friend: ApiFriend) => void;
    friendRequests: (friendRequests: ApiFriendRequest[]) => void;
    partyPlayerLeft: (player: ApiPartyPlayer) => void;
    loggedIn: (userData: ApiUser) => void;
    partyAutofillUpdated: (autoFill: boolean) => void;
    friendRequestReceived: (friendRequest: ApiFriendRequest) => void;
    partyRegionUpdated: (region: string) => void;
    any: (event: string, data: any) => void;
}
