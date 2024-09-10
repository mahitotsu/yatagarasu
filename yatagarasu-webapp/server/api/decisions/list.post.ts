import { repository } from "./repository";

export default defineEventHandler(async (event) => {
    return repository.list();
})