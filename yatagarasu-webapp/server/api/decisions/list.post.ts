import { Decision } from "~/types";
import { dataAccessor } from "~/utils/data-accessor";

export default defineEventHandler(async (event) => {

    const accessor = dataAccessor();
    return accessor.list().map(i => i as Decision);
});