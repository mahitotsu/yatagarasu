import { Decision } from "~/types";
import { dataAccessor } from "~/utils/data-accessor";

export default defineEventHandler(async (event) => {

    const decision = await readBody(event).then(body => body as Decision);
    const accessor = dataAccessor();    
    accessor.set(decision.id, decision);
    return decision;
});