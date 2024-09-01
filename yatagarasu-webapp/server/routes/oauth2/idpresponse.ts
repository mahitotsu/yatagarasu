export default defineEventHandler((event) => {
    return JSON.stringify(event.node.req.headers, null, 4);
});