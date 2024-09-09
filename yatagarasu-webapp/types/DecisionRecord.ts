export enum DRStatus {
    PROPOSED = 'PROPOSED',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    DEPRECATED = 'DEPRECATED',
    SUPERSEDED = 'SUPERSEDED',
}

export interface DecisionRecord {
    id: string;
    timestamp: Date;
    title: string;
    status: DRStatus;
}

export interface DRDetails extends DecisionRecord {
    context: string;
    decision: string;
    consequences: string;
    alternatives?: string;
}