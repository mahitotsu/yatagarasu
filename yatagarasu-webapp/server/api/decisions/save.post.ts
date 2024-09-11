import { repository } from "./repository";
import { decisionSchema } from "./schemas";

export default defineEventHandler(async (event) => {
    return await readBody(event)
        .then(b => decisionSchema.parse(b))
        .then(decision => {
            return repository.save(decision)
        });
})