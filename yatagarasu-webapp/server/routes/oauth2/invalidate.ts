const html = `<!DOCTYPE html>
    <html>
        <head>
            <title></title>
        </head>
        <body>
            <p>Your session has expired for security reasons. Please sign in again to continue from <a href="/oauth2/signout">here</a>.</p>
        </body>
    </html>
    `;

export default defineEventHandler(async (event) => {
    return send(event, html, 'text/html');
})