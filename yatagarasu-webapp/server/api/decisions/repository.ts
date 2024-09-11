import { Decision } from "./schemas";

const decisions = {} as { [key: string]: Decision };

export const repository = {

    list: async () => {
        return Object.values(decisions);
    },

    save: async (decision: Decision) => {
        if (decision.created == null) {
            const now = new Date();
            now.setHours(0, 0, 0, 0);
            const date = now.toDateString();
            decision.created = date;
            decision.modified = date;
        }
        decisions[decision.id] = decision;
        return decision;
    },

    get: async (id: string) => {
        return decisions[id];
    }
}