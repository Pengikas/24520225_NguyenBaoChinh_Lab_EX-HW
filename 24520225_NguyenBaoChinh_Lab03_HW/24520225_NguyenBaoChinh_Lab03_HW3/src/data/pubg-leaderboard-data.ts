import type {
    PubgVnSquadStanding,
    PubgKillFeedEvent,
} from '../types/pubg-vn-arena-contract';

export const INITIAL_SQUAD_STANDINGS: PubgVnSquadStanding[] = [
    {
        squadId: 'te',
        squadName: 'The Expendables',
        wwcdCount: 3,
        placementPts: 85,
        killPts: 72,
    },
    {
        squadId: 'ces',
        squadName: 'Cerberus Esports',
        wwcdCount: 2,
        placementPts: 78,
        killPts: 81,
    },
    {
        squadId: 'roy',
        squadName: 'Roy Esports',
        wwcdCount: 1,
        placementPts: 65,
        killPts: 68,
    },
    {
        squadId: 'agg',
        squadName: 'AGG',
        wwcdCount: 2,
        placementPts: 70,
        killPts: 59,
    },
];

export const INITIAL_KILL_FEED: PubgKillFeedEvent[] = [
    {
        id: 'event-001',
        squadId: 'te',
        squadName: 'The Expendables',
        killer: 'TE_Player01',
        victim: 'CES_Player02',
        weapon: 'M416',
        eventType: 'KILL',
        timestamp: Date.now() - 10000,
    },
    {
        id: 'event-002',
        squadId: 'ces',
        squadName: 'Cerberus Esports',
        killer: 'CES_Player01',
        victim: 'ROY_Player03',
        weapon: 'AWM',
        eventType: 'KNOCK',
        timestamp: Date.now() - 20000,
    },
    {
        id: 'event-003',
        squadId: 'roy',
        squadName: 'Roy Esports',
        killer: 'ROY_Player01',
        victim: 'AGG_Player02',
        weapon: 'Beryl M762',
        eventType: 'ELIMINATION',
        timestamp: Date.now() - 30000,
    },
    {
        id: 'event-004',
        squadId: 'agg',
        squadName: 'AGG',
        killer: 'AGG_Player01',
        victim: 'TE_Player03',
        weapon: 'Mini14',
        eventType: 'KILL',
        timestamp: Date.now() - 40000,
    },
    {
        id: 'event-005',
        squadId: 'te',
        squadName: 'The Expendables',
        killer: 'TE_Player02',
        victim: 'ROY_Player02',
        weapon: 'AKM',
        eventType: 'KNOCK',
        timestamp: Date.now() - 50000,
    },
];
