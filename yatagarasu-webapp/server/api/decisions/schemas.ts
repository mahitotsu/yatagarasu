import { z } from 'zod';

const decisionStatusSchema = z.enum([
    'DRAFT', 'PROPOSED', 'ACCEPTED', 'REJECTED', 'SUPERSEDED'
]);

export const decisionSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    status: decisionStatusSchema,
    context: z.string().nullish(),
    decision: z.string().nullish(),
    consequences: z.string().nullish(),
    created: z.string().nullish(),
    modified: z.string().nullish(),
});
export type Decision = z.infer<typeof decisionSchema>;