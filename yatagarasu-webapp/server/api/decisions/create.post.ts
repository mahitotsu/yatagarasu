import * as uuid from 'uuid';
import { Decision } from "~/types";

export default defineEventHandler(async (event) => {

    const id = uuid.v4();
    const decision = {
        id,
        title: `Decision_${id.toUpperCase()}`,
        status: 'DRAFTED',
    } as Decision;

    return decision;
})