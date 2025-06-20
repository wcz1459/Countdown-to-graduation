// functions/api/messages.js
async function handleGet(context) {
    const { env } = context;
    try {
        const { results } = await env.DB.prepare(
            "SELECT id, username, content, timestamp, likes FROM messages ORDER BY timestamp DESC"
        ).all();
        return Response.json(results);
    } catch (e) {
        console.error('获取留言失败:', e);
        return new Response('获取留言失败: ' + e.message, { status: 500 });
    }
}

async function handlePost(context) {
    const { request, env } = context;
    try {
        const { username, content } = await request.json();
        if (!username || !content || username.trim() === '' || content.trim() === '') {
            return new Response('用户名和内容不能为空', { status: 400 });
        }
        await env.DB.prepare(
            "INSERT INTO messages (username, content, likes) VALUES (?, ?, 0)"
        ).bind(username.slice(0, 50), content.slice(0, 500)).run();
        return new Response('留言成功', { status: 201 });
    } catch (e) {
        console.error('新增留言失败:', e);
        return new Response('服务器内部错误: ' + e.message, { status: 500 });
    }
}

async function handlePut(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const messageId = url.searchParams.get('like');
    if (!messageId) return new Response('缺少消息ID', { status: 400 });
    try {
        await env.DB.prepare("UPDATE messages SET likes = likes + 1 WHERE id = ?").bind(messageId).run();
        return new Response('点赞成功', { status: 200 });
    } catch (e) {
        console.error('点赞失败:', e);
        return new Response('点赞操作失败: ' + e.message, { status: 500 });
    }
}

export async function onRequest(context) {
    switch (context.request.method) {
        case 'GET': return await handleGet(context);
        case 'POST': return await handlePost(context);
        case 'PUT': return await handlePut(context);
        default: return new Response('不被允许的方法', { status: 405, headers: { 'Allow': 'GET, POST, PUT' } });
    }
}