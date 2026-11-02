export type DropPhase =
    | 'WARMUP'
    | 'AIRDROP_LIVE'
    | 'LOOTED_OUT'
    | 'EXPIRED';

export interface PubgCrateDrop {
    readonly id: string;
    readonly title: string;
    readonly priceVnd: number;
    readonly remainingStock: number;
    readonly dropEpochMs: number;
}

export interface PubgClaimResult {
    success: boolean;
    statusCode: 200 | 408 | 409 | 410 | 503;
    message: string;
    claimId: string;
    dropId: string;
    timestamp?: number;
}

export interface PubgVnSquadStanding {
    readonly squadId: string;
    readonly squadName: string;
    readonly wwcdCount: number;
    readonly placementPts: number;
    readonly killPts: number;
}

export type LeaderboardSortBy =
    | 'wwcdCount'
    | 'placementPts'
    | 'killPts';

export type SortDirection = 'asc' | 'desc';

export interface PubgKillFeedEvent {
    readonly id: string;
    readonly squadId: string;
    readonly squadName: string;
    readonly killer: string;
    readonly victim: string;
    readonly weapon: string;
    readonly eventType: 'KILL' | 'KNOCK' | 'ELIMINATION';
    readonly timestamp: number;
}
