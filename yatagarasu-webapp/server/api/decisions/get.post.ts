import { Decision } from "~/types";
import { dataAccessor } from "~/utils/data-accessor";

export default defineEventHandler(async (event) => {

    const id = await readBody(event).then(body => body.id);
    const accessor = dataAccessor();

    if (id) {
        return accessor.get(id) as Decision;
    } else {
        return {
            title: `New Decision ${new Date().toISOString()}`,
            status: 'DRAFTED',
        } as Decision;
    }
});
