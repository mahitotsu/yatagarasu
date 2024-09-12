export const DecisionStattusOptions = {
    DRAFTED: 'DRAFTED',
    PROPSED: 'PROPSED',
    ACCEPTED: 'ACCEPTED',
    REJECTED: 'REJECTED',
    SUPERSEDED: 'SUPERSEDED',
} as const;

export interface Decision {
    id: string;
    title: string;
    status: typeof DecisionStattusOptions[keyof typeof DecisionStattusOptions];
    context: string;
    decision: string;
    consequence: string;
}
