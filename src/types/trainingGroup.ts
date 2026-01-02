export interface GroupUserRef {
    id?: string;
    _id?: string;
    fullName?: string;
    username?: string;
    photoUrl?: string;
}

export interface TrainingGroupSummary {
    id: string;
    name: string;
    description?: string;
    owner?: GroupUserRef | string;
    membersCount: number;
    isMember?: boolean;
    hasPendingRequest?: boolean;
    hasPendingInvite?: boolean;
    pendingRequestsCount?: number;
    createdAt?: string;
    members?: GroupMember[];
    pendingRequests?: GroupJoinRequest[];
    memberInvites?: GroupMemberInvite[];
}

export interface GroupJoinRequest {
    id: string;
    fullName?: string;
    username?: string;
    photoUrl?: string;
    requestedAt?: string;
}

export interface GroupMemberInvite {
    id: string;
    fullName?: string;
    username?: string;
    photoUrl?: string;
    invitedAt?: string;
    invitedBy?: string;
}

export interface CreateTrainingGroupPayload {
    name: string;
    description?: string;
}

export interface UpdateTrainingGroupPayload {
    name: string;
    description?: string;
}

export interface GroupMember {
    id: string;
    fullName?: string;
    username?: string;
    photoUrl?: string;
    joinedAt?: string;
}
