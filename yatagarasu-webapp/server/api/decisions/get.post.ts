import * as uuid from 'uuid';
import { repository } from "./repository";
import { Decision } from "./schemas";

const get = async (id: string) => {
    return repository.get(id);
}

const create = async (id: string) => {
    return {
        id: uuid.v7(),
        title: `Decision - ${id.toUpperCase()}`,
        status: 'DRAFT',
    } as Decision;
}

export default defineEventHandler(async (event) => {
    return readBody(event).then(b => {
        return b.id
            ? get(b.id)
            : create(uuid.v7());
    });
})