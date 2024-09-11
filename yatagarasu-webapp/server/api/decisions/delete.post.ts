import { dataAccessor } from "~/utils/data-accessor";

export default defineEventHandler(async (event) => {

    const id = await readBody(event).then(body => body.id);
    const accessor = dataAccessor();    
    accessor.set(id, undefined);
    return;
});