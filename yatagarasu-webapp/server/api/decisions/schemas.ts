import { z } from 'zod';

const decisionStatusSchema = z.enum(['draft', 'proposed', 'accepted', 'rejected', 'superseded']);
const decisionSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    status: decisionStatusSchema,
    context: z.string(),
    decision: z.string().nullable(),
    consequences: z.string().nullable(),
    created: z.date(),
    modified: z.date(),
});

export type Decision = z.infer<typeof decisionSchema>;