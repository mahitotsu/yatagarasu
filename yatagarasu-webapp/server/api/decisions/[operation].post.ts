import { EventHandlerRequest, H3Event } from 'h3';
import * as uuid from 'uuid';
import { z } from 'zod';

// ==========
// Scehmas
// ==========
const idRequestParam = z.object({
    id: z.string().uuid(),
});
const contentRequestParam = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
});
const operationSchemas = {
    create: contentRequestParam,
    update: idRequestParam.merge(contentRequestParam),
    remove: idRequestParam,
    get: idRequestParam,
    list: z.object({}),
}

const itemSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
});

// ==========
// Types
// ==========
type Operation = keyof typeof operationSchemas;
type Item = z.infer<typeof itemSchema>;

// ==========
// in-memory DB
// ==========
const itemRepository = {} as Record<string, Item>

// ==========
// Operations
// ==========
const handlers = {
    //
    create: async (event: H3Event<EventHandlerRequest>) => {
        const params = operationSchemas.create.parse(await readBody(event));
        const item = {
            id: uuid.v7(),
            title: params.title ?? '',
            description: params.description ?? '',
        };
        itemRepository[item.id] = item;
        return item;
    },
    //
    update: async (event: H3Event<EventHandlerRequest>) => {
        const params = operationSchemas.update.parse(event.context.params);
        const item = itemRepository[params.id];
        if (!item) {
            return sendError(event, createError({ statusCode: 404, statusMessage: 'Item not found' }));
        }
        item.title = params.title ?? item.title;
        item.description = params.description ?? item.description;
        return item;
    },
    //
    remove: async (event: H3Event<EventHandlerRequest>) => {
        const params = operationSchemas.remove.parse(event.context.params);
        const item = itemRepository[params.id];
        delete itemRepository[params.id];
        return item;
    },
    //
    get: async (event: H3Event<EventHandlerRequest>) => {
        const params = operationSchemas.get.parse(event.context.params);
        const item = itemRepository[params.id];
        if (!item) {
            return sendError(event, createError({ statusCode: 404, statusMessage: 'Item not found' }));
        }
        return item;
    },
    //
    list: async (event: H3Event<EventHandlerRequest>) => {
        return Object.values(itemRepository);
    },
}

// ==========
// EventHandler
// ==========
export default defineEventHandler(async (event) => {

    const operation = event.context.params?.operation as Operation;
    if (!Object.keys(operationSchemas).includes(operation)) {
        return sendError(event, createError({ statusCode: 400, statusMessage: 'Invalid operation' }));
    }

    return handlers[operation](event)
})