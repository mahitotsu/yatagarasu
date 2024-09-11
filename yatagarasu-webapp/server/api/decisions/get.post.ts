import { Decision } from "~/types";
import { dataAccessor } from "~/utils/data-accessor";

export default defineEventHandler(async (event) => {

    const id = await readBody(event).then(body => body.id as string);
    const accessor = dataAccessor();    
    return accessor.get(id) as Decision;
});
