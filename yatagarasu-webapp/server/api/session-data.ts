import { getSessionData } from "~/utils/session-controller";


export default defineEventHandler(async (event) => {
    return getSessionData(event);
})