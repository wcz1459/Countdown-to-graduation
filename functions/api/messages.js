// functions/api/messages.js

// 处理 GET 请求 (获取所有留言)
async function handleGet(context) {
    const { env } = context;
    try {
        const { results } = await env.DB.prepare(
            "SELECT id, username, content, timestamp FROM messages ORDER BY timestamp DESC"
        ).all();
        return Response.json(results);
    } catch (e) {
        console.error(e);
        return new Response('获取留言失败', { status: 500 });
    }
}

// 处理 POST 请求 (新增一条留言)
async function handlePost(context) {
    const { request, env } = context;
    try {
        const { username, content } = await request.json();

        // 基本验证
        if (!username || !content) {
            return new Response('用户名和内容不能为空', { status: 400 });
        }
        
        const { success } = await env.DB.prepare(
            "INSERT INTO messages (username, content) VALUES (?, ?)"
        ).bind(username, content).run();

        if (success) {
            return new Response('留言成功', { status: 201 });
        } else {
            return new Response('留言失败', { status: 500 });
        }
    } catch (e) {
        console.error(e);
        return new Response('服务器内部错误', { status: 500 });
    }
}

// 主处理函数，根据请求方法分发
export async function onRequest(context) {
    switch (context.request.method) {
        case 'GET':
            return await handleGet(context);
        case 'POST':
            return await handlePost(context);
        default:
            return new Response('不被允许的方法', { status: 405 });
    }
}