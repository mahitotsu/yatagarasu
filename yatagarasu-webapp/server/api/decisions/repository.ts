import { Decision } from "./schemas";

const decisions = {} as { [key: string]: Decision };
export const repository = {
    list: async () => { return Object.values(decisions); },
}